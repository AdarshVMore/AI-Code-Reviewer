import apiClient from "./client";

export async function fetchPRReview(id: string) {
    const {data} = await apiClient.get(`/api/pr/get-pr-info/${id}`)
    return data
}