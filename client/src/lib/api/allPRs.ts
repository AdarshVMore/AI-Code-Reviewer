import apiClient from "./client";

export async function allPRs(repoId: string){
    const {data} = await apiClient.get(`/api/pr/get-all-prs/${repoId}`)
    return data
}   