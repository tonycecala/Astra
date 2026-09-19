// Writer-neutral port of TrueByline editorial_room_v3.py MODEL_CLICHE_SIGNALS
// and local_checks: exact spans are advisory, never proof or automatic rewrites.
// The contrast/reassurance signals below are Astra extensions, not TrueByline code.
export const TRUEBYLINE_MODEL_CLICHE_SIGNALS = [
  "The process changed everything.", "in today's fast-paced world", "navigate the complexities",
  "a testament to", "rich tapestry", "delve into"
] as const;

export type PortraitProseSignal = { kind: "stock_phrase" | "contrast_frame" | "reassurance"; passage: string; offset: number; advisory: true };

export function detectPortraitProseSignals(text: string): PortraitProseSignal[] {
  const signals: PortraitProseSignal[] = [];
  const folded = text.toLowerCase();
  for (const phrase of TRUEBYLINE_MODEL_CLICHE_SIGNALS) {
    const offset = folded.indexOf(phrase.toLowerCase());
    if (offset >= 0) signals.push({ kind: "stock_phrase", passage: text.slice(offset, offset + phrase.length), offset, advisory: true });
  }
  const patterns = [
    ["contrast_frame", /\b(?:not|isn't|isn’t|aren't|aren’t)\b[^.!?\n]{1,180}\b(?:but|rather)\b[^.!?\n]{0,160}/gi],
    ["contrast_frame", /\b(?:it|this|that) (?:is not|isn't|isn’t)\b[^.!?\n]{1,140}[.!?]\s+(?:It|This|That) is\b(?!\s+not\b)[^.!?\n]{1,140}/gi],
    ["contrast_frame", /\b(?:not|isn't|isn’t|aren't|aren’t)\b[^.!?\n—;:]{1,140}[—;:]\s*(?:it|this|that|you|they|we|he|she)(?:\s+(?:is|are|was|were)|['’](?:s|re))\b[^.!?\n]{1,140}/gi],
    ["reassurance", /\b(?:you are not lazy|you’re not lazy|you are not broken|you’re not broken|not a (?:flaw|defect|failure)|nothing (?:is )?wrong with you)\b/gi]
  ] as const;
  for (const [kind, pattern] of patterns) for (const match of text.matchAll(pattern)) {
    signals.push({ kind, passage: match[0], offset: match.index!, advisory: true });
  }
  return signals.sort((a, b) => a.offset - b.offset).filter((signal, index, all) =>
    !all.slice(0, index).some(previous => previous.kind === signal.kind && previous.offset + previous.passage.length > signal.offset)
  );
}

// Astra's approved voice and selected chart packet are the authority here.
// No Tony-specific profile, corpus, or personal biography is imported.
export function portraitVoiceContract(relationship = false) {
  return [
    "PROSE CRAFT: Develop the actual motive, action and consequence. State the important observation directly. Use contrast when it reveals a real distinction; avoid repeatedly staging a false alternative merely to announce the preferred one ('not X, but Y', 'this is not... it is...', 'not because... but because...'). Preserve the distinction when removing its scaffolding. No mechanical ban on 'not' or 'but'.",
    "Watch model-default habits: automatic three-part lists, repeated 'there is something', inflated real/genuine/deep reassurance, symmetrical either/or menus, and conclusions that repackage the opening. Keep a triad or contrast that earns its place; break repeated cadence by following the particular thought. Do not substitute a synonym for a stock phrase and call it an edit. Let an uncomfortable insight stand without immediately rescuing the reader with an acquittal.",
    relationship
      ? "READABILITY: Aim roughly at US grade 7-9 for an adult, not a child. Use familiar words with supple sentence rhythm: many sentences around 15-22 words, some short and some longer when the thought benefits. Do not chop connected thoughts into little declarations or lower the grade as far as possible. Join related thoughts naturally; avoid both nested abstractions and a children's-reader cadence. Retain desire, wit, emotional complexity and the other person's distinct perspective."
      : "READABILITY: Aim near US grade 8, about 1-2 grades lighter than the approved Personal/Life Chapter samples. Most sentences can be 14-18 words, with a few longer ones when earned. Split nested clauses at a real turn. Use ordinary verbs and concrete nouns; keep the full argument, adult emotional nuance and memorable insight.",
    "Reading grade is guidance, not a score to game. Do not chop prose into fragments, delete the hard idea, or make every sentence the same length. Keep necessary names and precise terms; explain an unfamiliar idea plainly instead of flattening it."
  ].join("\n\n");
}

export const PORTRAIT_INTERPRETIVE_PERMISSION = "INTERPRETIVE LICENSE: The owner wants provocative psychological recognition. When supported by the selected pattern, name avoidance, vanity, control, envy, dependence, desire and self-deception plainly. Generalized learned defenses and inferred motives are legitimate interpretive material, not factual errors merely because they are unobserved. Do not require every pointed claim to be conditional, flattering or followed by reassurance. A troubling interpretation may stand. Keep pleasure and strengths too; do not manufacture pathology or make every gift a defense. Preserve factual boundaries: no invented specific event, diagnosis, attributed speech, verified accomplishment, another person's actual private feelings or consent, or promised outcome. Intensity or discomfort alone is not grounds for an edit or rejection.";

export function portraitProseEditBrief(text: string) {
  const signals = detectPortraitProseSignals(text);
  return "TRUEBYLINE-STYLE DIAGNOSIS: For a suspected model-default passage, identify the literal span and the actual rhetorical work it should do for this portrait. Diagnose against the selected evidence and Astra voice, not a phrase blacklist. Repair high-impact repetition by making that observation directly. These local signals are pointers, not errors or instructions: " + JSON.stringify(signals.slice(0, 8));
}
