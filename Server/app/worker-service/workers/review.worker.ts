import { createClient } from "redis";
import { processPRReviewJob } from "../processors/review.processor.js";


export async function workersOn(){
    const client = createClient()
    await client.connect()
    console.log("webhook for PR is on")

    while(true){
        const gettingData = await client.brPop("reviewQueue", 0)
        processPRReviewJob(JSON.parse(gettingData!.element))
    }
}