import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";

export async function getPRInfo(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const review = await db.pRReview.findUnique({
    where: { id },
    include: { repository: { select: { name: true, owner: true } } },
  });

  if (!review) {
    res.status(404).json({ error: "review not found" });
    return;
  }

  let parsedReview = null;
  try {
    parsedReview = JSON.parse(review.rawReview);
  } catch {}

  res.json({ ...review, parsedReview });
}
