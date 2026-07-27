import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";

async function getDbUserId(req: Request): Promise<string | null> {
  const githubId = (req as any).githubUser?.id;
  if (!githubId) return null;
  const user = await db.user.findUnique({ where: { githubId } });
  return user?.id ?? null;
}

export async function allRepos(req: Request, res: Response) {
  const userId = await getDbUserId(req);
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

export async function codeGraphLite(req: Request, res: Response) {
  const userId = await getDbUserId(req);
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

  type FileStats = { count: number; high: number; medium: number; low: number; categories: Set<string> };
  const fileMap = new Map<string, FileStats>();

  for (const issue of issues) {
    const entry = fileMap.get(issue.file) ?? { count: 0, high: 0, medium: 0, low: 0, categories: new Set<string>() };
    entry.count += 1;
    if (issue.severity === "high") entry.high += 1;
    else if (issue.severity === "medium") entry.medium += 1;
    else entry.low += 1;
    entry.categories.add(issue.category);
    fileMap.set(issue.file, entry);
  }

  const rootId = "__repo_root__";
  const nodes = [
    { id: rootId, label: `${repo.owner}/${repo.name}`, type: "repo" as const, issueCount: issues.length, severity: "none" as const },
    ...Array.from(fileMap.entries()).map(([file, stats]) => ({
      id: file,
      label: file.split("/").pop() ?? file,
      fullPath: file,
      type: "file" as const,
      issueCount: stats.count,
      severity: (stats.high > 0 ? "high" : stats.medium > 0 ? "medium" : "low") as "high" | "medium" | "low",
      categories: Array.from(stats.categories),
    })),
  ];

  const edges = Array.from(fileMap.keys()).map((file) => ({
    id: `${rootId}->${file}`,
    source: rootId,
    target: file,
  }));

  res.json({ nodes, edges });
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
