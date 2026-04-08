import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { fetchUser } from "@/lib/api/user"
import type { User } from "@/types"

export function useUser() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchUser().then(setUser).catch(() => setUser(null))
    }
  }, [status])

  return user
}
