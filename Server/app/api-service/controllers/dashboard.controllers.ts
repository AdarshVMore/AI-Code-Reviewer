import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";

async function getDbUserId(req: Request): Promise<string | null> {
  // console.log("user Id ------> " , req)
  const githubId = (req as any).githubUser?.id;
  console.log(githubId)
  if (!githubId) return null;
  const user = await db.user.findUnique({ where: { githubId } });
  return user?.id ?? null;
}

export async function getAllData(req: Request, res: Response) {
  const userId = await getDbUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const [stats, recentPR, activeRepo, issues] = await Promise.all([
    getStats(userId),
    recentPRs(userId),
    activeRepos(userId),
    commonIssues(userId),
  ]);

  res.json({ stats, recentPR, activeRepo, issues });
}

async function getStats(userId: string) {
  const userRepos = await db.repository.findMany({ where: { userId }, select: { id: true } });
  const repoIds = userRepos.map((r) => r.id);

  const [totalReviews, totalRepos, totalIssues] = await Promise.all([
    db.pRReview.count({ where: { repositoryId: { in: repoIds } } }),
    db.repository.count({ where: { userId } }),
    db.issue.count({ where: { review: { repositoryId: { in: repoIds } } } }),
  ]);

  return { totalReviews, totalRepos, totalIssues };
}

async function recentPRs(userId: string) {
  const userRepos = await db.repository.findMany({ where: { userId }, select: { id: true } });
  const repoIds = userRepos.map((r) => r.id);

  return db.pRReview.findMany({
    where: { repositoryId: { in: repoIds } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { repository: { select: { name: true, owner: true } } },
  });
}

async function activeRepos(userId: string) {
  return db.repository.findMany({
    where: { userId },
    include: { _count: { select: { reviews: true } } },
    orderBy: { createdAt: "desc" },
  });
}

async function commonIssues(userId: string) {
  const userRepos = await db.repository.findMany({ where: { userId }, select: { id: true } });
  const repoIds = userRepos.map((r) => r.id);

  const issues = await db.issue.findMany({
    where: { review: { repositoryId: { in: repoIds } } },
    select: { problem: true },
  });

  const freq: Record<string, number> = {};
  for (const issue of issues) {
    const key = issue.problem ?? "unknown";
    freq[key] = (freq[key] ?? 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([problem, count]) => ({ problem, count }));
}
