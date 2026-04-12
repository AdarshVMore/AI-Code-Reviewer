import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";
import { applyDeploymentFix } from "../../worker-service/services/deployment.service.js";

export async function getDeployments(req: Request<{ repoId: string }>, res: Response) {
  const { repoId } = req.params;

  const deployments = await db.deployment.findMany({
    where: { repositoryId: repoId },
    orderBy: { createdAt: "desc" },
    include: { fixes: true },
  });

  res.json(deployments);
}

export async function fixDeployment(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const deployment = await db.deployment.findUnique({ where: { id } });

  if (deployment?.status !== "failed") {
    res.status(400).json({ error: "deployment is not failed" });
    return;
  }

  const result = await applyDeploymentFix(id);
  res.json(result);
}
