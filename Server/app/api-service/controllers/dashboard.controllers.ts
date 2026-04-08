import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";

export async function getAllData(_req: Request, res: Response) {
  const [stats, recentPR, activeRepo, issues] = await Promise.all([
    getStats(),
    recentPRs(),
    activeRepos(),
    commonIssues(),
  ]);

  res.json({ stats, recentPR, activeRepo, issues });
}

async function getStats() {
  const [totalReviews, totalRepos, totalIssues] = await Promise.all([
    db.pRReview.count(),
    db.repository.count(),
    db.pRReview.findMany({ select: { rawReview: true } }),
  ]);
 
  let issueCount = 0;
  for (const review of totalIssues) {
    try {
      const parsed = JSON.parse(review.rawReview);
      issueCount += parsed.issues?.length ?? 0;
    } catch {}
  }

  return { totalReviews, totalRepos, totalIssues: issueCount };
}

async function recentPRs() {
  return db.pRReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { repository: { select: { name: true, owner: true } } },
  });
}

async function activeRepos() {
  return db.repository.findMany({
    include: { _count: { select: { reviews: true } } },
    orderBy: { createdAt: "desc" },
  });
}

async function commonIssues() {
  const reviews = await db.pRReview.findMany({ select: { rawReview: true } });

  const freq: Record<string, number> = {};
  for (const review of reviews) {
    try {
      const parsed = JSON.parse(review.rawReview);
      for (const issue of parsed.issues ?? []) {
        const key = issue.problem ?? "unknown";
        freq[key] = (freq[key] ?? 0) + 1;
      }
    } catch {}
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([problem, count]) => ({ problem, count }));
}
