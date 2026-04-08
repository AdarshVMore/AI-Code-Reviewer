import { useState, useEffect } from "react"
import { fetchDashboardData } from "@/lib/api/dashboard"

type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
