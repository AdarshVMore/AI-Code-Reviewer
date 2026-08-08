import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs", "ai-context");

export type RetrievedContextLogMeta = {
  owner: string;
  repo: string;
  prNumber: number;
  searchQuery?: string;
};

/**
 * Persists the RAG/AST context retrieved for a PR review to a JSON file,
 * so what was actually sent to the model is inspectable after the fact.
 * Never throws — a logging failure must not break the review pipeline.
 */
export function logRetrievedContext(meta: RetrievedContextLogMeta, context: unknown): void {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });

    const timestamp = new Date().toISOString();
    const safeTimestamp = timestamp.replace(/[:.]/g, "-");
    const filename = `${meta.owner}-${meta.repo}-pr${meta.prNumber}-${safeTimestamp}.json`;
    const filePath = path.join(LOG_DIR, filename);

    fs.writeFileSync(
      filePath,
      JSON.stringify({ ...meta, timestamp, matchCount: Array.isArray(context) ? context.length : undefined, context }, null, 2),
      "utf-8",
    );

    console.log(`[ai-context] retrieved context for ${meta.owner}/${meta.repo}#${meta.prNumber} written to ${filePath}`);
  } catch (err) {
    console.warn("[ai-context] failed to write retrieved-context log", err);
  }
}
