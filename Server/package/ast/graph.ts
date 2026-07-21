import {
  edgeId,
  externalModuleId,
  fileNodeId,
  normalizeRepoPath,
  vectorIdForSymbol,
} from "./ids.js";
import { analyzeFile } from "./analyze.js";
import {
  isExternalImport,
  loadTsPathAliases,
  resolveImportSource,
  type PathAliasMap,
} from "./resolve.js";
import type {
  ASTCodeChunk,
  CodeGraph,
  FileAnalysis,
  GraphEdge,
  GraphNode,
} from "./types.js";

export type BuildCodeGraphInput = {
  repoKey: string;
  files: Array<{ path: string; content: string }>;
  /** Absolute path to extracted repo root for tsconfig aliases (optional). */
  repoRoot?: string;
};

function buildBindingMap(analysis: FileAnalysis): Map<string, string> {
  // localName -> symbol id or import local marker
  const bindings = new Map<string, string>();
  for (const sym of analysis.symbols) {
    bindings.set(sym.name, sym.id);
    bindings.set(sym.fqn, sym.id);
  }
  return bindings;
}

export function buildCodeGraph(input: BuildCodeGraphInput): CodeGraph {
  const repoKey = input.repoKey;
  const files = input.files.map((f) => ({
    path: normalizeRepoPath(f.path),
    content: f.content,
  }));

  const fileIndex = new Set(files.map((f) => f.path));
  const aliases: PathAliasMap = input.repoRoot
    ? loadTsPathAliases(input.repoRoot)
    : {};

  if (!aliases["@/*"]) {
    aliases["@/*"] = ["src/*"];
  }

  const analyses = files.map((file) =>
    analyzeFile({ filePath: file.path, content: file.content, repoKey }),
  );

  const nodesById = new Map<string, GraphNode>();
  const edgesById = new Map<string, GraphEdge>();
  const chunks: ASTCodeChunk[] = [];
  const symbolsByFileAndName = new Map<string, string>(); // `${file}::${name}` -> symbolId
  const fileExports = new Map<string, Map<string, string>>(); // file -> exportedName -> symbolId

  function addNode(node: GraphNode) {
    if (!nodesById.has(node.id)) nodesById.set(node.id, node);
  }

  function addEdge(edge: GraphEdge) {
    if (!edgesById.has(edge.id)) edgesById.set(edge.id, edge);
  }

  // Pass 1: files + symbols + defines
  for (const analysis of analyses) {
    const fileId = fileNodeId(repoKey, analysis.filePath);
    addNode({
      id: fileId,
      kind: "file",
      repoKey,
      name: analysis.filePath,
      filePath: analysis.filePath,
      nodeType: "file",
    });

    chunks.push(...analysis.chunks);

    const exportMap = new Map<string, string>();
    for (const sym of analysis.symbols) {
      const vectorId = vectorIdForSymbol(
        analysis.filePath,
        sym.nodeType,
        sym.fqn,
        sym.startLine,
        sym.endLine,
      );
      addNode({
        id: sym.id,
        kind: "symbol",
        repoKey,
        name: sym.name,
        filePath: analysis.filePath,
        nodeType: sym.nodeType,
        fqn: sym.fqn,
        startLine: sym.startLine,
        endLine: sym.endLine,
        exported: sym.exported,
        vectorId,
        content: sym.content.slice(0, 2000),
      });

      addEdge({
        id: edgeId("defines", fileId, sym.id),
        type: "defines",
        fromId: fileId,
        toId: sym.id,
        evidence: sym.fqn,
      });

      symbolsByFileAndName.set(`${analysis.filePath}::${sym.name}`, sym.id);
      symbolsByFileAndName.set(`${analysis.filePath}::${sym.fqn}`, sym.id);

      if (sym.exported) {
        exportMap.set(sym.name, sym.id);
        exportMap.set(sym.fqn, sym.id);
        addEdge({
          id: edgeId("exports", fileId, sym.id),
          type: "exports",
          fromId: fileId,
          toId: sym.id,
          evidence: sym.fqn,
        });
      }
    }

    // Structured exports that may not have matched a symbol name yet
    for (const exp of analysis.exports) {
      const target =
        symbolsByFileAndName.get(`${analysis.filePath}::${exp.localName}`) ??
        exportMap.get(exp.localName);
      if (target) {
        exportMap.set(exp.exportedName, target);
        exportMap.set(exp.localName, target);
      }
    }

    fileExports.set(analysis.filePath, exportMap);
  }

  // Pass 2: imports
  const importBindings = new Map<string, Map<string, string>>(); // file -> localName -> targetNodeId

  for (const analysis of analyses) {
    const fromFileId = fileNodeId(repoKey, analysis.filePath);
    const localBindings = new Map<string, string>();

    for (const imp of analysis.imports) {
      const resolved = resolveImportSource({
        fromFile: analysis.filePath,
        source: imp.source,
        fileIndex,
        aliases,
      });

      if (resolved) {
        const toFileId = fileNodeId(repoKey, resolved);
        addEdge({
          id: edgeId("imports", fromFileId, toFileId),
          type: "imports",
          fromId: fromFileId,
          toId: toFileId,
          evidence: imp.raw,
        });

        const exports = fileExports.get(resolved);
        for (let i = 0; i < imp.localNames.length; i++) {
          const local = imp.localNames[i];
          const imported = imp.importedNames[i] ?? local;
          if (imp.isNamespace || imported === "*") {
            localBindings.set(local, toFileId);
            continue;
          }
          const symbolId =
            exports?.get(imported) ??
            exports?.get(local) ??
            symbolsByFileAndName.get(`${resolved}::${imported}`);
          if (symbolId) {
            localBindings.set(local, symbolId);
          } else {
            localBindings.set(local, toFileId);
          }
        }
      } else if (isExternalImport(imp.source) || !imp.source.startsWith(".")) {
        const extId = externalModuleId(repoKey, imp.source);
        addNode({
          id: extId,
          kind: "external_module",
          repoKey,
          name: imp.source,
        });
        addEdge({
          id: edgeId("imports", fromFileId, extId),
          type: "imports",
          fromId: fromFileId,
          toId: extId,
          evidence: imp.raw,
        });
        for (const local of imp.localNames) {
          localBindings.set(local, extId);
        }
      }
    }

    importBindings.set(analysis.filePath, localBindings);
  }

  // Pass 3: calls
  for (const analysis of analyses) {
    const localSymbols = buildBindingMap(analysis);
    const imports = importBindings.get(analysis.filePath) ?? new Map();

    for (const call of analysis.calls) {
      let targetId: string | undefined;

      if (call.property) {
        // obj.method() — try resolve obj binding then method name on that file
        const objTarget = localSymbols.get(call.calleeName) ?? imports.get(call.calleeName);
        if (objTarget?.startsWith("sym:")) {
          // method call on a local class instance — try Class.method via owner
          targetId =
            symbolsByFileAndName.get(
              `${analysis.filePath}::${call.calleeName}.${call.property}`,
            ) ?? undefined;
        } else if (objTarget?.startsWith("file:")) {
          const filePath = objTarget.split(":").slice(2).join(":");
          targetId =
            symbolsByFileAndName.get(`${filePath}::${call.property}`) ??
            fileExports.get(filePath)?.get(call.property);
        } else {
          // same-file method by property name
          targetId =
            symbolsByFileAndName.get(
              `${analysis.filePath}::${call.property}`,
            ) ??
            [...analysis.symbols].find((s) => s.name === call.property)?.id;
        }
      } else {
        targetId =
          localSymbols.get(call.calleeName) ??
          imports.get(call.calleeName) ??
          symbolsByFileAndName.get(`${analysis.filePath}::${call.calleeName}`);
      }

      // Only create CALLS edges to symbols (not files/external) to keep graph useful
      if (targetId?.startsWith("sym:") && targetId !== call.callerId) {
        addEdge({
          id: edgeId("calls", call.callerId, targetId),
          type: "calls",
          fromId: call.callerId,
          toId: targetId,
          evidence: call.property
            ? `${call.calleeName}.${call.property}`
            : call.calleeName,
        });
      }
    }
  }

  return {
    repoKey,
    nodes: [...nodesById.values()],
    edges: [...edgesById.values()],
    chunks,
  };
}
