import { useState, useEffect } from "react"
import { fetchAllRepos } from "@/lib/api/repos"

type Repo = Awaited<ReturnType<typeof fetchAllRepos>>[number]

export function useRepos() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllRepos()
      .then(setRepos)
      .catch(() => setError("Failed to load repos"))
      .finally(() => setLoading(false))
  }, [])

  return { repos, loading, error }
}
