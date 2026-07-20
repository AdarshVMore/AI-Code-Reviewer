import type Parser from "tree-sitter";
import type { StructuredExport, StructuredImport } from "./types.js";

function stripQuotes(text: string): string {
  return text.replace(/^['"]|['"]$/g, "");
}

function collectJsImport(node: Parser.SyntaxNode): StructuredImport | null {
  const sourceNode = node.childForFieldName("source");
  if (!sourceNode) return null;
  const source = stripQuotes(sourceNode.text);
  const localNames: string[] = [];
  const importedNames: string[] = [];
  let isDefault = false;
  let isNamespace = false;
  let isTypeOnly = node.text.trimStart().startsWith("import type");

  for (const child of node.namedChildren) {
    if (child.type === "import_clause") {
      for (const part of child.namedChildren) {
        if (part.type === "identifier") {
          isDefault = true;
          localNames.push(part.text);
          importedNames.push("default");
        } else if (part.type === "namespace_import") {
          isNamespace = true;
          const id = part.namedChildren.find((c) => c.type === "identifier");
          if (id) {
            localNames.push(id.text);
            importedNames.push("*");
          }
        } else if (part.type === "named_imports") {
          for (const spec of part.namedChildren) {
            if (spec.type !== "import_specifier") continue;
            const name = spec.childForFieldName("name");
            const alias = spec.childForFieldName("alias");
            if (name) {
              importedNames.push(name.text);
              localNames.push(alias?.text ?? name.text);
            }
          }
        }
      }
    }
  }

  return {
    source,
    localNames,
    importedNames,
    isDefault,
    isNamespace,
    isTypeOnly,
    raw: node.text.trim(),
  };
}

function collectPythonImport(node: Parser.SyntaxNode): StructuredImport | null {
  if (node.type === "import_statement") {
    const localNames: string[] = [];
    const importedNames: string[] = [];
    let source = "";
    for (const child of node.namedChildren) {
      if (child.type === "dotted_name" || child.type === "aliased_import") {
        const nameNode =
          child.type === "aliased_import"
            ? child.childForFieldName("name") ?? child.namedChildren[0]
            : child;
        const alias =
          child.type === "aliased_import"
            ? child.childForFieldName("alias")
            : null;
        source = nameNode?.text ?? "";
        importedNames.push(source);
        localNames.push(alias?.text ?? source.split(".").pop() ?? source);
      }
    }
    if (!source) return null;
    return {
      source,
      localNames,
      importedNames,
      isDefault: false,
      isNamespace: true,
      isTypeOnly: false,
      raw: node.text.trim(),
    };
  }

  if (node.type === "import_from_statement") {
    const moduleNode =
      node.childForFieldName("module_name") ??
      node.namedChildren.find(
        (c) => c.type === "dotted_name" || c.type === "relative_import",
      );
    const source = moduleNode?.text ?? "";
    const localNames: string[] = [];
    const importedNames: string[] = [];
    let isNamespace = false;

    for (const child of node.namedChildren) {
      if (child.type === "dotted_name" && child !== moduleNode) {
        importedNames.push(child.text);
        localNames.push(child.text);
      } else if (child.type === "aliased_import") {
        const name = child.childForFieldName("name");
        const alias = child.childForFieldName("alias");
        if (name) {
          importedNames.push(name.text);
          localNames.push(alias?.text ?? name.text);
        }
      } else if (child.type === "wildcard_import") {
        isNamespace = true;
        importedNames.push("*");
        localNames.push("*");
      }
    }

    return {
      source,
      localNames,
      importedNames,
      isDefault: false,
      isNamespace,
      isTypeOnly: false,
      raw: node.text.trim(),
    };
  }

  return null;
}

export function extractStructuredImports(
  root: Parser.SyntaxNode,
  language: "js" | "ts" | "python" | "unknown",
): StructuredImport[] {
  const imports: StructuredImport[] = [];

  function walk(node: Parser.SyntaxNode) {
    if (language === "python") {
      if (node.type === "import_statement" || node.type === "import_from_statement") {
        const parsed = collectPythonImport(node);
        if (parsed) imports.push(parsed);
      }
    } else if (
      node.type === "import_statement" ||
      node.type === "import_declaration"
    ) {
      const parsed = collectJsImport(node);
      if (parsed) imports.push(parsed);
    }

    for (const child of node.namedChildren) walk(child);
  }

  walk(root);
  return imports;
}

export function extractStructuredExports(
  root: Parser.SyntaxNode,
  language: "js" | "ts" | "python" | "unknown",
): StructuredExport[] {
  const exports: StructuredExport[] = [];

  if (language === "python") {
    // Module-level defs are treated as exports by the analyzer.
    return exports;
  }

  function walk(node: Parser.SyntaxNode) {
    if (node.type === "export_statement") {
      const sourceNode = node.childForFieldName("source");
      const source = sourceNode ? stripQuotes(sourceNode.text) : undefined;
      const declaration = node.childForFieldName("declaration");
      const isDefault = node.children.some((c) => c.type === "default");

      if (declaration) {
        const name = extractDeclarationName(declaration);
        if (name) {
          exports.push({
            localName: name,
            exportedName: isDefault ? "default" : name,
            isDefault,
            isReExport: false,
          });
        }
      }

      for (const child of node.namedChildren) {
        if (child.type === "export_clause") {
          for (const spec of child.namedChildren) {
            if (spec.type !== "export_specifier") continue;
            const name = spec.childForFieldName("name");
            const alias = spec.childForFieldName("alias");
            if (!name) continue;
            exports.push({
              localName: name.text,
              exportedName: alias?.text ?? name.text,
              isDefault: false,
              isReExport: Boolean(source),
              source,
            });
          }
        }
      }

      if (source && !declaration) {
        // export * from '...'
        if (node.text.includes("*")) {
          exports.push({
            localName: "*",
            exportedName: "*",
            isDefault: false,
            isReExport: true,
            source,
          });
        }
      }
    }

    for (const child of node.namedChildren) walk(child);
  }

  walk(root);
  return exports;
}

function extractDeclarationName(node: Parser.SyntaxNode): string | null {
  const nameNode = node.childForFieldName("name");
  if (nameNode) {
    if (nameNode.type === "variable_declarator") {
      return nameNode.childForFieldName("name")?.text ?? null;
    }
    return nameNode.text;
  }

  if (
    node.type === "lexical_declaration" ||
    node.type === "variable_declaration"
  ) {
    for (const child of node.namedChildren) {
      if (child.type === "variable_declarator") {
        return child.childForFieldName("name")?.text ?? null;
      }
    }
  }

  for (const child of node.namedChildren) {
    if (
      child.type === "identifier" ||
      child.type === "type_identifier" ||
      child.type === "property_identifier"
    ) {
      return child.text;
    }
  }
  return null;
}
