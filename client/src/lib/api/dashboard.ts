import apiClient from "./client";

export async function fetchDashboardData(){
    const {data} = await apiClient.get("/api/dashboard/")
    return data
}
