import apiClient from "./client"

export async function fetchAllRepos() {
  const { data } = await apiClient.get("/api/repo/get-all-repo")
  return data as { id: string; owner: string; name: string; installationId: number; createdAt: string; _count: { reviews: number } }[]
}

export async function fetchRepoAnalytics(id: string) {
  const { data } = await apiClient.get(`/api/repo/all-analytics?id=${id}`)
  return data as { id: string; prNumber: number; prTitle: string | null; summary: string | null; createdAt: string }[]
}

export async function fetchRepoSettings(id: string) {
  const { data } = await apiClient.get(`/api/repo/get-settings?id=${id}`)
  return data
}

export async function updateRepoSettings(id: string, body: Record<string, unknown>) {
  const { data } = await apiClient.put(`/api/repo/update-settings?id=${id}`, body)
  return data
}
