import axios from "axios";
import { Request, Response } from "express";
import { db } from "../../../package/db/prisma.js";

export async function getUser(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "missing authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const { data: githubUser } = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

  let user = await db.user.findUnique({ where: { githubId: githubUser.id } });
  if (!user) {
    user = await db.user.create({
      data: {
        githubId: githubUser.id,
        githubUsername: githubUser.login,
        githubAvatar: githubUser.avatar_url,
        email: githubUser.email,
        plan: "free",
      },
    });
  }

  res.json(user);
}
