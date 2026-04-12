import apiClient from "./client";

export async function fetchDeployments(repoId: string) {
  const { data } = await apiClient.get(`/api/deployment/get-deployments/${repoId}`);
  return data;
}

export async function fixDeployment(deploymentId: string) {
  const { data } = await apiClient.post(`/api/deployment/fix/${deploymentId}`);
  return data;
}
