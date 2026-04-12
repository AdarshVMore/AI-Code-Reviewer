import { useState, useEffect } from "react"
import { fetchCollaborators } from "@/lib/api/collaborators"

type Collaborator = {
  id: number
  login: string
  avatar_url: string
  permissions?: {
    pull: boolean
    push: boolean
    admin: boolean
  }
}

export function useCollaborators(repoId: string) {
  const [allCollaborators, setAllCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!repoId) return
    fetchCollaborators(repoId)
      .then(setAllCollaborators)
      .catch(() => setError("Failed to load collaborators"))
      .finally(() => setLoading(false))
  }, [repoId])

  return { allCollaborators, loading, error }
}
