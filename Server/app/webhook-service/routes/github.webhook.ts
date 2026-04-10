import { Router, Request, Response } from "express";
import { verifySignature } from "../middleware/verifySignature.js";
import { createClient } from "redis";
import { db } from "../../../package/db/prisma.js";

const client = createClient();
client.connect();

const router = Router();
const GITHUB_SECRET = process.env.GITHUB_SECRET as string;

type PullRequestEvent = {
  action: "opened" | "synchronize" | "closed";
  installation: { id: number };
  pull_request: { title: string; number: number; head: { ref: string; sha: string } };
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

      console.log(`installation created: ${payload.repositories?.length ?? 0} repos stored`);
    }
  }

  if (event === "pull_request") {
    const payload = req.body as PullRequestEvent;
    const installationId = payload.installation.id;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const prNumber = payload.pull_request.number;
    console.log("------------------------------------------ All data i get in terms of repository ------------------------------------------ \n" , payload.repository)

    console.log("pull_request action:", payload.action, `${owner}/${repo}#${prNumber}`);

    if (payload.action === "opened") {
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

      const pushed = await client.lPush(
        "reviewQueue",
        JSON.stringify({ installationId, owner, repo, prNumber, prTitle: payload.pull_request.title })
      );
      console.log("pushed to queue, queue length:", pushed);
    }
  }

  res.sendStatus(200);
});

export default router;
