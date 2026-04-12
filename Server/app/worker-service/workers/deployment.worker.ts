import { createClient } from "redis";
import { processDeploymentJob } from "../processors/deployment.processor.js";

export async function deploymentWorkerOn() {
  const client = createClient();
  await client.connect();

  while (true) {
    const data = await client.brPop("deploymentQueue", 0);
    console.log("deployment job popped:", data?.element);
    processDeploymentJob(JSON.parse(data!.element));
  }
}
