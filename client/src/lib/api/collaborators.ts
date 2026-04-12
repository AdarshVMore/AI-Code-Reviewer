import apiClient from "./client"

export async function fetchCollaborators(repoId: string) {
  const { data } = await apiClient.get(`/api/pr/collaborators/${repoId}`)
  return data
}
