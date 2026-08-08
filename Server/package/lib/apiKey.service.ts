import { db } from "../db/prisma.js";
import { decrypt } from "./encryption.js";
import { CLAUDE_MODEL } from "../ai/models.js";
import type { AIKeyConfig, LLMProvider } from "../ai/providers/index.js";

export const PLATFORM_FREE_REVIEWS = 5;

export type ResolvedApiKey = AIKeyConfig & {
  source: "user_key" | "platform";
};

export async function getActiveUserApiKey(userId: string): Promise<AIKeyConfig | null> {
  const record = await db.userApiKey.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;

  const provider = (record.provider as LLMProvider) || "anthropic";
  return {
    apiKey: decrypt(record.encryptedKey),
    provider,
    // Anthropic keys fall back to the global default model; OpenRouter keys
    // always carry an explicit model (enforced when the key is saved).
    model: record.model || (provider === "anthropic" ? CLAUDE_MODEL : ""),
  };
}

export async function resolveReviewApiKey(userId: string): Promise<ResolvedApiKey | null> {
  const userKey = await getActiveUserApiKey(userId);
  if (userKey) {
    return { ...userKey, source: "user_key" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { platformReviewsUsed: true },
  });
  if (!user || user.platformReviewsUsed >= PLATFORM_FREE_REVIEWS) {
    return null;
  }

  const platformKey = process.env.ANTHROPIC_API_KEY;
  if (!platformKey) {
    throw new Error("Platform ANTHROPIC_API_KEY is not configured");
  }

  return { apiKey: platformKey, provider: "anthropic", model: CLAUDE_MODEL, source: "platform" };
}

export async function incrementPlatformReviewCount(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { platformReviewsUsed: { increment: 1 } },
  });
}

export type TokenUsageInput = {
  userId: string;
  reviewId?: string;
  inputTokens: number;
  outputTokens: number;
  source: "user_key" | "platform";
};

export async function recordTokenUsage(data: TokenUsageInput): Promise<void> {
  await db.tokenUsage.create({
    data: {
      userId: data.userId,
      reviewId: data.reviewId ?? null,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      totalTokens: data.inputTokens + data.outputTokens,
      source: data.source,
    },
  });
}
