import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";
import { encrypt, maskApiKey } from "../../../package/lib/encryption.js";
import { PLATFORM_FREE_REVIEWS } from "../../../package/lib/apiKey.service.js";

async function getDbUserId(req: Request): Promise<string | null> {
  const githubId = (req as any).githubUser?.id;
  if (!githubId) return null;
  const user = await db.user.findUnique({ where: { githubId } });
  return user?.id ?? null;
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function buildUsageSummary(userId: string) {
  const monthStart = startOfMonth();

  const [monthlyUsage, reviewCount, dailyUsage, user] = await Promise.all([
    db.tokenUsage.aggregate({
      where: { userId, createdAt: { gte: monthStart } },
      _sum: { totalTokens: true },
    }),
    db.tokenUsage.count({
      where: { userId, reviewId: { not: null }, createdAt: { gte: monthStart } },
    }),
    db.tokenUsage.findMany({
      where: { userId, createdAt: { gte: monthStart } },
      select: { totalTokens: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { platformReviewsUsed: true },
    }),
  ]);

  const totalTokensThisMonth = monthlyUsage._sum.totalTokens ?? 0;
  const avgTokensPerPR =
    reviewCount > 0 ? Math.round(totalTokensThisMonth / reviewCount) : 0;

  const byDay = new Map<string, number>();
  for (const row of dailyUsage) {
    const date = row.createdAt.toISOString().slice(0, 10);
    byDay.set(date, (byDay.get(date) ?? 0) + row.totalTokens);
  }

  const usageOverTime = Array.from(byDay.entries()).map(([date, tokens]) => ({
    date,
    tokens,
  }));

  const platformReviewsRemaining = Math.max(
    0,
    PLATFORM_FREE_REVIEWS - (user?.platformReviewsUsed ?? 0),
  );

  return {
    totalTokensThisMonth,
    avgTokensPerPR,
    usageOverTime,
    platformReviewsUsed: user?.platformReviewsUsed ?? 0,
    platformReviewsRemaining,
    platformFreeLimit: PLATFORM_FREE_REVIEWS,
  };
}

export async function getAIUsage(req: Request, res: Response) {
  const userId = await getDbUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const [keys, usage] = await Promise.all([
    db.userApiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, maskedKey: true, createdAt: true },
    }),
    buildUsageSummary(userId),
  ]);

  res.json({ keys, usage });
}

export async function addApiKey(req: Request, res: Response) {
  const userId = await getDbUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const { name, key } = req.body as { name?: string; key?: string };
  if (!name?.trim() || !key?.trim()) {
    res.status(400).json({ error: "name and key are required" });
    return;
  }

  if (!key.startsWith("sk-ant-")) {
    res.status(400).json({ error: "invalid Anthropic API key format" });
    return;
  }

  const saved = await db.userApiKey.create({
    data: {
      userId,
      name: name.trim(),
      encryptedKey: encrypt(key.trim()),
      maskedKey: maskApiKey(key.trim()),
    },
    select: { id: true, name: true, maskedKey: true, createdAt: true },
  });

  res.status(201).json(saved);
}

export async function deleteApiKey(req: Request, res: Response) {
  const userId = await getDbUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: "key id required" });
    return;
  }
  const existing = await db.userApiKey.findFirst({ where: { id, userId } });
  if (!existing) {
    res.status(404).json({ error: "key not found" });
    return;
  }

  await db.userApiKey.delete({ where: { id } });
  res.status(204).send();
}
