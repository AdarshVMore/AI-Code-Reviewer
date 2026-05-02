import axios from "axios"
import { getSession } from "next-auth/react"

const apiClient = axios.create({ baseURL: "https://a49e-13-53-84-130.ngrok-free.app" })

apiClient.interceptors.request.use(async (config) => {
    const session = await getSession() as any
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
    }
    return config
})

export default apiClient