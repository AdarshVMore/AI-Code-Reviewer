/**
 * Public AST entrypoint.
 * Chunking + graph construction live in sibling modules; this file re-exports
 * the stable API used by the RAG pipeline.
 */

export type {
  ASTNodeType,
  ASTCodeChunk,
  GraphEdgeType as EdgeTypes,
  GraphNode as Node,
  GraphEdge,
  CodeGraph,
  FileAnalysis,
} from "./types.js";

export { parseFileToASTChunks, analyzeFile } from "./analyze.js";
export { buildCodeGraph } from "./graph.js";
export {
  normalizeRepoPath,
  fileNodeId,
  symbolNodeId,
  vectorIdForSymbol,
} from "./ids.js";

export function parseChangedFilesFromDiff(diff: string): string[] {
  const files = new Set<string>();

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      const filePath = line.slice(6).trim();
      if (filePath && filePath !== "/dev/null") files.add(filePath);
      continue;
    }
    if (line.startsWith("--- a/")) {
      const filePath = line.slice(6).trim();
      if (filePath && filePath !== "/dev/null") files.add(filePath);
    }
  }

  return [...files];
}

export function parseChangedSymbolsFromDiff(diff: string): string[] {
  const symbols = new Set<string>();
  const identifierPattern =
    /(?:function|class|const|let|var|async\s+function|def|func|type|interface|struct|enum)\s+([A-Za-z_$][\w$]*)/g;

  for (const line of diff.split("\n")) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    const added = line.slice(1);
    let match: RegExpExecArray | null;
    while ((match = identifierPattern.exec(added)) !== null) {
      symbols.add(match[1]);
    }
  }

  return [...symbols];
}
