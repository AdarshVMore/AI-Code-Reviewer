import { Router, Request, Response } from "express";
import { verifySignature } from "../middleware/verifySignature";
import { processPRReviewJob } from "../../worker-service/processors/review.processor";
import { createClient } from "redis";

const client = createClient()
client.connect()

const router = Router();
const GITHUB_SECRET = process.env.GITHUB_SECRET as string;

type PullRequestEvent = {
  action: "opened" | "synchronize" | "closed";
  installation: {
    id: number;
  };
  pull_request: {
    title: string;
    number: number;
    head: {
      ref: string;
      sha: string;
    };
  };
  repository: {
    name: string;
    owner: {
      login: string;
    };
  };
};

router.post("/webhook/github", async (req: Request, res: Response) => {
  if (!verifySignature(req, GITHUB_SECRET)) {
    console.log("invalid request");
    return res.status(401).send("invalid signature");
  }

  const event = req.headers["x-github-event"];

  if (event === "pull_request") {
    const payload = req.body as PullRequestEvent;
    const installationId= payload.installation.id
    const owner= payload.repository.owner.login
    const repo= payload.repository.name
    const prNumber= payload.pull_request.number

    const pushingResponse = await client.lPush("reviewQueue", JSON.stringify({installationId, owner, repo, prNumber}))

    console.log("pushing to queue ====>", pushingResponse)
    // processPRReviewJob({
    //   installationId: payload.installation.id,
    //   owner: payload.repository.owner.login,
    //   repo: payload.repository.name,
    //   prNumber: payload.pull_request.number,
    // }).catch((err) => console.error("PR review failed:", err));
  }

  res.sendStatus(200);
});

export default router;
