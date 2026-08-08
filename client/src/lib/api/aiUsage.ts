import apiClient from "./client"

export type AIProvider = "anthropic" | "openrouter"

export type AIUsageKey = {
  id: string
  name: string
  provider: AIProvider
  model: string | null
  maskedKey: string
  createdAt: string
}

export type AIUsagePoint = {
  date: string
  tokens: number
}

export type AIUsageSummary = {
  totalTokensThisMonth: number
  avgTokensPerPR: number
  usageOverTime: AIUsagePoint[]
  platformReviewsUsed: number
  platformReviewsRemaining: number
  platformFreeLimit: number
}

export type AIUsageData = {
  keys: AIUsageKey[]
  usage: AIUsageSummary
}

export const emptyAIUsage: AIUsageData = {
  keys: [],
  usage: {
    totalTokensThisMonth: 0,
    avgTokensPerPR: 0,
    usageOverTime: [],
    platformReviewsUsed: 0,
    platformReviewsRemaining: 5,
    platformFreeLimit: 5,
  },
}

export async function fetchAIUsage(): Promise<AIUsageData> {
  const { data } = await apiClient.get<Partial<AIUsageData>>("/api/ai-usage")
  return {
    keys: data.keys ?? [],
    usage: {
      totalTokensThisMonth: data.usage?.totalTokensThisMonth ?? 0,
      avgTokensPerPR: data.usage?.avgTokensPerPR ?? 0,
      usageOverTime: data.usage?.usageOverTime ?? [],
      platformReviewsUsed: data.usage?.platformReviewsUsed ?? 0,
      platformReviewsRemaining: data.usage?.platformReviewsRemaining ?? 5,
      platformFreeLimit: data.usage?.platformFreeLimit ?? 5,
    },
  }
}

export async function addAIUsageKey(
  name: string,
  key: string,
  provider: AIProvider = "anthropic",
  model?: string,
) {
  const { data } = await apiClient.post<AIUsageKey>("/api/ai-usage/keys", {
    name,
    key,
    provider,
    model,
  })
  return data
}

export async function deleteAIUsageKey(id: string) {
  await apiClient.delete(`/api/ai-usage/keys/${id}`)
}
