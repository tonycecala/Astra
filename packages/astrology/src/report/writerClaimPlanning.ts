export type WriterClaimSignal = {
  id: string;
  label: string;
  facts: string[];
  allowedContribution?: string;
  prohibitedInference?: string;
};

export type WriterClaimCard = {
  title: string;
  hypothesis?: string;
  chartSignals: WriterClaimSignal[];
  writerSignals?: WriterClaimSignal[];
  counterweight?: string;
  claimBoundary?: string;
  chapterQuestion?: string;
  intendedConclusion?: string;
};

export type WriterFactAtom = {
  id: string;
  factualText: string;
  boundedMeaning: string;
  prohibitedInference: string;
};

export type WriterSentenceClaim = {
  paragraph: number;
  atomIds: string[];
  relation: "direct" | "compression" | "inference";
  instruction: string;
  marker: string;
};

export type WriterChapterClaimPlan = {
  atoms: WriterFactAtom[];
  claims: WriterSentenceClaim[];
};

export type WriterClaimAudit = {
  prose: string;
  claims: Array<{
    paragraph: number;
    text: string;
    atomIds: string[];
    relation: WriterSentenceClaim["relation"];
    boundaryCheck: "pass";
  }>;
  errors: string[];
};

const bodyPattern = /\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|North Node|South Node|Ascendant|Descendant|Midheaven)\b/i;
const aspectPattern = /\b(?:conjunct(?:ion)?|oppos(?:e|es|ition)|square|trine|sextile|quincunx)\b/i;
const housePattern = /\b(?:\d+(?:st|nd|rd|th)?|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+house\b/i;
const signPattern = /\b(?:Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/i;
const supportMarkerPattern = /\s*\[\[([^\]]+)\]\]\s*$/;

function readableSignalLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function atomicWriterFact(signal: WriterClaimSignal) {
  if (
    /\b(?:chart ruler|lunar phase|disposed by|rules)\b/i.test(signal.label) ||
    aspectPattern.test(signal.label)
  ) {
    return readableSignalLabel(signal.label);
  }
  const signFact = signal.facts.find((fact) =>
    bodyPattern.test(fact) && signPattern.test(fact) && /\bin\b/i.test(fact)
  );
  const houseFact = signal.facts.find((fact) =>
    bodyPattern.test(fact) && housePattern.test(fact) && /\bin\b/i.test(fact)
  );
  if (signFact && houseFact) {
    const house = houseFact.match(housePattern)?.[0];
    if (house) return `${signFact} in the ${house}`;
  }
  const directFact = signal.facts.find((fact) =>
    /\b(?:chart ruler|lunar phase|rules|disposed by|natal relevance)\b/i.test(fact) ||
    aspectPattern.test(fact) ||
    (bodyPattern.test(fact) && (signPattern.test(fact) || housePattern.test(fact)))
  );
  return directFact ?? readableSignalLabel(signal.label);
}

function boundedWriterContribution(signal: WriterClaimSignal) {
  return signal.allowedContribution ??
    "This selected fact may contribute only to the bounded chapter conclusion; it does not establish a human fact.";
}

export function selectedWriterSignals(card: WriterClaimCard) {
  const candidates = (card.writerSignals ?? card.chartSignals).filter((signal) =>
    !/\b(?:dispositor[- ]chain|final[- ]dispositor)\b/i.test(
      `${signal.id} ${signal.label} ${signal.facts.join(" ")}`
    )
  );
  if (card.writerSignals) return candidates.slice(0, 3);
  const selected = candidates.slice(0, 2);
  const counterweightLabel = card.counterweight
    ?.replace(/^Counterevidence retained:\s*/i, "")
    .replace(/[.;].*$/, "")
    .trim()
    .toLowerCase();
  const counterweightSignal = counterweightLabel
    ? candidates.find((signal) =>
        signal.label.toLowerCase() === counterweightLabel ||
        counterweightLabel.includes(signal.label.toLowerCase())
      )
    : undefined;
  if (counterweightSignal && !selected.includes(counterweightSignal)) selected.push(counterweightSignal);
  if (selected.length < 3) {
    const next = candidates.find((signal) => !selected.includes(signal));
    if (next) selected.push(next);
  }
  return selected.slice(0, 3);
}

function marker(atomIds: readonly string[], relation: WriterSentenceClaim["relation"]) {
  return `[[${atomIds.map((id) => `${id}:${relation}`).join(",")}]]`;
}

export function buildWriterChapterClaimPlan(card: WriterClaimCard): WriterChapterClaimPlan {
  const signals = selectedWriterSignals(card);
  if (signals.length < 2 || signals.length > 3) {
    throw new Error(`${card.title} writer claim plan requires two or three selected facts; found ${signals.length}.`);
  }
  const claimBoundary = card.claimBoundary ??
    "Do not infer biography, behavior, events, current timing, skill, or another person's inner state.";
  const atoms = signals.map((signal, index) => ({
    id: `F${index + 1}`,
    factualText: atomicWriterFact(signal),
    boundedMeaning: boundedWriterContribution(signal),
    prohibitedInference: signal.prohibitedInference ?? claimBoundary
  }));
  const first = atoms[0]!;
  const remaining = atoms.slice(1);
  return {
    atoms,
    claims: [
      {
        paragraph: 1,
        atomIds: [first.id],
        relation: "inference",
        instruction: `State ${first.id} accurately, then explain only its bounded meaning. Do not turn it into biography, behavior, skill, timing, or a concrete scenario.`,
        marker: marker([first.id], "inference")
      },
      {
        paragraph: 2,
        atomIds: remaining.map((atom) => atom.id),
        relation: "compression",
        instruction: `State the remaining selected fact${remaining.length === 1 ? "" : "s"} accurately and preserve the counterweight. Do not make the facts a causal mechanism or proof that the intended conclusion is already true.`,
        marker: marker(remaining.map((atom) => atom.id), "compression")
      },
      {
        paragraph: 3,
        atomIds: atoms.map((atom) => atom.id),
        relation: "inference",
        instruction: "Answer the distinct chapter question and reach only the intended conclusion. Preserve uncertainty and the ownership boundary; do not add advice that requires an unselected fact.",
        marker: marker(atoms.map((atom) => atom.id), "inference")
      }
    ]
  };
}

export function auditWriterClaimMarkers(text: string, card: WriterClaimCard): WriterClaimAudit {
  if (!card.writerSignals) return { prose: text, claims: [], errors: [] };
  const plan = buildWriterChapterClaimPlan(card);
  const paragraphs = text
    .replaceAll("\r\n", "\n")
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const errors: string[] = [];
  if (paragraphs.length !== plan.claims.length) {
    errors.push(`${card.title} must follow the approved three-paragraph claim plan; found ${paragraphs.length} paragraphs.`);
  }
  const claims = paragraphs.map((paragraph, index) => {
    const expected = plan.claims[index];
    const markerMatch = paragraph.match(supportMarkerPattern);
    const prose = paragraph.replace(supportMarkerPattern, "").trim();
    if (!expected) {
      errors.push(`${card.title} includes an unplanned paragraph ${index + 1}.`);
      return {
        paragraph: index + 1,
        text: prose,
        atomIds: [],
        relation: "inference" as const,
        boundaryCheck: "pass" as const
      };
    }
    if (!markerMatch) {
      errors.push(`${card.title} paragraph ${index + 1} is missing its internal support marker ${expected.marker}.`);
    } else if (`[[${markerMatch[1]}]]` !== expected.marker) {
      errors.push(`${card.title} paragraph ${index + 1} must use support marker ${expected.marker}; found [[${markerMatch[1]}]].`);
    }
    return {
      paragraph: expected.paragraph,
      text: prose,
      atomIds: expected.atomIds,
      relation: expected.relation,
      boundaryCheck: "pass" as const
    };
  });
  return {
    prose: claims.map((claim) => claim.text).join("\n\n"),
    claims,
    errors
  };
}
