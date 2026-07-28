import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";
import { getUserId } from "../auth/auth.js";
import { buildCodeGraphLite } from "../services/codeGraph.service.js";

export async function allRepos(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const repos = await db.repository.findMany({
    where: { userId },
    include: { _count: { select: { reviews: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(repos);
}

export async function repoAnalytics(req: Request, res: Response) {
  const userId = getUserId(req);
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
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const { id } = req.query;
  if (!id || typeof id !== "string") { res.status(400).json({ error: "repo id required" }); return; }

  const repo = await db.repository.findFirst({ where: { id, userId } });
  if (!repo) { res.status(404).json({ error: "repo not found" }); return; }

  res.json(repo);
}

export async function codeGraphLite(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const { id } = req.query;
  if (!id || typeof id !== "string") { res.status(400).json({ error: "repo id required" }); return; }

  const repo = await db.repository.findFirst({ where: { id, userId } });
  if (!repo) { res.status(404).json({ error: "repo not found" }); return; }

  const issues = await db.issue.findMany({
    where: { review: { repositoryId: id } },
    select: { file: true, severity: true, category: true },
    take: 500,
  });

  res.json(buildCodeGraphLite(repo, issues));
}

export async function updateSettings(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const { id } = req.query;
  if (!id || typeof id !== "string") { res.status(400).json({ error: "repo id required" }); return; }

  const repo = await db.repository.findFirst({ where: { id, userId } });
  if (!repo) { res.status(404).json({ error: "repo not found" }); return; }

  const updated = await db.repository.update({ where: { id }, data: req.body });
  res.json(updated);
}
