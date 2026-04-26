import { createClient } from "redis";
import { processDeploymentJob } from "../processors/deployment.processor.js";
import { getRedisConnection } from "../../../package/lib/redis.client.js";


export async function deploymentWorkerOn() {
  const client = await getRedisConnection()
if (!client.isOpen){
    await client.connect();
  }  console.log("webhook for Deployments is on")

  while (true) {
    const data = await client.brPop("deploymentQueue", 0);
    console.log("deployment job popped:", data?.element);
    processDeploymentJob(JSON.parse(data!.element));
  }
}
