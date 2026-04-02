import { runPRReview, PRReviewJobData } from "../services/review.service";

export async function processPRReviewJob(data: PRReviewJobData) {
  console.log(`Processing PR review: ${data.owner}/${data.repo}#${data.prNumber}`);
  const result = await runPRReview(data);
  return result;
}
