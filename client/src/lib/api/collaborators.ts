import apiClient from "./client"

export async function fetchCollaborators(repoId: string) {
  const { data } = await apiClient.get(`/api/pr/collaborators/${repoId}`)
  return data
}

export async function fetchCollaboratorAnalysis(id:string, collaboratorName: string) {
  const { data } = await apiClient.get(`/api/pr/collaborators-analysis/${id}/${collaboratorName}`)
  return data
}