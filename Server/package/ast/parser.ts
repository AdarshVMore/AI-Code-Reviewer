import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";
import Python from "tree-sitter-python";
import fs from "fs";
import { error } from "console";

export type ASTNodeType =
  | "function"
  | "class"
  | "method"
  | "interface"
  | "type"
  | "import"
  | "export"
  | "variable"
  | "struct"
  | "enum"
  | "module"
  | "file";

export type ASTCodeChunk = {
  id: string;
  content: string;
  filePath: string;
  chunkIndex: number;
  nodeType: ASTNodeType;
  symbolName: string;
  startLine: number;
  endLine: number;
  imports: string[];
};

type TreeSitterLanguage = ReturnType<Parser["getLanguage"]>;

type LanguageConfig = {
  language: TreeSitterLanguage;
  chunkNodeTypes: Set<string>;
  nameFields: Record<string, string>;
};

const JS_TS_CHUNK_TYPES = new Set([
  "function_declaration",
  "generator_function_declaration",
  "class_declaration",
  "method_definition",
  "interface_declaration",
  "type_alias_declaration",
  "import_statement",
  "export_statement",
  "lexical_declaration",
  "variable_declaration",
]);

const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  ".js": {
    language: JavaScript as TreeSitterLanguage,
    chunkNodeTypes: JS_TS_CHUNK_TYPES,
    nameFields: {
      function_declaration: "name",
      generator_function_declaration: "name",
      class_declaration: "name",
      method_definition: "name",
      interface_declaration: "name",
      type_alias_declaration: "name",
      lexical_declaration: "declarator",
      variable_declaration: "declarator",
    },
  },
  ".jsx": {
    language: JavaScript as TreeSitterLanguage,
    chunkNodeTypes: JS_TS_CHUNK_TYPES,
    nameFields: {
      function_declaration: "name",
      generator_function_declaration: "name",
      class_declaration: "name",
      method_definition: "name",
      lexical_declaration: "declarator",
      variable_declaration: "declarator",
    },
  },
  ".ts": {
    language: TypeScript.typescript as TreeSitterLanguage,
    chunkNodeTypes: JS_TS_CHUNK_TYPES,
    nameFields: {
      function_declaration: "name",
      generator_function_declaration: "name",
      class_declaration: "name",
      method_definition: "name",
      interface_declaration: "name",
      type_alias_declaration: "name",
      lexical_declaration: "declarator",
      variable_declaration: "declarator",
    },
  },
  ".tsx": {
    language: TypeScript.tsx as TreeSitterLanguage,
    chunkNodeTypes: JS_TS_CHUNK_TYPES,
    nameFields: {
      function_declaration: "name",
      generator_function_declaration: "name",
      class_declaration: "name",
      method_definition: "name",
      interface_declaration: "name",
      type_alias_declaration: "name",
      lexical_declaration: "declarator",
      variable_declaration: "declarator",
    },
  },
  ".py": {
    language: Python as TreeSitterLanguage,
    chunkNodeTypes: new Set([
      "function_definition",
      "class_definition",
      "import_statement",
      "import_from_statement",
      "decorated_definition",
    ]),
    nameFields: {
      function_definition: "name",
      class_definition: "name",
      decorated_definition: "definition",
    },
  },
};

const NODE_TYPE_MAP: Record<string, ASTNodeType> = {
  function_declaration: "function",
  generator_function_declaration: "function",
  function_definition: "function",
  function_item: "function",
  class_declaration: "class",
  class_definition: "class",
  class: "class",
  method_definition: "method",
  method_declaration: "method",
  method: "method",
  singleton_method: "method",
  interface_declaration: "interface",
  interface: "interface",
  type_alias_declaration: "type",
  type_declaration: "type",
  struct_item: "struct",
  enum_item: "enum",
  import_statement: "import",
  import_from_statement: "import",
  import_declaration: "import",
  use_declaration: "import",
  export_statement: "export",
  lexical_declaration: "variable",
  variable_declaration: "variable",
  impl_item: "class",
  mod_item: "module",
  module: "module",
  decorated_definition: "function",
};

const parserCache = new Map<string, Parser>();

function getParser(ext: string): Parser | null {
  const config = LANGUAGE_CONFIG[ext];
  if (!config) return null;

  if (!parserCache.has(ext)) {
    const parser = new Parser();
    parser.setLanguage(config.language);
    parserCache.set(ext, parser);
  }
  console.log("<=============================== recieved Parser is ===============================> \n ", parserCache.get(ext))
  fs.writeFileSync('parserCache.json', JSON.stringify(parserCache.get(ext), null, 2))
  return parserCache.get(ext)!;
}

function lineAt(content: string, byteIndex: number): number {
  return content.slice(0, byteIndex).split("\n").length;
}

function extractSymbolName(
  node: Parser.SyntaxNode,
  config: LanguageConfig,
): string {
  console.log("<=============================== Node and Config ===============================> \n ", node, config)
  fs.writeFileSync('nodeAndConfig.json', JSON.stringify({node, config}, null, 2))
  if (
    node.type === "import_statement" ||
    node.type === "import_from_statement" ||
    node.type === "import_declaration" ||
    node.type === "use_declaration"
  ) {
    const source = node.childForFieldName("source") ?? node.childForFieldName("path");
    console.log("<====== SOURCE =====> \n", source?.text)
    fs.writeFileSync('source.json', JSON.stringify(source?.text, null, 2))
    if (source) return source.text.replace(/['"]/g, "").slice(0, 120);
  }

  const nameField = config.nameFields[node.type];
  if (nameField) {
    const nameNode = node.childForFieldName(nameField);
    if (nameNode) {
      if (nameNode.type === "variable_declarator") {
        const id = nameNode.childForFieldName("name");
        if (id) return id.text.slice(0, 120);
      }
      console.log("<====== NameNode Text =====> \n", nameNode?.text)
      return nameNode.text.slice(0, 120);
    }
  }

  for (const child of node.namedChildren) {
    if (
      child.type === "identifier" ||
      child.type === "type_identifier" ||
      child.type === "property_identifier"
    ) {
      console.log("<====== Child Text =====> \n", child.text)
      return child.text.slice(0, 120);
    }
    if (child.type === "variable_declarator") {
      const id = child.childForFieldName("name");
      if (id) return id.text.slice(0, 120);
    }
  }

  return node.type;
}

function extractImports(content: string, ext: string): string[] {
  const parser = getParser(ext);
  if (!parser) return [];

  const tree = parser.parse(content);
  const imports: string[] = [];

  function walk(node: Parser.SyntaxNode) {
    if (
      node.type === "import_statement" ||
      node.type === "import_from_statement" ||
      node.type === "import_declaration" ||
      node.type === "use_declaration"
    ) {
      imports.push(node.text.trim());
    }
    for (const child of node.namedChildren) walk(child);
  }

  console.log("<====== Tree Root Node =====> \n", tree.rootNode.type)
  fs.writeFileSync('treeRootNode.json', JSON.stringify(tree.rootNode.type, null, 2))
  walk(tree.rootNode);
  console.log("<====== Imports =====> \n", imports)
  fs.writeFileSync('imports.json', JSON.stringify(imports, null, 2))
  return imports;
}

function mapNodeType(tsType: string): ASTNodeType {
  console.log("<====== Mapping Node Type =====> \n", tsType, NODE_TYPE_MAP[tsType])
  fs.writeFileSync('mapNodeType.json', JSON.stringify({tsType, mapped: NODE_TYPE_MAP[tsType]}, null, 2))
  return NODE_TYPE_MAP[tsType] ?? "file";
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
  fs.writeFileSync('formatChunkForEmbedding.json', JSON.stringify({header, content: chunk?.content}, null, 2))
  return `${header.join("\n")}\n${chunk.content}`;
}

function walkAST(
  node: Parser.SyntaxNode,
  config: LanguageConfig,
  filePath: string,
  content: string,
  fileImports: string[],
  chunks: ASTCodeChunk[],
  seen: Set<string>,
) {
  if (config.chunkNodeTypes.has(node.type)) {
    const startLine = lineAt(content, node.startIndex);
    const endLine = lineAt(content, node.endIndex);
    const symbolName = extractSymbolName(node, config);
    const nodeType = mapNodeType(node.type);
    const dedupeKey = `${startLine}:${endLine}:${nodeType}:${symbolName}`;

    if (!seen.has(dedupeKey) && node.text.trim().length > 0) {
      seen.add(dedupeKey);
      chunks.push({
        id: "",
        content: node.text,
        filePath,
        chunkIndex: chunks.length,
        nodeType,
        symbolName,
        startLine,
        endLine,
        imports: fileImports,
      });
    }
  }

  for (const child of node.namedChildren) {
    walkAST(child, config, filePath, content, fileImports, chunks, seen);
  }
}

export function parseFileToASTChunks(
  filePath: string,
  content: string,
): ASTCodeChunk[] {
  const ext = filePath.includes(".")
    ? `.${filePath.split(".").pop()}`
    : "";
  const config = LANGUAGE_CONFIG[ext];
  const parser = getParser(ext);

  if (!config || !parser) {
    return fallbackChunk(filePath, content);
  }

  try {
    const tree = parser.parse(content);
    console.log("<====== Tree Root Node =====> \n", tree.rootNode.type)
    if (tree.rootNode.hasError) {
      return fallbackChunk(filePath, content);
    }

    const fileImports = extractImports(content, ext);
    const chunks: ASTCodeChunk[] = [];
    walkAST(
      tree.rootNode,
      config,
      filePath,
      content,
      fileImports,
      chunks,
      new Set(),
    );
    console.log("<====== Chunks =====> \n", chunks)
    fs.writeFileSync('chunks.json', JSON.stringify(chunks, null, 2))
    if (chunks.length === 0) {
      return fallbackChunk(filePath, content);
    }

    return chunks.map((chunk, index) => {
      const enriched = formatChunkForEmbedding(chunk);
      console.log("<====== Enriched Chunk =====> \n", enriched)
      fs.writeFileSync('enrichedChunk.json', JSON.stringify(enriched, null, 2))
      return {
        ...chunk,
        chunkIndex: index,
        content: enriched,
        id: `${filePath}::${chunk.nodeType}::${chunk.symbolName}::${index}`,
      };
    });
  } catch {
    fs.writeFileSync('error.json', JSON.stringify(new Error(), null, 2))
    throw error;
  }
}

const FALLBACK_CHUNK_SIZE = 800;
const FALLBACK_OVERLAP = 100;

function fallbackChunk(filePath: string, content: string): ASTCodeChunk[] {
  const chunks: ASTCodeChunk[] = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < content.length) {
    const slice = content.slice(i, i + FALLBACK_CHUNK_SIZE);
    const startLine = content.slice(0, i).split("\n").length;
    const endLine = startLine + slice.split("\n").length - 1;

    chunks.push({
      id: `${filePath}::file::chunk-${chunkIndex}::${chunkIndex}`,
      content: `// File: ${filePath}\n// Symbol: chunk-${chunkIndex} (file)\n// Lines: ${startLine}-${endLine}\n${slice}`,
      filePath,
      chunkIndex,
      nodeType: "file",
      symbolName: `chunk-${chunkIndex}`,
      startLine,
      endLine,
      imports: [],
    });
    i += FALLBACK_CHUNK_SIZE - FALLBACK_OVERLAP;
    chunkIndex++;
  }

  return chunks;
}

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
