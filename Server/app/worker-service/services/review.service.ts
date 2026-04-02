import { getOctokit, getDifferenceData, getReviewRules } from "./github.service";
import { getAIReview, reviewPrompt, parseAIResponse } from "./ai.service";

export type PRReviewJobData = {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
};

export async function runPRReview(data: PRReviewJobData) {
  const { installationId, owner, repo, prNumber } = data;

  const octokit = await getOctokit(installationId);
  const difference = await getDifferenceData(octokit, owner, repo, prNumber);
  const rules = await getReviewRules(octokit, owner, repo, prNumber);

  const prompt = reviewPrompt(difference, rules);
  const parsedPrompt = parseAIResponse(prompt);
  const aiResponse = await getAIReview(parsedPrompt);

  console.log("Final AI Response ========>", aiResponse);
  return aiResponse;
}
