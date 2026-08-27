import { Request, Response, NextFunction } from "express"
import axios from "axios"
import { db } from "../../../package/db/prisma.js"

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const tokens = authHeader.split(" ")[1]

  try {
    const { data: githubUser } = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = await db.user.findUnique({ where: { githubId: githubUser.id } });
    if (!user) {
      res.status(401).json({ error: "unauthorized" })
      return
    }

    (req as any).githubUser = githubUser;
    (req as any).userId = user.id;
    next()
  } catch {
    res.status(401).json({ error: "invalid token" })
  }
}

export function getUserId(req: Request): string | null {
  return (req as any).userId ?? null
}
