import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";
import { applyIssueFix } from "../../worker-service/services/issueFix.service.js";

export async function applyIssueFixHandler(
  req: Request<{ issueId: string }>,
  res: Response,
) {
  const { issueId } = req.params;
  const githubUser = (req as any).githubUser;

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      review: {
        include: {
          repository: {
            include: { user: { select: { githubId: true } } },
          },
        },
      },
    },
  });

  if (!issue) {
    res.status(404).json({ error: "issue not found" });
    return;
  }

  const ownerGithubId = issue.review.repository.user.githubId;
  if (githubUser?.id && githubUser.id !== ownerGithubId) {
    res.status(403).json({ error: "you don't have access to this repository" });
    return;
  }

  try {
    const result = await applyIssueFix(issueId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "failed to apply fix" });
  }
}
