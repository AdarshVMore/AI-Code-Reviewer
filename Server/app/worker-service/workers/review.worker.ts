import { createClient } from "redis";
import { processPRReviewJob } from "../processors/review.processor.js";
import { getRedisConnection } from "../../../package/lib/redis.client.js";


export async function workersOn(){
    const client = await getRedisConnection()
if (!client.isOpen){
    await client.connect();
  }    console.log("webhook for PR is on")

    while(true){
        const gettingData = await client.brPop("reviewQueue", 0)
        processPRReviewJob(JSON.parse(gettingData!.element))
    }
}