import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";
import { getOctokit } from "../../../package/github/client.js";

export async function getCollaborators(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const repository = await db.repository.findUnique({ where: { id } });
  if (!repository) {
    res.status(404).json({ error: "repository not found" });
    return;
  }

  const octokit = await getOctokit(repository.installationId);
  const collaborators = await octokit.paginate(octokit.rest.repos.listCollaborators, {
    owner: repository.owner,
    repo: repository.name,
  });

  res.json(
    collaborators.map((c: { id: number; login: string; avatar_url: string; permissions?: Record<string, boolean> }) => ({
      id: c.id,
      login: c.login,
      avatar_url: c.avatar_url,
      permissions: c.permissions,
    }))
  );
}
