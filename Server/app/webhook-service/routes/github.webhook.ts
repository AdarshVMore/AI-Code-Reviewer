import { Router, Request, Response } from "express";
import { verifySignature } from "../middleware/verifySignature.js";
import { createClient } from "redis";
import { db } from "../../../package/db/prisma.js";
import { getQueueRedisConnection } from "../../../package/lib/redis.client.js";


const router = Router();
const GITHUB_SECRET = process.env.GITHUB_SECRET as string;
const WORKER_SERVICE_URL = process.env.WORKER_SERVICE_URL;

function wakeWorkerService() {
  if (!WORKER_SERVICE_URL) return;
  fetch(`${WORKER_SERVICE_URL}/health`).catch(() => {});
}

type PullRequestEvent = {
  action: "opened" | "synchronize" | "closed";
  installation: { id: number };
  pull_request: { title: string; number: number; head: { ref: string; sha: string }; user: { login: string; avatar_url: string } };
  repository: { name: string; owner: { id: number; login: string; avatar_url: string } };
};

type InstallationEvent = {
  action: "created" | "deleted";
  installation: { id: number };
  repositories: { name: string; full_name: string }[];
  sender: { login: string; id: number; avatar_url: string; email: string | null };
};

router.post("/webhook/github", async (req: Request, res: Response) => {
  if (!verifySignature(req, GITHUB_SECRET)) {
    console.log("invalid signature");
    return res.status(401).send("invalid signature");
  }

  const client = await getQueueRedisConnection()

if (!client.isOpen){
    await client.connect();
  }

  const event = req.headers["x-github-event"];
  console.log("github event received:", event);

  if (event === "installation") {
    const payload = req.body as InstallationEvent;

    if (payload.action === "created") {
      const installationId = payload.installation.id;
      const sender = payload.sender;

      const user = await db.user.upsert({
        where: { githubId: sender.id },
        update: {},
        create: {
          githubId: sender.id,
          githubUsername: sender.login,
          githubAvatar: sender.avatar_url,
          email: sender.email,
          plan: "free",
        },
      });



      for (const r of payload.repositories ?? []) {
        const [owner, name] = r.full_name.split("/");
        await db.repository.upsert({
          where: { owner_name: { owner, name } },
          update: { installationId },
          create: { owner, name, installationId, userId: user.id },
        });
      }
    }

  }

  if (event === "pull_request") {
    const payload = req.body as PullRequestEvent;
    const installationId = payload.installation.id;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const prNumber = payload.pull_request.number;

    if (payload.action === "opened" || payload.action === "synchronize") {
      client.lPush("ragData", JSON.stringify({ installationId, owner, repo }))
      const repoOwner = payload.repository.owner;

      const user = await db.user.upsert({
        where: { githubId: repoOwner.id },
        update: {},
        create: {
          githubId: repoOwner.id,
          githubUsername: repoOwner.login,
          githubAvatar: repoOwner.avatar_url,
          email: null,
          plan: "free",
        },
      });

      await db.repository.upsert({
        where: { owner_name: { owner, name: repo } },
        update: { installationId },
        create: { owner, name: repo, installationId, userId: user.id },
      });

      const repository = await db.repository.findUnique({
        where: { owner_name: { owner, name: repo } },
        select: { userId: true },
      });

      const pushed = await client.lPush(
        "reviewQueue",
        JSON.stringify({
          installationId,
          owner,
          repo,
          prNumber,
          prTitle: payload.pull_request.title,
          prAuthor: payload.pull_request.user.login,
          userId: repository?.userId ?? user.id,
        }),
      );
      console.log("pushed to queue, queue length:", pushed);
    }
  }
  
  if (event === "workflow_run") {
    const payload = req.body as any;

    if (payload.workflow_run?.conclusion === "failure") {
      const installationId = payload.installation?.id;
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const runId = payload.workflow_run.id;
      const branch = payload.workflow_run.head_branch;
      const prNumber = payload.workflow_run.pull_requests?.[0]?.number ?? null;

      await client.lPush(
        "deploymentQueue",
        JSON.stringify({
          provider: "github_actions",
          owner,
          repo,
          prNumber,
          branch,
          deploymentId: String(runId),
          runId,
          installationId,
        })
      );

      console.log(`workflow_run failure queued: ${owner}/${repo} run ${runId}`);
    }
  }

  wakeWorkerService();

  res.sendStatus(200);
});

export default router;
