import { createClient } from "redis";
import { runRAGPipeline } from "../services/rag.service.js";

export async function ragWorker(){
    const client = await createClient()
    await client.connect()

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