import axios from "axios"
import { getSession } from "next-auth/react"

const apiClient = axios.create({ baseURL: "http://localhost:3001" })

apiClient.interceptors.request.use(async (config) => {
    const session = await getSession() as any
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
    }
    return config
})

export default apiClient