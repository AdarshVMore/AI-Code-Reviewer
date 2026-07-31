import { processDeploymentJob } from "../processors/deployment.processor.js";
import { createQueueWorkerClient } from "../../../package/lib/redis.client.js";

export async function deploymentWorkerOn() {
  const client = await createQueueWorkerClient()
  console.log("webhook for Deployments is on")

  while (true) {
    const data = await client.brPop("deploymentQueue", 0);
    console.log("deployment job popped:", data?.element);
    processDeploymentJob(JSON.parse(data!.element));
  }
}
