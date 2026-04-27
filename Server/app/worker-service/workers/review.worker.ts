import { processPRReviewJob } from "../processors/review.processor.js";
import { createWorkerRedisClient } from "../../../package/lib/redis.client.js";

export async function workersOn(){
    const client = await createWorkerRedisClient()
    console.log("webhook for PR is on")

    while(true){
        const gettingData = await client.brPop("reviewQueue", 0)
        processPRReviewJob(JSON.parse(gettingData!.element))
    }
}