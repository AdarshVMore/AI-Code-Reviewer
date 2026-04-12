import { db } from "../../../package/db/prisma.js";
import { analyzeDeploymentLogs, generateDeploymentFix } from "../../../package/ai/deployment.js";
import { fetchGithubActionLogs } from "../log-fetchers/github.logs.js";
import { getOctokit } from "../../../package/github/client.js";

export type DeploymentJobData = {
  provider: string;
  owner: string;
  repo: string;
  prNumber?: number;
  branch?: string;
  deploymentId: string;
  runId?: number;
  installationId?: number;
};

export async function runDeploymentAnalysis(data: DeploymentJobData) {
  const { provider, owner, repo, prNumber, branch, deploymentId } = data;

  const repository = await db.repository.findUnique({
    where: { owner_name: { owner, name: repo } },
  });

  if (!repository) {
    console.log(`repo ${owner}/${repo} not found — skipping deployment analysis`);
    return;
  }

  let logs = "";

  if (provider === "github_actions" && data.runId && data.installationId) {
    logs = await fetchGithubActionLogs(data.installationId, owner, repo, data.runId);
  }

  const analysis = await analyzeDeploymentLogs(logs, provider);

  const saved = await db.deployment.create({
    data: {
      repositoryId: repository.id,
      provider,
      status: "failed",
      deploymentId,
      prNumber: prNumber ?? null,
      branch: branch ?? null,
      cause: analysis?.cause ?? null,
      fix: analysis?.fix ?? null,
      rawLogs: logs,
    },
  });

  console.log(`deployment analysis saved for ${owner}/${repo} — ${provider}`);
  return saved;
}

export async function applyDeploymentFix(deploymentDbId: string) {
  const deployment = await db.deployment.findUnique({
    where: { id: deploymentDbId },
    include: { repository: true },
  });

  if (!deployment || !deployment.fix || !deployment.cause) {
    throw new Error("deployment not found or has no fix");
  }

  const octokit = await getOctokit(deployment.repository.installationId);

  const savedFix = await db.deploymentFix.create({
    data: {
      deploymentId: deploymentDbId,
      status: "pending",
    },
  });

  try {
    const branch = deployment.branch ?? "main";

    const branchRef = await octokit.rest.repos.getBranch({
      owner: deployment.repository.owner,
      repo: deployment.repository.name,
      branch,
    });

    const tree = await octokit.rest.git.getTree({
      owner: deployment.repository.owner,
      repo: deployment.repository.name,
      tree_sha: branchRef.data.commit.sha,
      recursive: "1",
    });

    const filesToFix = tree.data.tree.filter((f) => {
      if (!f.path || !f.type) return false;
      if (f.type !== "blob") return false;
      const ext = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".json", ".yaml", ".yml"];
      return ext.some((e) => f.path!.endsWith(e));
    });

    let commitSha = null;
    let totalDiff = "";

    for (const file of filesToFix.slice(0, 5)) {
      const fileRes = await octokit.rest.repos.getContent({
        owner: deployment.repository.owner,
        repo: deployment.repository.name,
        path: file.path!,
        ref: branch,
      });

      const fileData = fileRes.data as { content: string; sha: string };
      const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8");

      const result = await generateDeploymentFix(currentContent, deployment.cause!, deployment.fix!, file.path!);

      if (!result || !result.fixedContent || result.fixedContent === currentContent) continue;

      const updateRes = await octokit.rest.repos.createOrUpdateFileContents({
        owner: deployment.repository.owner,
        repo: deployment.repository.name,
        path: file.path!,
        message: `fix: resolve deployment failure — ${deployment.cause!.slice(0, 60)}`,
        content: Buffer.from(result.fixedContent).toString("base64"),
        sha: fileData.sha,
        branch,
      });

      commitSha = updateRes.data.commit.sha ?? null;
      totalDiff += `\n--- ${file.path} ---\n${result.explanation}\n`;
    }

    await db.deploymentFix.update({
      where: { id: savedFix.id },
      data: {
        status: commitSha ? "applied" : "failed",
        commitSha,
        diff: totalDiff || null,
      },
    });

    return { commitSha, diff: totalDiff };
  } catch (err) {
    await db.deploymentFix.update({
      where: { id: savedFix.id },
      data: { status: "failed" },
    });
    throw err;
  }
}
