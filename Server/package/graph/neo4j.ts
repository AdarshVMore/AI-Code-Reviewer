import neo4j, { type Driver, type Session } from "neo4j-driver";

let driver: Driver | null = null;
let warnedMissingConfig = false;

export function isNeo4jConfigured(): boolean {
  return Boolean(
    process.env.NEO4J_URI &&
      process.env.NEO4J_USERNAME &&
      process.env.NEO4J_PASSWORD,
  );
}

export function getNeo4jDriver(): Driver | null {
  if (!isNeo4jConfigured()) {
    if (!warnedMissingConfig) {
      console.warn(
        "Neo4j Aura is not configured (NEO4J_URI/NEO4J_USERNAME/NEO4J_PASSWORD). Graph features disabled.",
      );
      warnedMissingConfig = true;
    }
    return null;
  }

  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME!,
        process.env.NEO4J_PASSWORD!,
      ),
    );
  }

  return driver;
}

export function getNeo4jDatabase(): string | undefined {
  return process.env.NEO4J_DATABASE || undefined;
}

export async function withNeo4jSession<T>(
  fn: (session: Session) => Promise<T>,
): Promise<T | null> {
  const d = getNeo4jDriver();
  if (!d) return null;

  const database = getNeo4jDatabase();
  const session = database
    ? d.session({ database })
    : d.session();

  try {
    return await fn(session);
  } finally {
    await session.close();
  }
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
