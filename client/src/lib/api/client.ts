import axios from "axios"
import { getSession } from "next-auth/react"
import type { Session } from "next-auth"

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
})

apiClient.interceptors.request.use(async (config) => {
    const session = await getSession() as Session | null
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
    }
    return config
})

export default apiClient
