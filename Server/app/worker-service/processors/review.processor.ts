import { runPRReview, PRReviewJobData } from "../services/review.service.js";

export async function processPRReviewJob(data: PRReviewJobData) {
  console.log(`Processing PR review: ${data.owner}/${data.repo}#${data.prNumber}`);
  return runPRReview(data);
}
