import { Pinecone } from "@pinecone-database/pinecone";
import {
  downlaodRepoZIP,
  extractZIP,
  readCodeFiles,
  cleanup,
} from "./repoSetup.service.js";

const EMBEDDING_MODEL = "llama-text-embed-v2";
const EMBEDDING_DIMENSION = 1024;
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const EMBED_BATCH_SIZE = 96;

type RAGPipelineInput = {
  installationId: number;
  owner: string;
  repo: string;
};

type CodeChunk = {
  id: string;
  content: string;
  filePath: string;
  chunkIndex: number;
};

type EmbeddingVector = {
  id: string;
  values: number[];
  metadata: {
    content: string;
    filePath: string;
    chunkIndex: number;
  };
};

function getPinecone(): Pinecone {
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
}

function toIndexName(owner: string, repo: string): string {
  return `${owner}-${repo}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 45);
}

function chunkFile(filePath: string, content: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < content.length) {
    const chunk = content.slice(i, i + CHUNK_SIZE);
    chunks.push({
      id: `${filePath}::${chunkIndex}`,
      content: chunk,
      filePath,
      chunkIndex,
    });
    i += CHUNK_SIZE - CHUNK_OVERLAP;
    chunkIndex++;
  }
  console.log("<============================== chunks ================================> \n", chunks)

  return chunks;
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

export async function runRAGPipeline(data: object) {
  const { installationId, owner, repo } = data as RAGPipelineInput;

  const indexName = toIndexName(owner, repo);
  const zipPath = await downlaodRepoZIP(installationId, owner, repo);
  const extractedDir = extractZIP(zipPath);

  const files = readCodeFiles(extractedDir);
  const chunks = files.flatMap((f) => chunkFile(f.path, f.content));

  const vectors = await createEmbeddings({ chunks, indexName });
  await saveToVectorDB({ vectors, indexName });

  cleanup([zipPath, extractedDir]);
  console.log(
    `RAG pipeline complete for ${owner}/${repo}: ${chunks.length} chunks indexed`
  );
}

export async function createEmbeddings(
  values: object
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
        values: (embedding as any).values as number[],
        metadata: {
          content: chunk.content,
          filePath: chunk.filePath,
          chunkIndex: chunk.chunkIndex,
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

export async function searchRelevantEmbeddings(query: object) {
  const {
    text,
    indexName,
    topK = 5,
  } = query as { text: string; indexName: string; topK?: number };

  const pc = getPinecone();

  const result = await pc.inference.embed({
    model: EMBEDDING_MODEL,
    inputs: [text],
    parameters: { inputType: "query", truncate: "END" },
  });

  const queryVector = (result.data[0] as any).values as number[];
  const index = pc.index({ name: indexName });

  const searchResult = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return searchResult.matches.map((m) => ({
    id: m.id,
    score: m.score,
    content: m.metadata?.content as string,
    filePath: m.metadata?.filePath as string,
  }));
}

export async function vectorDBExists(DBName: string): Promise<Boolean> {
  if (!DBName) return false;

  const pc = getPinecone();
  const { indexes } = await pc.listIndexes();
  return indexes?.some((idx) => idx.name === DBName) ?? false;
}
