import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const roots = ["apps/astra-web/app", "apps/astra-web/components"];
const attributeNames = new Set(["alt", "aria-description", "aria-label", "placeholder", "title"]);
const files: string[] = [];
const violations: string[] = [];

async function collectTsxFiles(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (file === "apps/astra-web/app/api") continue;
      await collectTsxFiles(file);
    } else if (entry.name.endsWith(".tsx")) {
      files.push(file);
    }
  }
}

function normalizedText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function hasAlphabeticText(value: string) {
  return /[A-Za-z]/.test(value);
}

function isInsideTechnicalCode(node: ts.Node) {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isJsxElement(current) && current.openingElement.tagName.getText() === "code") return true;
    current = current.parent;
  }
  return false;
}

function literalText(node: ts.Expression) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function recordViolation(sourceFile: ts.SourceFile, node: ts.Node, kind: string, value: string) {
  const text = normalizedText(value);
  if (!text || !hasAlphabeticText(text)) return;
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  violations.push(`${sourceFile.fileName}:${line + 1} ${kind}: ${text}`);
}

for (const root of roots) await collectTsxFiles(root);

for (const file of files.sort()) {
  const source = await readFile(file, "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function visit(node: ts.Node) {
    if (ts.isJsxText(node) && !isInsideTechnicalCode(node)) {
      recordViolation(sourceFile, node, "JSX text", node.getText(sourceFile));
    }

    if (ts.isJsxExpression(node) && node.expression && !isInsideTechnicalCode(node)) {
      const text = literalText(node.expression);
      if (text !== null) recordViolation(sourceFile, node, "JSX expression", text);
    }

    if (
      ts.isJsxAttribute(node) &&
      attributeNames.has(node.name.getText(sourceFile)) &&
      node.initializer
    ) {
      if (ts.isStringLiteral(node.initializer)) {
        recordViolation(sourceFile, node, `${node.name.getText(sourceFile)} attribute`, node.initializer.text);
      } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        const text = literalText(node.initializer.expression);
        if (text !== null) {
          recordViolation(sourceFile, node, `${node.name.getText(sourceFile)} attribute`, text);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

if (violations.length) {
  throw new Error(
    `Astra interface chrome must flow through apps/astra-web/lib/i18n.ts.\n${violations.map((violation) => `- ${violation}`).join("\n")}`
  );
}

console.log(`Astra i18n chrome check passed across ${files.length} TSX files.`);
