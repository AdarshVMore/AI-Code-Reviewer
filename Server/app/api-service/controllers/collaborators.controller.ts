import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";
import { getOctokit } from "../../../package/github/client.js";
import { getUserId } from "../auth/auth.js";
import {
  getAverageScore,
  getRecentPRs,
  calculateWeeklyIssueTrend,
  calculateMonthlyIssueTrend,
  calculateRepeatedIssues,
} from "../services/collaboratorInsights.service.js";

async function getOwnedRepository(id: string, userId: string) {
  return db.repository.findFirst({ where: { id, userId } });
}

export async function getCollaborators(
  req: Request<{ id: string }>,
  res: Response,
) {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const { id } = req.params;

  const repository = await getOwnedRepository(id, userId);
  if (!repository) {
    res.status(404).json({ error: "repository not found" });
    return;
  }

  const octokit = await getOctokit(repository.installationId);
  const collaborators = await octokit.paginate(
    octokit.rest.repos.listCollaborators,
    {
      owner: repository.owner,
      repo: repository.name,
    },
  );

  res.json(
    collaborators.map((c) => ({
      id: c.id,
      login: c.login,
      avatar_url: c.avatar_url,
      permissions: c.permissions,
    })),
  );
}

export async function getCollaboratorAnalysis(
  req: Request<{ id: string; collaborator: string }>,
  res: Response,
) {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const { id, collaborator } = req.params;

  const repository = await getOwnedRepository(id, userId);
  if (!repository) {
    res.status(404).json({ error: "repository not found" });
    return;
  }

  const score = await getAverageScore(id, collaborator);
  const recentPR = await getRecentPRs(id, collaborator);
  const weeklyTrend = calculateWeeklyIssueTrend(recentPR);
  const monthlyTrends = calculateMonthlyIssueTrend(recentPR);
  const repeatedIssues = calculateRepeatedIssues(recentPR);

  res.json({
    score,
    weeklyTrend,
    monthlyTrends,
    repeatedIssues,
    recentPR,
  });
}
