import type { ReactNode } from "react";
import { ui } from "../lib/i18n";

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
        <em key={`em-${index}`}>{token.replace(/^\*|\*$/g, "").trim()}</em>
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

type ReportEvidenceByTitle = Record<string, Array<{ label: string; meaning: string }>>;

export function ReportMarkdown({
  markdown,
  evidenceByTitle = {},
  sectionSubtitles = {}
}: {
  markdown: string;
  evidenceByTitle?: ReportEvidenceByTitle;
  sectionSubtitles?: Record<string, string>;
}) {
  const lines = markdown.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let skippedMetadataSection = false;
  let replacedFirstSectionTitle = false;
  let evidenceListOpen = false;
  let currentSectionTitle: string | null = null;
  let currentSectionHadEvidence = false;

  function flushParagraph() {
    if (!paragraph.length) return;
    nodes.push(<p key={`p-${nodes.length}`}>{inlineMarkdown(paragraph.join(" "))}</p>);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    const listNode = (
      <ul>
        {list.map((item, index) => (
          <li key={`${index}-${item.slice(0, 24)}`}>{inlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    nodes.push(
      evidenceListOpen ? (
        <details className="reportMarkdownEvidence" key={`evidence-${nodes.length}`}>
          <summary>{ui.library.reportChartEvidence}</summary>
          {listNode}
        </details>
      ) : (
        <div key={`ul-${nodes.length}`}>{listNode}</div>
      )
    );
    list = [];
    evidenceListOpen = false;
  }

  function flushDeterministicEvidence() {
    if (!currentSectionTitle || currentSectionHadEvidence) return;
    const evidence = evidenceByTitle[currentSectionTitle] ?? [];
    if (!evidence.length) return;
    nodes.push(
      <details className="reportMarkdownEvidence" key={`evidence-${nodes.length}`}>
        <summary>{ui.library.reportChartEvidence}</summary>
        <ul>
          {evidence.map((item, index) => (
            <li key={`${index}-${item.label}`}>
              <strong>{item.label}</strong>: {item.meaning}
            </li>
          ))}
        </ul>
      </details>
    );
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
      flushDeterministicEvidence();
      currentSectionTitle = null;
      currentSectionHadEvidence = false;
      nodes.push(<h1 key={`h1-${nodes.length}`}>{line.replace(/^#\s+/, "")}</h1>);
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushDeterministicEvidence();
      const title = line.replace(/^##\s+/, "");
      if (/^Generation Metadata$/i.test(title)) {
        skippedMetadataSection = true;
        continue;
      }
      currentSectionTitle = title;
      currentSectionHadEvidence = false;
      nodes.push(
        <h2 className={!replacedFirstSectionTitle ? "reportMarkdownPrimaryHeading" : undefined} key={`h2-${nodes.length}`}>
          {title}
        </h2>
      );
      const subtitle = sectionSubtitles[title];
      if (subtitle) nodes.push(<p className="reportMarkdownSubtitle" key={`subtitle-${nodes.length}`}>{subtitle}</p>);
      replacedFirstSectionTitle = true;
      continue;
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      flushParagraph();
      flushList();
      const title = line.replace(/^\*\*|\*\*$/g, "");
      if (/^Chart Evidence$/i.test(title)) {
        evidenceListOpen = true;
        currentSectionHadEvidence = true;
        continue;
      }
      nodes.push(<h3 key={`h3-${nodes.length}`}>{title}</h3>);
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
  flushDeterministicEvidence();
  return <div className="reportMarkdown">{nodes}</div>;
}
