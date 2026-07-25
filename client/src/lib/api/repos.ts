import apiClient from "./client"

export async function fetchAllRepos() {
  const { data } = await apiClient.get("/api/repo/get-all-repo")
  return data as { id: string; owner: string; name: string; installationId: number; createdAt: string; _count: { reviews: number } }[]
}

export async function fetchAllCollaborators(id:string){
  const {data} = await apiClient.get(`/api/repo/collaborators/${id}`)
  return data
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

export type CodeGraphNode = {
  id: string
  label: string
  fullPath?: string
  type: 'repo' | 'file'
  issueCount: number
  severity: 'none' | 'high' | 'medium' | 'low'
  categories?: string[]
}

export type CodeGraphEdge = {
  id: string
  source: string
  target: string
}

export async function fetchCodeGraph(id: string) {
  const { data } = await apiClient.get(`/api/repo/code-graph?id=${id}`)
  return data as { nodes: CodeGraphNode[]; edges: CodeGraphEdge[] }
}