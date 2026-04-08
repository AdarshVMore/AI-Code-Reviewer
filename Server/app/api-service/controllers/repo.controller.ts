import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";

export async function allRepos(_req: Request, res: Response) {
  const repos = await db.repository.findMany({
    include: { _count: { select: { reviews: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(repos);
}

export async function repoAnalytics(req: Request, res: Response) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "repo id required" });
    return;
  }

  const reviews = await db.pRReview.findMany({
    where: { repositoryId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, prNumber: true, prTitle: true, summary: true, createdAt: true },
  });
  res.json(reviews);
}

export async function getSettings(req: Request, res: Response) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "repo id required" });
    return;
  }

  const repo = await db.repository.findUnique({ where: { id } });
  if (!repo) {
    res.status(404).json({ error: "repo not found" });
    return;
  }
  res.json(repo);
}

export async function updateSettings(req: Request, res: Response) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "repo id required" });
    return;
  }

  const repo = await db.repository.update({
    where: { id },
    data: req.body,
  });
  res.json(repo);
}
