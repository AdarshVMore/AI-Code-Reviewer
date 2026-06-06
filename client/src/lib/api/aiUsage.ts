import apiClient from "./client"

export type AIUsageKey = {
  id: string
  name: string
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
    },
  }
}

export async function addAIUsageKey(name: string, key: string) {
  const { data } = await apiClient.post<AIUsageKey>("/api/ai-usage/keys", {
    name,
    key,
  })
  return data
}

export async function deleteAIUsageKey(id: string) {
  await apiClient.delete(`/api/ai-usage/keys/${id}`)
}
