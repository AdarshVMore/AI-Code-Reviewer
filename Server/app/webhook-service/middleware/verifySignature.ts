import crypto from "crypto";
import { Request } from "express";

export function verifySignature(req: Request, secret: string): boolean {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature || typeof signature !== "string") {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update((req as any).rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}
