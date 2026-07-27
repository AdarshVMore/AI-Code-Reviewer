import { db } from "../../../package/db/prisma.js";
import { generateDeploymentFix } from "../../../package/ai/deployment.js";
import { getOctokit } from "../../../package/github/client.js";

export type ApplyIssueFixResult = {
  commitSha: string | null;
  explanation?: string | null;
  alreadyApplied?: boolean;
};

export async function applyIssueFix(issueId: string): Promise<ApplyIssueFixResult> {
  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      review: {
        include: { repository: true },
      },
    },
  });

  if (!issue) {
    throw new Error("issue not found");
  }

  if (issue.status === "applied" && issue.appliedCommitSha) {
    return { commitSha: issue.appliedCommitSha, alreadyApplied: true };
  }

  if (!issue.fix) {
    throw new Error("issue has no suggested fix to apply");
  }

  const { review } = issue;
  const { repository } = review;

  const octokit = await getOctokit(repository.installationId);

  try {
    const pr = await octokit.rest.pulls.get({
      owner: repository.owner,
      repo: repository.name,
      pull_number: review.prNumber,
    });

    const branch = pr.data.head.ref;

    const fileRes = await octokit.rest.repos.getContent({
      owner: repository.owner,
      repo: repository.name,
      path: issue.file,
      ref: branch,
    });

    const fileData = fileRes.data as { content?: string; sha?: string };
    if (!fileData.content || !fileData.sha) {
      throw new Error(`could not read file content for ${issue.file}`);
    }

    const currentContent = Buffer.from(fileData.content, "base64").toString(
      "utf-8",
    );

    const result = await generateDeploymentFix(
      currentContent,
      issue.problem,
      issue.fix,
      issue.file,
    );

    if (!result?.fixedContent || result.fixedContent === currentContent) {
      await db.issue.update({
        where: { id: issueId },
        data: { status: "failed" },
      });
      throw new Error("no changes were generated for this fix");
    }

    const updateRes = await octokit.rest.repos.createOrUpdateFileContents({
      owner: repository.owner,
      repo: repository.name,
      path: issue.file,
      message: `fix: ${issue.problem.slice(0, 60)}`,
      content: Buffer.from(result.fixedContent).toString("base64"),
      sha: fileData.sha,
      branch,
    });

    const commitSha = updateRes.data.commit.sha ?? null;

    await db.issue.update({
      where: { id: issueId },
      data: {
        status: commitSha ? "applied" : "failed",
        appliedCommitSha: commitSha,
      },
    });

    return { commitSha, explanation: result.explanation };
  } catch (err) {
    await db.issue.update({
      where: { id: issueId },
      data: { status: "failed" },
    });
    throw err;
  }
}
