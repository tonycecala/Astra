export function formatReportParagraphs(value: string) {
  const sourceParagraphs = value
    .split(/\r?\n\s*\r?\n/)
    .map(compactWhitespace)
    .filter(Boolean);

  if (!sourceParagraphs.length) return "";
  const paragraphs = sourceParagraphs.length === 1
    ? splitSingleParagraph(sourceParagraphs[0]!)
    : sourceParagraphs;
  if (paragraphs.length <= 3) return paragraphs.join("\n\n");

  return balancedGroups(paragraphs, 3).map((group) => group.join(" ")).join("\n\n");
}

/** Report sections own their headings and evidence boundary, so a writer's terminal rule is redundant. */
export function stripTrailingMarkdownRule(value: string) {
  return value.replace(/(?:\s|^)---\s*$/, "").trimEnd();
}

function splitSingleParagraph(paragraph: string) {
  const sentences = paragraph
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'*])/)
    .map(compactWhitespace)
    .filter(Boolean);
  if (sentences.length <= 1) return [paragraph];
  return balancedGroups(sentences, Math.min(3, sentences.length)).map((group) => group.join(" "));
}

function balancedGroups<T>(items: T[], groupCount: number) {
  return Array.from({ length: groupCount }, (_, index) => {
    const start = Math.round((index * items.length) / groupCount);
    const end = Math.round(((index + 1) * items.length) / groupCount);
    return items.slice(start, end);
  }).filter((group) => group.length);
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
