import type Parser from "tree-sitter";
import type { ASTNodeType, FileSymbol } from "./types.js";
import { symbolNodeId, vectorIdForSymbol } from "./ids.js";

const NODE_TYPE_MAP: Record<string, ASTNodeType> = {
  function_declaration: "function",
  generator_function_declaration: "function",
  function_definition: "function",
  class_declaration: "class",
  class_definition: "class",
  method_definition: "method",
  interface_declaration: "interface",
  type_alias_declaration: "type",
  lexical_declaration: "variable",
  variable_declaration: "variable",
  decorated_definition: "function",
};

export function mapNodeType(tsType: string): ASTNodeType {
  return NODE_TYPE_MAP[tsType] ?? "file";
}

export function lineAt(content: string, byteIndex: number): number {
  return content.slice(0, byteIndex).split("\n").length;
}

function unwrapDecorated(node: Parser.SyntaxNode): Parser.SyntaxNode {
  if (node.type !== "decorated_definition") return node;
  return node.childForFieldName("definition") ?? node;
}

function ancestryTypes(node: Parser.SyntaxNode): string[] {
  const types: string[] = [];
  let parent = node.parent;
  while (parent) {
    types.push(parent.type);
    parent = parent.parent;
  }
  return types;
}

function isInsideFunctionBody(node: Parser.SyntaxNode): boolean {
  const ancestors = ancestryTypes(node);
  return ancestors.some((t) =>
    [
      "function_declaration",
      "generator_function_declaration",
      "function_definition",
      "method_definition",
      "arrow_function",
      "function_expression",
      "generator_function",
    ].includes(t),
  );
}

function findOwnerClass(node: Parser.SyntaxNode): string | undefined {
  let parent = node.parent;
  while (parent) {
    if (
      parent.type === "class_declaration" ||
      parent.type === "class_definition"
    ) {
      return parent.childForFieldName("name")?.text;
    }
    parent = parent.parent;
  }
  return undefined;
}

function extractName(
  node: Parser.SyntaxNode,
  language: "js" | "ts" | "python" | "unknown",
): string | null {
  const unwrapped = unwrapDecorated(node);

  if (
    unwrapped.type === "lexical_declaration" ||
    unwrapped.type === "variable_declaration"
  ) {
    for (const child of unwrapped.namedChildren) {
      if (child.type === "variable_declarator") {
        const name = child.childForFieldName("name");
        if (name && name.type === "identifier") return name.text;
        // Skip array/object destructuring noise
        return null;
      }
    }
    return null;
  }

  const nameNode = unwrapped.childForFieldName("name");
  if (nameNode) return nameNode.text;

  for (const child of unwrapped.namedChildren) {
    if (
      child.type === "identifier" ||
      child.type === "type_identifier" ||
      child.type === "property_identifier"
    ) {
      return child.text;
    }
  }

  if (language === "python" && node.type === "decorated_definition") {
    return extractName(unwrapped, language);
  }

  return null;
}

function resolveJsVariableNodeType(node: Parser.SyntaxNode): ASTNodeType {
  for (const child of node.namedChildren) {
    if (child.type !== "variable_declarator") continue;
    const value = child.childForFieldName("value");
    if (!value) return "variable";
    if (
      value.type === "arrow_function" ||
      value.type === "function_expression" ||
      value.type === "generator_function"
    ) {
      return "function";
    }
    if (value.type === "call_expression") {
      for (const argParent of value.namedChildren) {
        if (argParent.type !== "arguments") continue;
        for (const arg of argParent.namedChildren) {
          if (
            arg.type === "arrow_function" ||
            arg.type === "function_expression"
          ) {
            return "function";
          }
        }
      }
    }
  }
  return "variable";
}

const SYMBOL_NODE_TYPES = new Set([
  "function_declaration",
  "generator_function_declaration",
  "class_declaration",
  "method_definition",
  "interface_declaration",
  "type_alias_declaration",
  "lexical_declaration",
  "variable_declaration",
  "function_definition",
  "class_definition",
  "decorated_definition",
]);

export function extractSymbols(options: {
  root: Parser.SyntaxNode;
  content: string;
  filePath: string;
  repoKey: string;
  language: "js" | "ts" | "python" | "unknown";
  exportedNames: Set<string>;
}): FileSymbol[] {
  const { root, content, filePath, repoKey, language, exportedNames } = options;
  const symbols: FileSymbol[] = [];
  const seen = new Set<string>();

  function maybeAdd(target: Parser.SyntaxNode) {
    const ownerName = findOwnerClass(target);
    const name = extractName(target, language);
    if (!name) return;

    // Skip nested vars/functions inside other functions (methods under class OK)
    const insideFn = isInsideFunctionBody(target);
    if (
      insideFn &&
      target.type !== "method_definition" &&
      !(language === "python" && ownerName && target.type === "function_definition")
    ) {
      // Allow nested class/function definitions in python? Skip for MVP clarity.
      if (
        target.type === "lexical_declaration" ||
        target.type === "variable_declaration" ||
        target.type === "function_declaration" ||
        target.type === "generator_function_declaration" ||
        target.type === "function_definition" ||
        target.type === "decorated_definition"
      ) {
        return;
      }
    }

    let nodeType = mapNodeType(unwrapDecorated(target).type);
    if (
      target.type === "lexical_declaration" ||
      target.type === "variable_declaration"
    ) {
      if (insideFn) return;
      nodeType = resolveJsVariableNodeType(target);
    }

    if (
      ownerName &&
      (target.type === "method_definition" ||
        (language === "python" &&
          unwrapDecorated(target).type === "function_definition"))
    ) {
      nodeType = "method";
    }

    const actual = unwrapDecorated(target);
    const startLine = lineAt(content, actual.startIndex);
    const endLine = lineAt(content, actual.endIndex);
    const fqn = ownerName ? `${ownerName}.${name}` : name;
    const id = symbolNodeId(repoKey, filePath, fqn, startLine, endLine);
    const dedupeKey = `${startLine}:${endLine}:${fqn}`;
    if (seen.has(dedupeKey) || !actual.text.trim()) return;
    seen.add(dedupeKey);

    symbols.push({
      id,
      name,
      fqn,
      nodeType,
      startLine,
      endLine,
      content: actual.text,
      exported:
        exportedNames.has(name) ||
        exportedNames.has(fqn) ||
        (language === "python" && !insideFn && !ownerName),
      ownerName,
    });
  }

  function walk(node: Parser.SyntaxNode) {
    if (SYMBOL_NODE_TYPES.has(node.type)) {
      maybeAdd(node);
    }
    for (const child of node.namedChildren) walk(child);
  }

  walk(root);
  return symbols;
}

export function extractCalls(options: {
  root: Parser.SyntaxNode;
  symbols: FileSymbol[];
  language: "js" | "ts" | "python" | "unknown";
  content: string;
}): Array<{ callerId: string; calleeName: string; property?: string }> {
  const { root, symbols, language, content } = options;
  const calls: Array<{
    callerId: string;
    calleeName: string;
    property?: string;
  }> = [];

  function findEnclosingSymbol(node: Parser.SyntaxNode): FileSymbol | null {
    const start = lineAt(content, node.startIndex);
    const end = lineAt(content, node.endIndex);
    let best: FileSymbol | null = null;
    for (const sym of symbols) {
      if (sym.startLine <= start && sym.endLine >= end) {
        if (
          !best ||
          sym.endLine - sym.startLine < best.endLine - best.startLine
        ) {
          best = sym;
        }
      }
    }
    return best;
  }

  function walk(node: Parser.SyntaxNode) {
    if (language === "python" && node.type === "call") {
      const func = node.childForFieldName("function");
      const caller = findEnclosingSymbol(node);
      if (caller && func) {
        if (func.type === "identifier") {
          calls.push({ callerId: caller.id, calleeName: func.text });
        } else if (func.type === "attribute") {
          const obj = func.childForFieldName("object");
          const attr = func.childForFieldName("attribute");
          if (attr) {
            calls.push({
              callerId: caller.id,
              calleeName: obj?.text ?? attr.text,
              property: attr.text,
            });
          }
        }
      }
    }

    if (
      (language === "js" || language === "ts") &&
      node.type === "call_expression"
    ) {
      const fn = node.childForFieldName("function");
      const caller = findEnclosingSymbol(node);
      if (caller && fn) {
        if (fn.type === "identifier") {
          calls.push({ callerId: caller.id, calleeName: fn.text });
        } else if (fn.type === "member_expression") {
          const obj = fn.childForFieldName("object");
          const prop = fn.childForFieldName("property");
          if (prop) {
            calls.push({
              callerId: caller.id,
              calleeName: obj?.text ?? prop.text,
              property: prop.text,
            });
          }
        }
      }
    }

    for (const child of node.namedChildren) walk(child);
  }

  walk(root);
  return calls;
}

export function toChunkId(
  filePath: string,
  nodeType: string,
  fqn: string,
  startLine: number,
  endLine: number,
): string {
  return vectorIdForSymbol(filePath, nodeType, fqn, startLine, endLine);
}
