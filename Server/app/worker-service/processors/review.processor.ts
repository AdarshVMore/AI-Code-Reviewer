import { getOctokit } from "../services/github.service.js";
import { runPRReview, PRReviewJobData } from "../services/review.service.js";
export { getOctokit } from "../../../package/github/client.js";
import {createClient} from "redis"

export async function processPRReviewJob(data: PRReviewJobData) {
  console.log(`Processing PR review: ${data.owner}/${data.repo}#${data.prNumber}`);
  const result = await runPRReview(data);

  return result;
}