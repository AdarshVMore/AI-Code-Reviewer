import path from "path";
import fs from "fs";
import {
  getExtension,
  isJsTsExt,
  isPythonExt,
  normalizeRepoPath,
} from "./ids.js";

const JS_TS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

export type PathAliasMap = Record<string, string[]>;

export function loadTsPathAliases(
  repoRoot: string,
): PathAliasMap {
  const candidates = ["tsconfig.json", "jsconfig.json"];
  for (const file of candidates) {
    const full = path.join(repoRoot, file);
    if (!fs.existsSync(full)) continue;
    try {
      const raw = fs.readFileSync(full, "utf-8");
      // strip comments for loose JSON
      const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      const json = JSON.parse(stripped) as {
        compilerOptions?: { paths?: Record<string, string[]>; baseUrl?: string };
      };
      const paths = json.compilerOptions?.paths;
      if (!paths) return {};
      const baseUrl = json.compilerOptions?.baseUrl ?? ".";
      const aliases: PathAliasMap = {};
      for (const [alias, targets] of Object.entries(paths)) {
        aliases[alias] = targets.map((t) =>
          normalizeRepoPath(path.posix.join(baseUrl, t)),
        );
      }
      return aliases;
    } catch {
      continue;
    }
  }
  return {};
}

function tryExactFile(
  fileIndex: Set<string>,
  candidate: string,
): string | null {
  const normalized = normalizeRepoPath(candidate);
  if (fileIndex.has(normalized)) return normalized;
  return null;
}

function tryWithExtensions(
  fileIndex: Set<string>,
  base: string,
  preferredExts: string[],
): string | null {
  const direct = tryExactFile(fileIndex, base);
  if (direct) return direct;

  for (const ext of preferredExts) {
    const withExt = tryExactFile(fileIndex, `${base}${ext}`);
    if (withExt) return withExt;
  }

  for (const ext of preferredExts) {
    const indexFile = tryExactFile(fileIndex, path.posix.join(base, `index${ext}`));
    if (indexFile) return indexFile;
  }

  return null;
}

function applyAlias(
  source: string,
  aliases: PathAliasMap,
): string | null {
  for (const [alias, targets] of Object.entries(aliases)) {
    const prefix = alias.replace(/\*$/, "");
    const hasStar = alias.endsWith("*");
    if (hasStar) {
      if (!source.startsWith(prefix)) continue;
      const rest = source.slice(prefix.length);
      for (const target of targets) {
        const targetPrefix = target.replace(/\*$/, "");
        return normalizeRepoPath(`${targetPrefix}${rest}`);
      }
    } else if (source === alias) {
      return normalizeRepoPath(targets[0] ?? "");
    }
  }
  return null;
}

export function resolveImportSource(options: {
  fromFile: string;
  source: string;
  fileIndex: Set<string>;
  aliases?: PathAliasMap;
}): string | null {
  const { fromFile, source, fileIndex, aliases = {} } = options;
  if (!source || source.startsWith("node:") || source.startsWith("http")) {
    return null;
  }

  const fromExt = getExtension(fromFile);
  const fromDir = path.posix.dirname(normalizeRepoPath(fromFile));

  // Python: try package / same-dir module before treating as external
  if (isPythonExt(fromExt)) {
    const dotted = source.replace(/^\.+/, "").replace(/\./g, "/");
    const candidates = [
      dotted,
      path.posix.join(fromDir, dotted),
      path.posix.join(fromDir, source),
    ];
    for (const base of candidates) {
      if (!base) continue;
      const hit =
        tryWithExtensions(fileIndex, base, [".py"]) ??
        tryExactFile(fileIndex, path.posix.join(base, "__init__.py"));
      if (hit) return hit;
    }
  }

  // bare package import (JS/TS) or unresolved python stdlib
  if (!source.startsWith(".") && !source.startsWith("/") && !source.startsWith("@/")) {
    const aliased = applyAlias(source, aliases);
    if (!aliased) return null;
    const preferred = isPythonExt(fromExt) ? [".py"] : JS_TS_EXTS;
    return tryWithExtensions(
      fileIndex,
      aliased.replace(/\.(ts|tsx|js|jsx|py)$/, ""),
      preferred,
    );
  }

  let candidate = source;
  if (source.startsWith("@/")) {
    const aliased = applyAlias(source, aliases) ?? source.replace(/^@\//, "src/");
    candidate = aliased;
  } else if (source.startsWith(".")) {
    candidate = normalizeRepoPath(path.posix.join(fromDir, source));
  } else {
    candidate = normalizeRepoPath(source);
  }

  if (isPythonExt(fromExt)) {
    const asModule = candidate.replace(/\./g, "/");
    return (
      tryWithExtensions(fileIndex, asModule, [".py"]) ??
      tryExactFile(fileIndex, path.posix.join(asModule, "__init__.py"))
    );
  }

  const withoutExt = candidate.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
  return tryWithExtensions(fileIndex, withoutExt, JS_TS_EXTS);
}

export function isExternalImport(source: string): boolean {
  if (!source) return true;
  if (source.startsWith(".") || source.startsWith("/") || source.startsWith("@/")) {
    return false;
  }
  // Scoped npm packages and bare names are external unless path-resolved
  return true;
}

export function languageFromPath(filePath: string): "js" | "ts" | "python" | "unknown" {
  const ext = getExtension(filePath);
  if (ext === ".py") return "python";
  if ([".ts", ".tsx"].includes(ext)) return "ts";
  if (isJsTsExt(ext)) return "js";
  return "unknown";
}
