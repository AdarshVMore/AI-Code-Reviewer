import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";

async function getDbUserId(req: Request): Promise<string | null> {
  console.log(req)
  const githubId = (req as any).githubUser?.id;
  console.log("from user Id", githubId)
  if (!githubId) return null;
  const user = await db.user.findUnique({ where: { githubId } });
  return user?.id ?? null;
}

export async function allRepos(req: Request, res: Response) {
  const userId = await getDbUserId(req);
  console.log("from get all repo", userId)
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const repos = await db.repository.findMany({
    where: { userId },
    include: { _count: { select: { reviews: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(repos);
}

export async function repoAnalytics(req: Request, res: Response) {
  const userId = await getDbUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const { id } = req.query;
  if (!id || typeof id !== "string") { res.status(400).json({ error: "repo id required" }); return; }

  const repo = await db.repository.findFirst({ where: { id, userId } });
  if (!repo) { res.status(404).json({ error: "repo not found" }); return; }

  const reviews = await db.pRReview.findMany({
    where: { repositoryId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, prNumber: true, prTitle: true, summary: true, createdAt: true },
  });
  res.json(reviews);
}

export async function getSettings(req: Request, res: Response) {
  const userId = await getDbUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const { id } = req.query;
  if (!id || typeof id !== "string") { res.status(400).json({ error: "repo id required" }); return; }

  const repo = await db.repository.findFirst({ where: { id, userId } });
  if (!repo) { res.status(404).json({ error: "repo not found" }); return; }

  res.json(repo);
}

export async function updateSettings(req: Request, res: Response) {
  const userId = await getDbUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const { id } = req.query;
  if (!id || typeof id !== "string") { res.status(400).json({ error: "repo id required" }); return; }

  const repo = await db.repository.findFirst({ where: { id, userId } });
  if (!repo) { res.status(404).json({ error: "repo not found" }); return; }

  const updated = await db.repository.update({ where: { id }, data: req.body });
  res.json(updated);
}
