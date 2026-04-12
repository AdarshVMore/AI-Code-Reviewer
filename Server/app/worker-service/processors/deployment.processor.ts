import { runDeploymentAnalysis, DeploymentJobData } from "../services/deployment.service.js";

export async function processDeploymentJob(data: DeploymentJobData) {
  console.log(`Processing deployment analysis: ${data.owner}/${data.repo} — ${data.provider}`);
  const result = await runDeploymentAnalysis(data);
  return result;
}
