import apiClient from "./client";
import type { User } from "@/types";

export async function fetchUser(): Promise<User> {
    const {data} = await apiClient.get("/api/user/me")
    return data
}