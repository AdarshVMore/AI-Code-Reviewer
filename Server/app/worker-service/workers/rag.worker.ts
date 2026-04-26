import { createClient } from "redis";
import { runRAGPipeline } from "../services/rag.service.js";
import { getRedisConnection } from "../../../package/lib/redis.client.js";

export async function ragWorker(){
    const client = await getRedisConnection()
if (!client.isOpen){
    await client.connect();
  }
    while(true){
        console.log("running RAG worker...")
        const raw = await client.brPop("ragData", 0) as any
        if (!raw) continue
        try {
            const data = JSON.parse(raw.element)
            await runRAGPipeline(data)
        } catch (err) {
            console.error("RAG pipeline error:", err)
        }
    }
}