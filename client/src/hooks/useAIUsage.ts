"use client"

import { useCallback, useEffect, useState } from "react"
import {
  addAIUsageKey,
  deleteAIUsageKey,
  emptyAIUsage,
  fetchAIUsage,
  type AIProvider,
  type AIUsageKey,
  type AIUsageSummary,
} from "@/lib/api/aiUsage"

export default function useAIUsage() {
  const [keys, setKeys] = useState<AIUsageKey[]>([])
  const [usage, setUsage] = useState<AIUsageSummary>(emptyAIUsage.usage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUsage = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAIUsage()
      setKeys(data.keys)
      setUsage(data.usage)
      setError(null)
    } catch {
      setKeys(emptyAIUsage.keys)
      setUsage(emptyAIUsage.usage)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsage()
  }, [loadUsage])

  async function handleAddKey(name: string, key: string, provider: AIProvider = "anthropic", model?: string) {
    const savedKey = await addAIUsageKey(name, key, provider, model)
    setKeys((current) => [savedKey, ...current])
    await loadUsage()
  }

  async function handleDeleteKey(id: string) {
    await deleteAIUsageKey(id)
    setKeys((current) => current.filter((key) => key.id !== id))
    await loadUsage()
  }

  return {
    keys,
    usage,
    loading,
    error,
    handleAddKey,
    handleDeleteKey,
  }
}
