import { processPRReviewJob } from "../processors/review.processor.js";
import { createQueueWorkerClient } from "../../../package/lib/redis.client.js";

export async function workersOn(){
    const client = await createQueueWorkerClient()
    console.log("webhook for PR is on")

    while (true) {
        const gettingData = await client.brPop("reviewQueue", 0);
        try {
            await processPRReviewJob(JSON.parse(gettingData!.element));
        } catch (err) {
            console.error("PR review job error:", err);
        }
    }
}