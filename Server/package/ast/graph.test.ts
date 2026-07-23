import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeFile, parseFileToASTChunks } from "./analyze.js";
import { buildCodeGraph } from "./graph.js";
import { vectorIdForSymbol } from "./ids.js";

describe("stable AST ids", () => {
  it("uses span-based vector ids instead of chunk index", () => {
    const source = `
export function alpha() { return 1; }
export function beta() { return 2; }
`;
    const chunks = parseFileToASTChunks("src/math.ts", source);
    assert.ok(chunks.length >= 2);
    for (const chunk of chunks) {
      assert.equal(
        chunk.id,
        vectorIdForSymbol(
          chunk.filePath,
          chunk.nodeType,
          chunk.symbolName,
          chunk.startLine,
          chunk.endLine,
        ),
      );
      assert.match(chunk.id, /@\d+:\d+$/);
      assert.equal(chunk.id.split("::").length >= 3, true);
    }
  });

  it("keeps distinct symbols with the same short name in different files", () => {
    const graph = buildCodeGraph({
      repoKey: "acme/demo",
      files: [
        {
          path: "a.ts",
          content: `export function render() { return "a"; }`,
        },
        {
          path: "b.ts",
          content: `export function render() { return "b"; }`,
        },
      ],
    });

    const renders = graph.nodes.filter(
      (n) => n.kind === "symbol" && n.name === "render",
    );
    assert.equal(renders.length, 2);
    assert.notEqual(renders[0].id, renders[1].id);
  });
});

describe("JS/TS imports exports and calls", () => {
  it("links imports, exports, and resolvable calls", () => {
    const graph = buildCodeGraph({
      repoKey: "acme/demo",
      files: [
        {
          path: "utils.ts",
          content: `
export function helper(x: number) {
  return x + 1;
}
`,
        },
        {
          path: "app.ts",
          content: `
import { helper } from "./utils";
import axios from "axios";

export function run() {
  return helper(1);
}
`,
        },
      ],
    });

    const edgeTypes = graph.edges.map((e) => e.type);
    assert.ok(edgeTypes.includes("imports"));
    assert.ok(edgeTypes.includes("exports"));
    assert.ok(edgeTypes.includes("defines"));
    assert.ok(edgeTypes.includes("calls"));

    const importEdge = graph.edges.find(
      (e) =>
        e.type === "imports" &&
        e.fromId.includes("app.ts") &&
        e.toId.includes("utils.ts"),
    );
    assert.ok(importEdge);

    const external = graph.nodes.find(
      (n) => n.kind === "external_module" && n.name === "axios",
    );
    assert.ok(external);

    const callEdge = graph.edges.find((e) => e.type === "calls");
    assert.ok(callEdge);
    assert.match(callEdge!.fromId, /run@/);
    assert.match(callEdge!.toId, /helper@/);
  });

  it("does not invent call edges for dynamic callees", () => {
    const analysis = analyzeFile({
      repoKey: "acme/demo",
      filePath: "dyn.ts",
      content: `
export function run(fn: Function) {
  return fn();
}
`,
    });
    // call exists in AST but unresolved callee "fn" should not become a symbol CALL in graph
    const graph = buildCodeGraph({
      repoKey: "acme/demo",
      files: [
        {
          path: "dyn.ts",
          content: `
export function run(fn: Function) {
  return fn();
}
`,
        },
      ],
    });
    assert.equal(graph.edges.filter((e) => e.type === "calls").length, 0);
    assert.ok(analysis.calls.some((c) => c.calleeName === "fn"));
  });

  it("captures class methods with owner FQN", () => {
    const analysis = analyzeFile({
      repoKey: "acme/demo",
      filePath: "svc.ts",
      content: `
export class Service {
  start() { return 1; }
}
`,
    });
    const method = analysis.symbols.find((s) => s.fqn === "Service.start");
    assert.ok(method);
    assert.equal(method!.nodeType, "method");
  });
});

describe("Python imports and calls", () => {
  it("builds defines/imports/calls for python modules", () => {
    const graph = buildCodeGraph({
      repoKey: "acme/demo",
      files: [
        {
          path: "helpers.py",
          content: `
def add(a, b):
    return a + b
`,
        },
        {
          path: "main.py",
          content: `
from helpers import add
import os

def run():
    return add(1, 2)
`,
        },
      ],
    });

    assert.ok(graph.nodes.some((n) => n.kind === "file" && n.filePath === "main.py"));
    assert.ok(graph.edges.some((e) => e.type === "imports"));
    assert.ok(
      graph.nodes.some((n) => n.kind === "external_module" && n.name === "os"),
    );

    const call = graph.edges.find((e) => e.type === "calls");
    assert.ok(call);
    assert.match(call!.evidence ?? "", /add/);
  });
});
