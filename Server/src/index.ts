import "dotenv/config";
import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import { verifySignature } from "./utils/verifySignature";
import { getOctokit } from "./github/getClient";
import { getReviewRules } from "./github/getReviewRules";
import { getDifferenceData } from "./github/getCodeDiff";
import { getAIReview } from "./ai/reviewPrompt";
import { reviewPrompt } from "./ai/reviewPrompt";
import { parseAIResponse } from "./ai/reviewPrompt";

const app = express();
const port = 3000;

const GITHUB_SECRET = process.env.GITHUB_SECRET as string;

type PullRequestEvent = {
  action: "opened" | "synchronize" | "closed";
  installation: {
    id: string | number
  },
  pull_request: {
    title: string;
    number: number;
    head: {
      ref: string;
      sha: string;
    };
  };
  repository: {
    name: string
    owner: {
      login: string
    }
  };
};

app.use(
  bodyParser.json({
    verify: (req: any, res: any, buf: any) => {
      req.rawBody = buf;
    },
  }),
);

app.post("/webhook/github", (req: Request, res: Response) => {
  if (!verifySignature(req, GITHUB_SECRET)) {
    console.log("invalid request");
    return res.status(401).send("invalid signature");
  }

  const event = req.headers["x-github-event"];

  main()

  async function main (){
    if (event === "pull_request") {
    const payload = req.body as PullRequestEvent;
    const installationId = payload.installation.id as number
    const owner = payload.repository.owner.login
    const repo = payload.repository.name
    const prNumber = payload.pull_request.number
    
    const octoKit = await getOctokit(installationId)
    const difference = await getDifferenceData(octoKit, owner, repo, prNumber)
    const rules = await getReviewRules(octoKit, owner, repo, prNumber)

    const prompt = reviewPrompt(difference, rules)
    console.log(prompt, "<===== prompt")
    const parsedPrompt = parseAIResponse(prompt)
    console.log(parsedPrompt, "<====== parsed Prompt")
    const getAIResponse = await getAIReview(parsedPrompt)
    
    console.log("Final AI Response ========>" , getAIResponse)

    console.log(difference.slice(0, 500), rules)
    res.sendStatus(200)
  }
  }
});

app.listen(port, ()=>{
    console.log("Port started at 3000")
})
