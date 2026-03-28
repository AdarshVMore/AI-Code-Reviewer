import "dotenv/config";
import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import { verifySignature } from "./utils/verifySignature";

const app = express();
const port = 3000;

const GITHUB_SECRET = process.env.GITHUB_SECRET as string;
console.log(GITHUB_SECRET);

type PullRequestEvent = {
  action: "opened" | "synchronize" | "closed";
  pull_request: {
    title: string;
    number: number;
    head: {
      ref: string;
      sha: string;
    };
  };
  repository: {
    full_name: string;
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
  console.log(`📦 Event: ${event}`);

  if (event === "pull_request") {
    const payload = req.body as PullRequestEvent;
    const { action, pull_request, repository } = payload;

    console.log(`👉 PR ${action}`);
    console.log(`Title: ${pull_request.title}`);
    console.log(`Repo: ${repository.full_name}`);
    console.log(`Branch: ${pull_request.head.ref}`);
    console.log(`SHA: ${pull_request.head.sha}`);

    res.sendStatus(200)
  }
});

app.listen(port, ()=>{
    console.log("Port started at 3000")
})
