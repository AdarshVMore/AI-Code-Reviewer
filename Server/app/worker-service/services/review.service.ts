import { getOctokit, getDifferenceData, getReviewRules } from "./github.service.js";
import { getAIReview, reviewPrompt, parseAIResponse } from "./ai.service.js";
import { db } from "../../../package/db/prisma.js";

export type PRReviewJobData = {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle?: string;
};

export async function runPRReview(data: PRReviewJobData) {
  const { installationId, owner, repo, prNumber, prTitle } = data;

  const octokit = await getOctokit(installationId);
  const difference = await getDifferenceData(octokit, owner, repo, prNumber);
  const rules = await getReviewRules(octokit, owner, repo, prNumber);

  const prompt = reviewPrompt(difference, rules);
  const parsedPrompt = parseAIResponse(prompt);
  const aiResponse = await getAIReview(parsedPrompt) as any;
  const rawText = aiResponse[0]?.text || "";
  const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

  await octokit.issues.createComment({ owner, repo, issue_number: prNumber, body: cleanText });

  const repository = await db.repository.findUnique({
    where: { owner_name: { owner, name: repo } },
  });

  if (!repository) {
    console.log(`repo ${owner}/${repo} not found in DB after upsert — skipping save`);
    return aiResponse;
  }

  let parsedReview = null;
  try { parsedReview = JSON.parse(cleanText); } catch {}

  await db.pRReview.create({
    data: {
      prNumber,
      prTitle: prTitle ?? null,
      summary: parsedReview?.summary ?? null,
      rawReview: cleanText,
      repositoryId: repository.id,
    },
  });

  console.log(`review saved to DB for ${owner}/${repo}#${prNumber}`);
  return aiResponse;
}
