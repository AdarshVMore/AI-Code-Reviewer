import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";

export async function getPRInfo(
  req: Request<{ repoId: string; id: string }>,
  res: Response,
) {
  const { repoId, id } = req.params;

  const review = await db.pRReview.findFirst({
    where: {
      repositoryId: repoId,
      prNumber: Number(id),
    },
    include: {
      repository: {
        select: {
          name: true,
          owner: true,
        },
      },
      issues: true,
    },
  });

  
  if (!review) {
    res.status(404).json({ error: "review not found" });
    return;
  }
  
  res.json(review);
}

export async function getAllPRs(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const prs = await db.pRReview.findMany({
    where: { repositoryId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      prNumber: true,
      prTitle: true,
      summary: true,
      createdAt: true,
    },
  });

  res.json(prs);
}
