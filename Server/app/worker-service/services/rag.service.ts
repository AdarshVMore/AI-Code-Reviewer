import { Pinecone, type Index } from "@pinecone-database/pinecone";
import {
  downlaodRepoZIP,
  extractZIP,
  readCodeFiles,
  cleanup,
  isSupportedFile,
} from "./repoSetup.service.js";
import {
  parseFileToASTChunks,
  parseChangedFilesFromDiff,
  parseChangedSymbolsFromDiff,
  type ASTCodeChunk,
} from "../../../package/ast/parser.js";
import { getOctokit } from "../../../package/github/client.js";
import { db } from "../../../package/db/prisma.js";
import { getQueueRedisConnection } from "../../../package/lib/redis.client.js";
import type { Octokit } from "@octokit/rest";

const EMBEDDING_MODEL = "llama-text-embed-v2";
const EMBEDDING_DIMENSION = 1024;
const EMBED_BATCH_SIZE = 96;

type RAGPipelineTrigger = "pr_opened" | "push";

type RAGPipelineInput = {
  installationId: number;
  owner: string;
  repo: string;
  trigger?: RAGPipelineTrigger;
  headSha?: string;
};

export type CodeChunk = ASTCodeChunk;

type EmbeddingVector = {
  id: string;
  values: number[];
  metadata: {
    content: string;
    filePath: string;
    chunkIndex: number;
    nodeType: string;
    symbolName: string;
    startLine: number;
    endLine: number;
    imports: string;
  };
};

export type RelevantCodeMatch = {
  id: string;
  score: number;
  content: string;
  filePath: string;
  nodeType?: string;
  symbolName?: string;
  startLine?: number;
  endLine?: number;
};

function getPinecone(): Pinecone {
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
}

function chunkFilesWithAST(
  files: { path: string; content: string }[],
): CodeChunk[] {
  return files.flatMap((file) => parseFileToASTChunks(file.path, file.content));
}

async function ensureIndexExists(pc: Pinecone, indexName: string) {
  const { indexes } = await pc.listIndexes();
  const exists = indexes?.some((idx) => idx.name === indexName);

  if (!exists) {
    await pc.createIndex({
      name: indexName,
      dimension: EMBEDDING_DIMENSION,
      metric: "cosine",
      spec: {
        serverless: { cloud: "aws", region: "us-east-1" },
      },
      waitUntilReady: true,
    });
    console.log(`Created Pinecone index "${indexName}"`);
  }
}

export async function createEmbeddings(
  values: object,
): Promise<EmbeddingVector[]> {
  const { chunks, indexName } = values as {
    chunks: CodeChunk[];
    indexName: string;
  };

  const pc = getPinecone();
  await ensureIndexExists(pc, indexName);

  const vectors: EmbeddingVector[] = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map((c) => c.content);

    const result = await pc.inference.embed({
      model: EMBEDDING_MODEL,
      inputs: texts,
      parameters: { inputType: "passage", truncate: "END" },
    });

    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const embedding = result.data[j];
      vectors.push({
        id: chunk.id,
        values: (embedding as { values: number[] }).values,
        metadata: {
          content: chunk.content,
          filePath: chunk.filePath,
          chunkIndex: chunk.chunkIndex,
          nodeType: chunk.nodeType,
          symbolName: chunk.symbolName,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          imports: JSON.stringify(chunk.imports),
        },
      });
    }
  }

  return vectors;
}

export async function saveToVectorDB(embeddings: object) {
  const { vectors, indexName } = embeddings as {
    vectors: EmbeddingVector[];
    indexName: string;
  };

  const pc = getPinecone();
  const index = pc.index({ name: indexName });

  const UPSERT_BATCH = 100;
  for (let i = 0; i < vectors.length; i += UPSERT_BATCH) {
    const batch = vectors.slice(i, i + UPSERT_BATCH);
    await index.upsert({ records: batch });
  }

  console.log(`Upserted ${vectors.length} vectors to index "${indexName}"`);
  return { indexName, count: vectors.length };
}

export function toIndexName(owner: string, repo: string): string {
  return `${owner}-${repo}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 45);
}

function toMatch(m: {
  id?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}): RelevantCodeMatch {
  return {
    id: m.id ?? "",
    score: m.score ?? 0,
    content: (m.metadata?.content as string) ?? "",
    filePath: (m.metadata?.filePath as string) ?? "",
    nodeType: m.metadata?.nodeType as string | undefined,
    symbolName: m.metadata?.symbolName as string | undefined,
    startLine: m.metadata?.startLine as number | undefined,
    endLine: m.metadata?.endLine as number | undefined,
  };
}

async function embedQuery(text: string): Promise<number[]> {
  const pc = getPinecone();
  const result = await pc.inference.embed({
    model: EMBEDDING_MODEL,
    inputs: [text],
    parameters: { inputType: "query", truncate: "END" },
  });
  return (result.data[0] as { values: number[] }).values;
}

export async function searchRelevantEmbeddings(query: object) {
  const {
    text,
    indexName,
    topK = 5,
    filter,
  } = query as {
    text: string;
    indexName: string;
    topK?: number;
    filter?: Record<string, unknown>;
  };

  const queryVector = await embedQuery(text);
  const pc = getPinecone();
  const index = pc.index({ name: indexName });

  const searchResult = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    ...(filter ? { filter } : {}),
  });

  return searchResult.matches.map(toMatch);
}

function dedupeMatches(matches: RelevantCodeMatch[]): RelevantCodeMatch[] {
  const seen = new Set<string>();
  const ranked = [...matches].sort((a, b) => b.score - a.score);
  const unique: RelevantCodeMatch[] = [];

  for (const match of ranked) {
    const key = `${match.filePath}::${match.symbolName ?? match.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(match);
  }

  return unique;
}

function scoreMatchForDiff(
  match: RelevantCodeMatch,
  changedFiles: string[],
  changedSymbols: string[],
): number {
  let boost = match.score;

  if (changedFiles.some((file) => match.filePath.endsWith(file) || file.endsWith(match.filePath))) {
    boost += 0.15;
  }

  if (
    match.symbolName &&
    changedSymbols.some(
      (symbol) =>
        symbol === match.symbolName ||
        match.symbolName?.includes(symbol) ||
        symbol.includes(match.symbolName ?? ""),
    )
  ) {
    boost += 0.2;
  }

  if (match.nodeType === "import" || match.nodeType === "export") {
    boost += 0.05;
  }

  return boost;
}

export async function retrieveContextForDiff(options: {
  diff: string;
  semanticQuery: string;
  indexName: string;
  topK?: number;
}): Promise<RelevantCodeMatch[]> {
  const { diff, semanticQuery, indexName, topK = 8 } = options;
  const changedFiles = parseChangedFilesFromDiff(diff);
  const changedSymbols = parseChangedSymbolsFromDiff(diff);

  const semanticMatches = await searchRelevantEmbeddings({
    text: semanticQuery,
    indexName,
    topK: topK * 2,
  });


  const fileMatches: RelevantCodeMatch[] = [];
  for (const filePath of changedFiles.slice(0, 5)) {
    const matches = await searchRelevantEmbeddings({
      text: `${semanticQuery} ${filePath}`,
      indexName,
      topK: 4,
      filter: { filePath: { $eq: filePath } },
    });
    fileMatches.push(...matches);
  }

  const symbolMatches: RelevantCodeMatch[] = [];
  for (const symbol of changedSymbols.slice(0, 5)) {
    const matches = await searchRelevantEmbeddings({
      text: `${semanticQuery} ${symbol}`,
      indexName,
      topK: 3,
    });
    symbolMatches.push(...matches);
  }

  const combined = dedupeMatches([
    ...semanticMatches,
    ...fileMatches,
    ...symbolMatches,
  ]).map((match) => ({
    ...match,
    score: scoreMatchForDiff(match, changedFiles, changedSymbols),
  }));

  return combined
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function vectorDBExists(DBName: string): Promise<boolean> {
  if (!DBName) return false;

  const pc = getPinecone();
  const { indexes } = await pc.listIndexes();
  return indexes?.some((idx) => idx.name === DBName) ?? false;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForVectorIndex(
  indexName: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<boolean> {
  const { timeoutMs = 10 * 60 * 1000, intervalMs = 5000 } = options;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await vectorDBExists(indexName)) return true;
    console.log(`Waiting for vector index "${indexName}"...`);
    await sleep(intervalMs);
  }

  return false;
}


const LOCK_TTL_MS = 10 * 60 * 1000;

async function acquireRepoLock(indexName: string): Promise<string | null> {
  const client = await getQueueRedisConnection();
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ok = await client.set(`rag-lock:${indexName}`, token, {
    condition: "NX",
    expiration: { type: "PX", value: LOCK_TTL_MS },
  });
  return ok ? token : null;
}

async function releaseRepoLock(indexName: string, token: string): Promise<void> {
  const client = await getQueueRedisConnection();
  const current = await client.get(`rag-lock:${indexName}`);
  if (current === token) {
    await client.del(`rag-lock:${indexName}`);
  }
}

async function getDefaultBranchHead(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{ branch: string; sha: string }> {
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const branch = repoData.default_branch;
  const { data: branchData } = await octokit.repos.getBranch({ owner, repo, branch });
  return { branch, sha: branchData.commit.sha };
}

type ChangedFile = { path: string; status: string; previousPath?: string };

async function compareCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<ChangedFile[]> {
  const { data } = await octokit.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${base}...${head}`,
  });

  return (data.files ?? []).map((f) => ({
    path: f.filename,
    status: f.status,
    previousPath: f.previous_filename,
  }));
}

async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  ref: string,
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath, ref });
    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (err) {
    console.error(`Failed to fetch content for ${filePath}@${ref}:`, err);
    return null;
  }
}

async function deleteVectorsForFile(index: Index, filePath: string): Promise<void> {
  try {
    await index.deleteMany({ filter: { filePath: { $eq: filePath } } });
  } catch (err) {
    console.error(`Failed to delete stale vectors for ${filePath}:`, err);
  }
}

async function runFullIndex(
  installationId: number,
  owner: string,
  repo: string,
  indexName: string,
): Promise<void> {
  const zipPath = await downlaodRepoZIP(installationId, owner, repo);
  const extractedDir = extractZIP(zipPath);

  const files = readCodeFiles(extractedDir);
  const chunks = chunkFilesWithAST(files);

  const vectors = await createEmbeddings({ chunks, indexName });
  await saveToVectorDB({ vectors, indexName });

  cleanup([zipPath, extractedDir]);
  console.log(
    `Full RAG index built for ${owner}/${repo}: ${files.length} files → ${chunks.length} AST chunks`,
  );
}

async function runIncrementalIndex(
  octokit: Octokit,
  owner: string,
  repo: string,
  indexName: string,
  baseSha: string,
  headSha: string,
): Promise<void> {
  const changedFiles = await compareCommits(octokit, owner, repo, baseSha, headSha);
  if (changedFiles.length === 0) {
    console.log(`No file changes between ${baseSha} and ${headSha} for "${indexName}"`);
    return;
  }

  const pc = getPinecone();
  const index = pc.index({ name: indexName });

  const removed = changedFiles.filter((f) => f.status === "removed" || f.status === "renamed");
  const changed = changedFiles.filter(
    (f) => f.status !== "removed" && isSupportedFile(f.path),
  );

  const pathsToClear = new Set<string>([
    ...removed.map((f) => f.previousPath ?? f.path),
    ...changed.map((f) => f.path),
  ]);
  for (const filePath of pathsToClear) {
    await deleteVectorsForFile(index, filePath);
  }

  const files: { path: string; content: string }[] = [];
  for (const file of changed) {
    const content = await fetchFileContent(octokit, owner, repo, file.path, headSha);
    if (content !== null) files.push({ path: file.path, content });
  }

  const chunks = chunkFilesWithAST(files);
  if (chunks.length > 0) {
    const vectors = await createEmbeddings({ chunks, indexName });
    await saveToVectorDB({ vectors, indexName });
  }

  console.log(
    `Incremental RAG update for "${indexName}": ${removed.length} removed, ${changed.length} changed → ${chunks.length} chunks re-embedded`,
  );
}

export async function runRAGPipeline(data: object) {
  const input = data as RAGPipelineInput;
  const { installationId, owner, repo } = input;
  const trigger = input.trigger ?? "push";
  const indexName = toIndexName(owner, repo);

  const lockToken = await acquireRepoLock(indexName);
  if (!lockToken) {
    console.log(`RAG pipeline already running for "${indexName}" — skipping this trigger`);
    return;
  }

  try {
    const indexExists = await vectorDBExists(indexName);

    if (trigger === "pr_opened" && indexExists) {
      console.log(`Index "${indexName}" already exists — skipping rebuild on PR open`);
      return;
    }

    if (!indexExists) {
      await runFullIndex(installationId, owner, repo, indexName);
      const { sha } = input.headSha
        ? { sha: input.headSha }
        : await getDefaultBranchHead(await getOctokit(installationId), owner, repo);
      await db.repository.update({
        where: { owner_name: { owner, name: repo } },
        data: { lastIndexedSha: sha, lastIndexedAt: new Date() },
      });
      return;
    }

    // Index already exists and this is a push — bring it up to date incrementally.
    const octokit = await getOctokit(installationId);
    const headSha = input.headSha ?? (await getDefaultBranchHead(octokit, owner, repo)).sha;
    const repository = await db.repository.findUnique({
      where: { owner_name: { owner, name: repo } },
      select: { lastIndexedSha: true },
    });

    if (!repository?.lastIndexedSha) {
      await runFullIndex(installationId, owner, repo, indexName);
    } else if (repository.lastIndexedSha === headSha) {
      console.log(`"${indexName}" already up to date at ${headSha}`);
      return;
    } else {
      await runIncrementalIndex(
        octokit,
        owner,
        repo,
        indexName,
        repository.lastIndexedSha,
        headSha,
      );
    }

    await db.repository.update({
      where: { owner_name: { owner, name: repo } },
      data: { lastIndexedSha: headSha, lastIndexedAt: new Date() },
    });
  } finally {
    await releaseRepoLock(indexName, lockToken);
  }
}
