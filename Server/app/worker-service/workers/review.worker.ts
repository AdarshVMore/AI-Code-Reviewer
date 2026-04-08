import { createClient } from "redis";
import { processPRReviewJob } from "../processors/review.processor.js";


export async function workersOn(){
    const client = createClient()
    await client.connect()

    while(true){
        const gettingData = await client.brPop("reviewQueue", 0)
        console.log("here is the popped data =======>", gettingData?.element)
        processPRReviewJob(JSON.parse(gettingData!.element))
    }
}