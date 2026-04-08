import { Request, Response, NextFunction } from "express"
import axios from "axios"

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const { data } = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    (req as any).githubUser = data;
    next()
  } catch {
    res.status(401).json({ error: "invalid token" })
  }
}
