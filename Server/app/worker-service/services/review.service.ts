import { getOctokit, getDifferenceData, getReviewRules } from "./github.service.js";
import { getAIReview, reviewPrompt, parseAIResponse } from "./ai.service.js";
import { db } from "../../../package/db/prisma.js";

export type PRReviewJobData = {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
};

export async function runPRReview(data: PRReviewJobData) {
  // const { installationId, owner, repo, prNumber } = data;
  console.log("here is the data =========>", data)
  const installationId = data.installationId
  const owner = data.owner
  const repo = data.repo
  const prNumber = data.prNumber
  console.log("lets check the data now...." , installationId, owner, repo, prNumber)
  const octokit = await getOctokit(installationId);
  const difference = await getDifferenceData(octokit, owner, repo, prNumber);
  const rules = await getReviewRules(octokit, owner, repo, prNumber);


  const prompt = reviewPrompt(difference, rules);
  const parsedPrompt = parseAIResponse(prompt);
  const aiResponse = await getAIReview(parsedPrompt) as any;
  const rawText = aiResponse[0]?.text || "";
  const cleanText = rawText
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

  console.log("this is what AI responded with......", cleanText)
  const response = await octokit.issues.createComment({ owner, repo, issue_number: prNumber, body: cleanText })
  console.log("response from octokit ========>", response);
  return aiResponse;
}
