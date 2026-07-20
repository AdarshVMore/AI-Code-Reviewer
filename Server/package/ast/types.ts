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

export type GraphEdgeType =
  | "defines"
  | "imports"
  | "exports"
  | "calls";

export type GraphNodeKind = "file" | "symbol" | "external_module";

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
  fqn?: string;
  exported?: boolean;
};

export type StructuredImport = {
  source: string;
  localNames: string[];
  importedNames: string[];
  isDefault: boolean;
  isNamespace: boolean;
  isTypeOnly: boolean;
  raw: string;
};

export type StructuredExport = {
  localName: string;
  exportedName: string;
  isDefault: boolean;
  isReExport: boolean;
  source?: string;
};

export type FileSymbol = {
  id: string;
  name: string;
  fqn: string;
  nodeType: ASTNodeType;
  startLine: number;
  endLine: number;
  content: string;
  exported: boolean;
  ownerName?: string;
};

export type FileAnalysis = {
  filePath: string;
  language: "js" | "ts" | "python" | "unknown";
  imports: StructuredImport[];
  exports: StructuredExport[];
  symbols: FileSymbol[];
  importStatements: string[];
  calls: Array<{
    callerId: string;
    calleeName: string;
    property?: string;
  }>;
  chunks: ASTCodeChunk[];
};

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  repoKey: string;
  name: string;
  filePath?: string;
  nodeType?: ASTNodeType;
  fqn?: string;
  startLine?: number;
  endLine?: number;
  exported?: boolean;
  vectorId?: string;
  content?: string;
};

export type GraphEdge = {
  id: string;
  type: GraphEdgeType;
  fromId: string;
  toId: string;
  evidence?: string;
};

export type CodeGraph = {
  repoKey: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  chunks: ASTCodeChunk[];
};
