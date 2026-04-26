import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";
import { getOctokit } from "../../../package/github/client.js";

export async function getCollaborators(
  req: Request<{ id: string }>,
  res: Response,
) {
  const { id } = req.params;

  const repository = await db.repository.findUnique({ where: { id } });
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

export async function getCollaboratorAnalysis(req: Request<{id:string, collaborator: string }>,
  res: Response,){
    const {id, collaborator} = req.params
  const score = await getAverageScore(id, collaborator)
  const recentPR = await getRecentPRs(id, collaborator)
  const weeklyTrend = calculateWeeklyIssueTrend(recentPR)
  const monthlyTrends = calculateMonthlyIssueTrend(recentPR)
  const repeatedIssues = calculateRepeatedIssues(recentPR)

  res.json({
    score,
    weeklyTrend,
    monthlyTrends,
    repeatedIssues,
    recentPR,
  })
}

export async function getAverageScore(id: string, author: string) {
  const scores = await db.pRReview.aggregate({
    where: { prAuthor: author, repositoryId:id },
    _avg: { score: true },
  });

  console.log(scores)

  return scores;
}

export async function getRecentPRs(id:string, author: string) {
  const recentPrs = (await db.pRReview.findMany({
    where: { prAuthor: author, repositoryId:id },
    select: {
      prTitle: true,
      prNumber: true,
      score: true,
      issues: {
        select: {
          category: true,
        },
      },
      createdAt: true,
      _count: { select: { issues: true } },
    },
  })) as any;
  
  return recentPrs
}

function calculateWeeklyIssueTrend(
  prs: { createdAt: string; _count: { issues: number } }[],
) {
  const buckets: Record<string, number> = {};

  for (const pr of prs) {
    const date = new Date(pr.createdAt);
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const week = Math.ceil(
      ((date.getTime() - startOfYear.getTime()) / 86400000 +
        startOfYear.getDay() +
        1) /
        7,
    );
    const key = `W${week} '${String(year).slice(2)}`;
    buckets[key] = (buckets[key] ?? 0) + pr._count.issues;
  }

  return Object.entries(buckets).map(([week, issues]) => ({ week, issues }));
}

function calculateMonthlyIssueTrend(
  prs: { createdAt: string; _count: { issues: number } }[],
) {
  const buckets: Record<string, number> = {};

  for (const pr of prs) {
    const month = new Date(pr.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    buckets[month] = (buckets[month] ?? 0) + pr._count.issues;
  }

  return Object.entries(buckets)
    .map(([month, issues]) => ({ month, issues }))
    .sort(
      (a, b) =>
        new Date("1 " + a.month).getTime() - new Date("1 " + b.month).getTime(),
    );
}

function calculateRepeatedIssues(prs: { issues: { category: string }[] }[]) {
  let repeatedPrIssues = {
    quality: 0,
    maintainability: 0,
    security: 0,
    architecture: 0,
    performance: 0,
  } as any;
  for (const pr of prs) {
    const issues = pr.issues;
    for (const issue of issues) {
      const category = issue.category;
      repeatedPrIssues[category] = repeatedPrIssues[category] + 1;
    }
  }

  return repeatedPrIssues;
}
