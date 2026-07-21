import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";
import Python from "tree-sitter-python";
import {
  extractStructuredExports,
  extractStructuredImports,
} from "./imports.js";
import { getExtension, normalizeRepoPath } from "./ids.js";
import { languageFromPath } from "./resolve.js";
import { extractCalls, extractSymbols, lineAt, toChunkId } from "./symbols.js";
import type { ASTCodeChunk, FileAnalysis } from "./types.js";

type TreeSitterLanguage = ReturnType<Parser["getLanguage"]>;

const parserCache = new Map<string, Parser>();

const LANGUAGE_BY_EXT: Record<string, TreeSitterLanguage> = {
  ".js": JavaScript as TreeSitterLanguage,
  ".jsx": JavaScript as TreeSitterLanguage,
  ".mjs": JavaScript as TreeSitterLanguage,
  ".cjs": JavaScript as TreeSitterLanguage,
  ".ts": TypeScript.typescript as TreeSitterLanguage,
  ".tsx": TypeScript.tsx as TreeSitterLanguage,
  ".py": Python as TreeSitterLanguage,
};

function getParser(ext: string): Parser | null {
  const language = LANGUAGE_BY_EXT[ext];
  if (!language) return null;
  if (!parserCache.has(ext)) {
    const parser = new Parser();
    parser.setLanguage(language);
    parserCache.set(ext, parser);
  }
  return parserCache.get(ext)!;
}

function formatChunkForEmbedding(
  chunk: Omit<ASTCodeChunk, "id" | "chunkIndex">,
): string {
  const header = [
    `// File: ${chunk.filePath}`,
    `// Symbol: ${chunk.symbolName} (${chunk.nodeType})`,
    `// Lines: ${chunk.startLine}-${chunk.endLine}`,
  ];
  if (chunk.imports.length > 0) {
    header.push(`// Imports: ${chunk.imports.slice(0, 8).join(", ")}`);
  }
  return `${header.join("\n")}\n${chunk.content}`;
}

const FALLBACK_CHUNK_SIZE = 800;
const FALLBACK_OVERLAP = 100;

function fallbackChunks(filePath: string, content: string): ASTCodeChunk[] {
  const chunks: ASTCodeChunk[] = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < content.length) {
    const slice = content.slice(i, i + FALLBACK_CHUNK_SIZE);
    const startLine = content.slice(0, i).split("\n").length;
    const endLine = startLine + slice.split("\n").length - 1;
    const symbolName = `chunk-${chunkIndex}`;
    const id = toChunkId(filePath, "file", symbolName, startLine, endLine);

    chunks.push({
      id,
      content: `// File: ${filePath}\n// Symbol: ${symbolName} (file)\n// Lines: ${startLine}-${endLine}\n${slice}`,
      filePath,
      chunkIndex,
      nodeType: "file",
      symbolName,
      fqn: symbolName,
      startLine,
      endLine,
      imports: [],
      exported: false,
    });
    i += FALLBACK_CHUNK_SIZE - FALLBACK_OVERLAP;
    chunkIndex++;
  }

  return chunks;
}

export function analyzeFile(options: {
  filePath: string;
  content: string;
  repoKey?: string;
}): FileAnalysis {
  const filePath = normalizeRepoPath(options.filePath);
  const content = options.content;
  const repoKey = options.repoKey ?? "_";
  const ext = getExtension(filePath);
  const language = languageFromPath(filePath);
  const parser = getParser(ext);

  if (!parser || language === "unknown") {
    return {
      filePath,
      language,
      imports: [],
      exports: [],
      symbols: [],
      importStatements: [],
      calls: [],
      chunks: fallbackChunks(filePath, content),
    };
  }

  try {
    const tree = parser.parse(content);
    // Soften errors: still try to extract what we can
    const imports = extractStructuredImports(tree.rootNode, language);
    const exports = extractStructuredExports(tree.rootNode, language);
    const exportedNames = new Set<string>();
    for (const exp of exports) {
      exportedNames.add(exp.localName);
      exportedNames.add(exp.exportedName);
    }

    // Mark python module-level symbols as exported later in extractSymbols
    const symbols = extractSymbols({
      root: tree.rootNode,
      content,
      filePath,
      repoKey,
      language,
      exportedNames,
    });

    // For export statements wrapping a declaration, ensure export flag
    for (const sym of symbols) {
      if (exportedNames.has(sym.name) || exportedNames.has(sym.fqn)) {
        sym.exported = true;
      }
    }

    const calls = extractCalls({
      root: tree.rootNode,
      symbols,
      language,
      content,
    });

    const importStatements = imports.map((i) => i.raw);
    const chunks: ASTCodeChunk[] = symbols.map((sym, index) => {
      const base = {
        content: sym.content,
        filePath,
        chunkIndex: index,
        nodeType: sym.nodeType,
        symbolName: sym.fqn,
        fqn: sym.fqn,
        startLine: sym.startLine,
        endLine: sym.endLine,
        imports: importStatements,
        exported: sym.exported,
      };
      return {
        ...base,
        id: toChunkId(
          filePath,
          sym.nodeType,
          sym.fqn,
          sym.startLine,
          sym.endLine,
        ),
        content: formatChunkForEmbedding(base),
      };
    });

    if (chunks.length === 0) {
      return {
        filePath,
        language,
        imports,
        exports,
        symbols,
        importStatements,
        calls,
        chunks: fallbackChunks(filePath, content),
      };
    }

    return {
      filePath,
      language,
      imports,
      exports,
      symbols,
      importStatements,
      calls,
      chunks,
    };
  } catch {
    return {
      filePath,
      language,
      imports: [],
      exports: [],
      symbols: [],
      importStatements: [],
      calls: [],
      chunks: fallbackChunks(filePath, content),
    };
  }
}

export function parseFileToASTChunks(
  filePath: string,
  content: string,
): ASTCodeChunk[] {
  return analyzeFile({ filePath, content }).chunks;
}

export { lineAt };
