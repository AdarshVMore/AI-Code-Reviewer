import apiClient from "./client";

export async function fetchPRReview(repoId:string, id:string) {
    const {data} = await apiClient.get(`/api/pr/get-pr-info/${repoId}/${id}`)
    return data
}