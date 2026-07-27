export const DEEP_CHAPTER_ORDER = [
  "Identity",
  "Emotions",
  "Relationships",
  "Work",
  "Drive",
  "Gifts",
  "Blind Spots",
  "Growth",
  "Integration"
] as const;

export type DeepChapterTitle = (typeof DEEP_CHAPTER_ORDER)[number];

export const FUNCTIONAL_HEADINGS: Record<DeepChapterTitle, string> = {
  Identity: "Core Orientation",
  Emotions: "Emotional Processing",
  Relationships: "Connection & Reciprocity",
  Work: "Work, Value & Contribution",
  Drive: "Agency & Momentum",
  Gifts: "Capacities & Resources",
  "Blind Spots": "Perception & Distortion",
  Growth: "Developmental Arc",
  Integration: "Operating Principles"
};

const CHAPTER_FOCUS: Record<DeepChapterTitle, string> = {
  Identity: "organizing identity",
  Emotions: "emotional clarity",
  Relationships: "reciprocity and explicit terms",
  Work: "contribution and useful effort",
  Drive: "force, pacing, and proportion",
  Gifts: "resources available to develop",
  "Blind Spots": "interpretations needing verification",
  Growth: "updating self-understanding",
  Integration: "cross-domain decision criteria"
};

const PROHIBITED_SUBTITLE_TERMS =
  /\b(?:dispositor|rulership|network|graph|provenance|meaning[- ]complex|selected complex|chapter job|configuration)\b/i;

export type ReportSection = {
  title: DeepChapterTitle;
  body: string;
};

type EvidenceBullet = {
  label: string;
  meaning: string;
};

export type Phase6Evidence = {
  family: string;
  chapters: Array<{
    title: string;
    primaryComplexId: string;
  }>;
  chapterEvidence: Array<{
    title: string;
    evidenceBullets: EvidenceBullet[];
  }>;
  selectedComplexes: Array<{
    id: string;
    score?: { total?: number };
  }>;
};

export type PresentationVariant = {
  id: "current-fixed" | "functional-fixed" | "current-fixed-subtitles" | "functional-flexible-subtitles";
  label: string;
  sections: Array<ReportSection & {
    displayHeading: string;
    subtitle?: string;
    primaryComplexId: string;
    primaryScore: number;
  }>;
  metrics: {
    identityFirst: boolean;
    integrationLast: boolean;
    movedChapterCount: number;
    totalDisplacement: number;
    subtitleCoverage: number;
    duplicateSubtitleAnchorCount: number;
    prohibitedSubtitleTermCount: number;
  };
};

export function parseDeepMarkdown(markdown: string): {
  documentTitle: string;
  sections: ReportSection[];
} {
  const documentTitle = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Deep report";
  const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  const sections = headings.map((heading, index) => {
    const bodyStart = (heading.index ?? 0) + heading[0].length;
    const bodyEnd = headings[index + 1]?.index ?? markdown.length;
    return {
      title: heading[1]!.trim() as DeepChapterTitle,
      body: markdown.slice(bodyStart, bodyEnd).trim()
    };
  });
  assertCanonicalSections(sections);
  if (sections.some((section) => !section.body)) {
    throw new Error("Every Deep section must retain its original prose.");
  }
  return { documentTitle, sections };
}

export function buildPhase6Variants(
  sections: ReportSection[],
  evidence: Phase6Evidence
): PresentationVariant[] {
  assertCanonicalSections(sections);
  if (evidence.family !== "deep") throw new Error(`Phase 6 requires Deep evidence; received ${evidence.family}.`);

  const chapterByTitle = new Map(evidence.chapters.map((chapter) => [chapter.title, chapter]));
  const complexScore = new Map(evidence.selectedComplexes.map((complex) => [
    complex.id,
    complex.score?.total ?? 0
  ]));
  const subtitleByTitle = new Map(evidence.chapterEvidence.map((chapter) => [
    chapter.title,
    subtitleForChapter(chapter.title as DeepChapterTitle, chapter.evidenceBullets)
  ]));

  const fixed = [...sections];
  const flexible = [...sections].sort((left, right) => {
    if (left.title === "Identity") return -1;
    if (right.title === "Identity") return 1;
    if (left.title === "Integration") return 1;
    if (right.title === "Integration") return -1;
    const leftId = chapterByTitle.get(left.title)?.primaryComplexId ?? "";
    const rightId = chapterByTitle.get(right.title)?.primaryComplexId ?? "";
    const scoreDifference = (complexScore.get(rightId) ?? 0) - (complexScore.get(leftId) ?? 0);
    return scoreDifference || DEEP_CHAPTER_ORDER.indexOf(left.title) - DEEP_CHAPTER_ORDER.indexOf(right.title);
  });

  return [
    makeVariant("current-fixed", "Current headings · fixed order", fixed, false, false),
    makeVariant("functional-fixed", "Functional headings · fixed order", fixed, true, false),
    makeVariant("current-fixed-subtitles", "Current headings · fixed order · evidence subtitles", fixed, false, true),
    makeVariant(
      "functional-flexible-subtitles",
      "Functional headings · flexible order · evidence subtitles",
      flexible,
      true,
      true
    )
  ];

  function makeVariant(
    id: PresentationVariant["id"],
    label: string,
    orderedSections: ReportSection[],
    functional: boolean,
    subtitles: boolean
  ): PresentationVariant {
    const rendered = orderedSections.map((section) => {
      const primaryComplexId = chapterByTitle.get(section.title)?.primaryComplexId;
      if (!primaryComplexId) throw new Error(`Missing evidence chapter for ${section.title}.`);
      return {
        ...section,
        displayHeading: functional ? FUNCTIONAL_HEADINGS[section.title] : section.title,
        subtitle: subtitles ? subtitleByTitle.get(section.title) : undefined,
        primaryComplexId,
        primaryScore: complexScore.get(primaryComplexId) ?? 0
      };
    });
    const subtitleAnchors = rendered
      .map((section) => section.subtitle?.split(" · ")[0]?.toLowerCase())
      .filter((value): value is string => Boolean(value));
    return {
      id,
      label,
      sections: rendered,
      metrics: {
        identityFirst: rendered[0]?.title === "Identity",
        integrationLast: rendered.at(-1)?.title === "Integration",
        movedChapterCount: rendered.filter(
          (section, index) => DEEP_CHAPTER_ORDER[index] !== section.title
        ).length,
        totalDisplacement: rendered.reduce(
          (sum, section, index) => sum + Math.abs(DEEP_CHAPTER_ORDER.indexOf(section.title) - index),
          0
        ),
        subtitleCoverage: rendered.filter((section) => section.subtitle).length,
        duplicateSubtitleAnchorCount: subtitleAnchors.length - new Set(subtitleAnchors).size,
        prohibitedSubtitleTermCount: rendered.filter(
          (section) => section.subtitle && PROHIBITED_SUBTITLE_TERMS.test(section.subtitle)
        ).length
      }
    };
  }
}

export function renderPhase6Preview(
  documentTitle: string,
  variants: PresentationVariant[]
): string {
  const cards = variants.map((variant) => `
    <section class="variant" id="${variant.id}" data-variant="${variant.id}">
      <header>
        <p class="eyebrow">Phase 6 private comparison</p>
        <h1>${escapeHtml(variant.label)}</h1>
        <p class="metrics">${variant.metrics.movedChapterCount} moved chapters · ${variant.metrics.subtitleCoverage}/9 subtitles · ${variant.metrics.duplicateSubtitleAnchorCount} repeated anchors</p>
      </header>
      <nav aria-label="${escapeHtml(variant.label)} chapter index">
        ${variant.sections.map((section) => `<a href="#${variant.id}-${slug(section.title)}">${escapeHtml(section.displayHeading)}</a>`).join("")}
      </nav>
      <main>
        ${variant.sections.map((section) => `
          <article id="${variant.id}-${slug(section.title)}" data-canonical-title="${escapeHtml(section.title)}">
            <h2>${escapeHtml(section.displayHeading)}</h2>
            ${section.subtitle ? `<p class="subtitle">${escapeHtml(section.subtitle)}</p>` : ""}
            <div class="prose">${markdownParagraphs(section.body)}</div>
          </article>
        `).join("")}
      </main>
    </section>
  `).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(documentTitle)} · Phase 6 comparison</title>
  <style>
    :root { color-scheme: dark; --gold: #d8ae66; --ink: #f5efe5; --muted: #b9b0a2; --panel: #181713; --line: #3b352b; }
    * { box-sizing: border-box; }
    html { background: #0d0c0a; color: var(--ink); font: 16px/1.65 ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; }
    .variant { display: none; max-width: 880px; margin: 0 auto; padding: 42px 24px 80px; }
    .variant:target, .variant:first-of-type { display: block; }
    body:has(.variant:target) .variant:first-of-type:not(:target) { display: none; }
    header { border-bottom: 1px solid var(--line); padding-bottom: 22px; }
    h1, h2 { color: var(--gold); font-family: Georgia, serif; line-height: 1.15; }
    h1 { font-size: clamp(2rem, 7vw, 3.5rem); margin: 6px 0 10px; }
    h2 { font-size: clamp(1.55rem, 5vw, 2.3rem); margin: 0; }
    .eyebrow { color: var(--gold); font-size: .75rem; letter-spacing: .13em; text-transform: uppercase; }
    .metrics, .subtitle { color: var(--muted); }
    .subtitle { margin: 7px 0 0; font-size: .95rem; }
    nav { display: flex; gap: 8px; overflow-x: auto; padding: 18px 0; position: sticky; top: 0; background: rgba(13,12,10,.96); z-index: 2; }
    nav a, .switcher a { color: var(--ink); text-decoration: none; white-space: nowrap; border: 1px solid var(--line); border-radius: 999px; padding: 6px 11px; font-size: .78rem; }
    article { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: clamp(20px, 5vw, 36px); margin: 18px 0; scroll-margin-top: 78px; }
    .prose p { margin: 18px 0 0; }
    .switcher { position: fixed; right: 14px; bottom: 14px; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; max-width: min(660px, calc(100vw - 28px)); z-index: 3; }
    .switcher a { background: #272218; border-color: #6c5733; }
    @media (max-width: 640px) {
      .variant { padding: 24px 14px 94px; }
      .switcher {
        left: 0;
        right: 0;
        bottom: 0;
        max-width: none;
        flex-wrap: nowrap;
        justify-content: flex-start;
        overflow-x: auto;
        padding: 8px;
        background: rgba(13,12,10,.98);
      }
      .switcher a { font-size: .7rem; padding: 5px 8px; }
    }
  </style>
</head>
<body>
  ${cards}
  <aside class="switcher" aria-label="Presentation variants">
    ${variants.map((variant, index) => `<a href="#${variant.id}">${index + 1}. ${escapeHtml(variant.label)}</a>`).join("")}
  </aside>
</body>
</html>`;
}

export function renderPhase6Comparison(variants: PresentationVariant[]): string {
  const lines = [
    "# Semantic Synthesis V2 Phase 6 presentation comparison",
    "",
    "| Variant | Order | Subtitles | Repeated anchors | Graph/provenance leakage |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...variants.map((variant) =>
      `| ${variant.label} | ${variant.metrics.movedChapterCount} chapters moved (${variant.metrics.totalDisplacement} total positions) | ${variant.metrics.subtitleCoverage}/9 | ${variant.metrics.duplicateSubtitleAnchorCount} | ${variant.metrics.prohibitedSubtitleTermCount} |`
    ),
    "",
    "## Deterministic finding",
    "",
    "Flexible score ordering preserves Identity first and Integration last, but moves chapters away from the familiar domain sequence and can place repeated primary roots near one another. Atomic evidence subtitles improve chart orientation without changing prose, evidence, chapter ownership, or contracts; repeated anchors remain visible where the planner intentionally assigns one root to distinct chapter jobs.",
    "",
    "## Product recommendation",
    "",
    "Keep the current stable chapter headings and fixed Deep order. If Astra adopts a presentation change in a separately approved customer-facing implementation, add one short factual subtitle to Deep chapters using only direct selected evidence plus the bounded chapter focus. Do not adopt the wholesale functional-heading set: several labels are more abstract, `Core Orientation` conflicts with the Core tier name, and `Perception & Distortion` adds avoidable pathologizing tone.",
    ""
  ];
  return lines.join("\n");
}

function subtitleForChapter(title: DeepChapterTitle, bullets: EvidenceBullet[]): string | undefined {
  const direct = bullets.find((bullet) => {
    const combined = `${bullet.label}; ${bullet.meaning}`;
    return !PROHIBITED_SUBTITLE_TERMS.test(combined) && atomicFact(combined);
  });
  const fact = direct ? atomicFact(`${direct.label}; ${direct.meaning}`) : undefined;
  if (!fact) return undefined;
  return `${fact} · ${CHAPTER_FOCUS[title]}`;
}

function atomicFact(value: string): string | undefined {
  const facts = value.split(";").map((part) => part.trim()).filter(Boolean);
  return facts.find((fact) =>
    /\b(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant|node)\s+(?:in|conjunct|conjunction|sextile|square|trine|opposition|quincunx)\s+/i.test(fact)
  ) ?? facts.find((fact) => /^(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|ascendant)$/i.test(fact));
}

function assertCanonicalSections(sections: Array<{ title: string }>) {
  const actual = sections.map((section) => section.title);
  if (actual.length !== DEEP_CHAPTER_ORDER.length ||
    actual.some((title, index) => title !== DEEP_CHAPTER_ORDER[index])) {
    throw new Error(`Expected canonical Deep sections; received ${actual.join(", ")}.`);
  }
}

function markdownParagraphs(body: string) {
  return body.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
