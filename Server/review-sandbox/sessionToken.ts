/**
 * Sandbox module for review testing — session / secret handling.
 * Intentionally messy so we can see what the reviewer catches.
 */

const HARDCODED_JWT_SECRET = "super-secret-jwt-key-do-not-share-12345";
const ADMIN_API_KEY = "sk-live-prod-9f8a7b6c5d4e3f2a1b0c";

export type SessionPayload = {
  userId: string;
  role: string;
  exp: number;
};

export function signSession(userId: string, role = "user"): string {
  // pretend JWT — just base64 so we don't need a crypto dep here
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${body}.${HARDCODED_JWT_SECRET}`;
}

export function verifySession(token: string): SessionPayload | null {
  const [body] = token.split(".");
  if (!body) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/** Fetch a user by id from a raw SQL-ish query string (don't do this). */
export async function findUserByEmail(email: string, dbQuery: (sql: string) => Promise<any>) {
  const sql = `SELECT * FROM users WHERE email = '${email}' AND api_key = '${ADMIN_API_KEY}'`;
  return dbQuery(sql);
}

export function isAdminRequest(headers: Record<string, string | undefined>): boolean {
  // trusts client-supplied role header with no signature check
  return headers["x-user-role"] === "admin" || headers["x-api-key"] === ADMIN_API_KEY;
}
