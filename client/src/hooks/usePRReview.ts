import { useState, useEffect } from "react"
import { fetchPRReview } from "@/lib/api/pr"

type PRReview = Awaited<ReturnType<typeof fetchPRReview>>

export function usePRReview(repoId: string, id:string) {
  const [review, setReview] = useState<PRReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !repoId) return
    fetchPRReview(repoId, id)
      .then(setReview)
      .catch(() => setError("Failed to load review"))
      .finally(() => setLoading(false))
  }, [id, repoId])

  return { review, loading, error }
}
