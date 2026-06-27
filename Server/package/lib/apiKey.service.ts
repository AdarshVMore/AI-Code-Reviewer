import { db } from "../db/prisma.js";
import { decrypt } from "./encryption.js";

export const PLATFORM_FREE_REVIEWS = 5;

export type ResolvedApiKey = {
  apiKey: string;
  source: "user_key" | "platform";
};

export async function getActiveUserApiKey(userId: string): Promise<string | null> {
  const record = await db.userApiKey.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;
  return decrypt(record.encryptedKey);
}

export async function resolveReviewApiKey(userId: string): Promise<ResolvedApiKey | null> {
  const userKey = await getActiveUserApiKey(userId);
  if (userKey) {
    return { apiKey: userKey, source: "user_key" };
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

  return { apiKey: platformKey, source: "platform" };
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
