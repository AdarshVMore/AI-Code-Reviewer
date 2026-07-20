import path from "path";

export function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function fileNodeId(repoKey: string, filePath: string): string {
  return `file:${repoKey}:${normalizeRepoPath(filePath)}`;
}

export function symbolNodeId(
  repoKey: string,
  filePath: string,
  fqn: string,
  startLine: number,
  endLine: number,
): string {
  return `sym:${repoKey}:${normalizeRepoPath(filePath)}#${fqn}@${startLine}:${endLine}`;
}

export function externalModuleId(repoKey: string, moduleName: string): string {
  return `ext:${repoKey}:${moduleName}`;
}

export function edgeId(
  type: string,
  fromId: string,
  toId: string,
): string {
  return `edge:${type}:${fromId}->${toId}`;
}

export function vectorIdForSymbol(
  filePath: string,
  nodeType: string,
  fqn: string,
  startLine: number,
  endLine: number,
): string {
  return `${normalizeRepoPath(filePath)}::${nodeType}::${fqn}@${startLine}:${endLine}`;
}

export function getExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return ext || "";
}

export function isJsTsExt(ext: string): boolean {
  return [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(ext);
}

export function isPythonExt(ext: string): boolean {
  return ext === ".py";
}
