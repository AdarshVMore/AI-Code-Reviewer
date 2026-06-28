import {
  searchRelevantEmbeddings,
  retrieveContextForDiff,
  toIndexName,
} from "../../app/worker-service/services/rag.service.js";

export async function searchCodeContext(options: {
  owner: string;
  repo: string;
  diff: string;
  semanticQuery: string;
  topK?: number;
}) {
  const indexName = toIndexName(options.owner, options.repo);
  return retrieveContextForDiff({
    diff: options.diff,
    semanticQuery: options.semanticQuery,
    indexName,
    topK: options.topK ?? 8,
  });
}

export { searchRelevantEmbeddings, retrieveContextForDiff, toIndexName };
