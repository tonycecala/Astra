import type { ReactNode } from "react";

function inlineMarkdown(text: string) {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    const token = match[0];
    nodes.push(
      token.startsWith("**") ? (
        <strong key={`strong-${index}`}>{token.replace(/^\*\*|\*\*$/g, "")}</strong>
      ) : (
        <em key={`em-${index}`}>{token.replace(/^\*|\*\*?$/g, "").trim()}</em>
      )
    );
    cursor = index + token.length;
  }

  if (!nodes.length) return text;
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <>
      {nodes.map((node, index) => (
        <span key={index}>{node}</span>
      ))}
    </>
  );
}

export function ReportMarkdown({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let skippedMetadataSection = false;
  let replacedFirstSectionTitle = false;

  function flushParagraph() {
    if (!paragraph.length) return;
    nodes.push(<p key={`p-${nodes.length}`}>{inlineMarkdown(paragraph.join(" "))}</p>);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`}>
        {list.map((item, index) => (
          <li key={`${index}-${item.slice(0, 24)}`}>{inlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    list = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (skippedMetadataSection) continue;
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line === "---") {
      flushParagraph();
      flushList();
      nodes.push(<hr key={`hr-${nodes.length}`} />);
      continue;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      nodes.push(<h1 key={`h1-${nodes.length}`}>{line.replace(/^#\s+/, "")}</h1>);
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      const title = line.replace(/^##\s+/, "");
      if (/^Generation Metadata$/i.test(title)) {
        skippedMetadataSection = true;
        continue;
      }
      nodes.push(
        <h2 className={!replacedFirstSectionTitle ? "reportMarkdownPrimaryHeading" : undefined} key={`h2-${nodes.length}`}>
          {title}
        </h2>
      );
      replacedFirstSectionTitle = true;
      continue;
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      flushParagraph();
      flushList();
      nodes.push(<h3 key={`h3-${nodes.length}`}>{line.replace(/^\*\*|\*\*$/g, "")}</h3>);
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.replace(/^-\s+/, ""));
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return <div className="reportMarkdown">{nodes}</div>;
}
