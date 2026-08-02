import {
  explorerFocusSchema,
  type ChartArrivalEvidence,
  type ExplorerFocus,
  type ExplorerFocusKey,
  type ExplorerFocusSnapshot
} from "@astra/contracts";

export const EXPLORER_FOCUS_INTENTS: Record<ExplorerFocusKey, string> = {
  self_understanding: "Understand myself",
  relationships: "Understand my relationships",
  work_purpose: "Find direction in work and purpose",
  change_transition: "Make sense of a change",
  learn_chart: "Learn how my chart works"
};

export function explorerFocusFromMetadata(metadata: unknown): ExplorerFocus | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  const parsed = explorerFocusSchema.safeParse((metadata as Record<string, unknown>).explorerFocus);
  return parsed.success ? parsed.data : undefined;
}

export function explorerFocusSnapshot(focus: ExplorerFocus | undefined): ExplorerFocusSnapshot {
  return focus?.status === "selected"
    ? { schemaVersion: 1, status: "selected", key: focus.key }
    : { schemaVersion: 1, status: "skipped" };
}

export function explorerFocusIntent(focus: ExplorerFocus | undefined) {
  return focus?.status === "selected" ? EXPLORER_FOCUS_INTENTS[focus.key] : undefined;
}

function values(evidence: ChartArrivalEvidence[]) {
  return {
    sun: evidence.find((item) => item.key === "sun")?.value,
    moon: evidence.find((item) => item.key === "moon")?.value,
    rising: evidence.find((item) => item.key === "rising")?.value
  };
}

function evidenceOpening(evidence: ChartArrivalEvidence[]) {
  const { sun, moon, rising } = values(evidence);
  if (sun && moon && rising) return `Your ${sun} Sun, ${moon} Moon, and ${rising} Rising give Astra three supported signals to explore together.`;
  if (sun && moon) return `Your ${sun} Sun and ${moon} Moon give Astra two supported signals to explore together.`;
  if (sun) return `Your ${sun} Sun is the clearest supported signal available from these birth details.`;
  return "Your saved birth details give Astra a supported starting point without filling in what the chart cannot verify.";
}

const arrivalLens: Record<ExplorerFocusKey, string> = {
  self_understanding: "Astra will begin by noticing how identity, instinct, and outward style work together, using the chart as a lens for reflection rather than a fixed definition of who you are.",
  relationships: "Astra will begin with the patterns you bring into connection—needs, expression, and ways of meeting others—without assuming your relationship status or deciding what any bond should become.",
  work_purpose: "Astra will begin with the ways you direct energy, seek meaning, and respond to responsibility, offering questions for reflection rather than prescribing a career or a single purpose.",
  change_transition: "Astra will begin with the inner resources and tensions that may help you reflect on change, without predicting events or claiming the chart knows the circumstances around you.",
  learn_chart: "Astra will begin by showing how a few verified placements contribute different kinds of information, building your chart literacy without treating any one placement as the whole story."
};

export function deterministicArrivalGlimpse(evidence: ChartArrivalEvidence[], focus: ExplorerFocusSnapshot) {
  const opening = evidenceOpening(evidence);
  if (focus.status === "selected") return `${opening} ${arrivalLens[focus.key]} The focus guides the sequence, never the chart evidence itself.`;
  return `${opening} Your first view stays broad for now, so you can notice what feels useful before choosing a direction for deeper exploration. Nothing here asks you to choose a permanent path.`;
}

const journeyLens: Record<ExplorerFocusKey, { title: string; middle: string; reflection: string }> = {
  self_understanding: {
    title: "Notice the pattern beneath the labels",
    middle: "Read them as different parts of one living pattern: what you are learning to express, what restores emotional steadiness, and how you instinctively enter a room or a new experience. Agreement is not required; the value is in noticing where the symbols illuminate a tension or strength you already recognize.",
    reflection: "Where do these parts of you cooperate, and where do they seem to ask for different things?"
  },
  relationships: {
    title: "Notice what you carry into connection",
    middle: "Use them to notice your own side of connection: how you express vitality, what helps you feel emotionally met, and how others may first encounter you. This is not a verdict on a partner or a prediction about a bond. It is a private starting point for seeing the needs and habits you bring into many kinds of relationship.",
    reflection: "Which need is easiest for you to name in connection, and which one tends to stay unspoken?"
  },
  work_purpose: {
    title: "Notice how purpose becomes practice",
    middle: "Treat them as clues about how you bring energy to a task, what keeps you inwardly engaged, and the style you use when stepping into responsibility. A chart cannot choose a vocation or declare one fixed purpose. It can give you a structured way to compare what energizes you with how your present work actually feels.",
    reflection: "What kind of effort leaves you more alive afterward, even when it asks something difficult of you?"
  },
  change_transition: {
    title: "Notice what stays yours during change",
    middle: "Let them point toward resources already available to you: a way of directing energy, an emotional rhythm, and an instinctive approach to unfamiliar ground. The chart is not forecasting what happens next, and it does not know the details of your transition. It offers a steady frame for noticing how you are meeting it.",
    reflection: "What part of your usual way of meeting change feels trustworthy now, and what part needs more room?"
  },
  learn_chart: {
    title: "Learn the chart one signal at a time",
    middle: "Each placement answers a different kind of question: the Sun describes a center of vitality, the Moon an emotional rhythm, and the Rising—when birth time supports it—the style of first contact. None is a complete personality label. Their usefulness comes from comparing the roles they play and noticing how the whole pattern behaves together.",
    reflection: "Which signal feels easiest to observe in daily life, and what evidence helps you recognize it?"
  }
};

export function deterministicFirstJourneyStep(evidence: ChartArrivalEvidence[], focus: ExplorerFocusSnapshot) {
  const selected = focus.status === "selected" ? journeyLens[focus.key] : {
    title: "Begin with what the chart can support",
    middle: "Start by treating these placements as distinct signals rather than a finished explanation of you. Notice what each one adds, where they seem to reinforce each other, and where they suggest different needs. You do not need to adopt a label or choose a permanent focus. This first exploration simply gives you something concrete to observe in lived experience.",
    reflection: "What feels genuinely recognizable here, and what would you rather leave open for now?"
  };
  return {
    title: selected.title,
    body: `${evidenceOpening(evidence)} ${selected.middle} Keep what proves useful, and leave the rest open. ${selected.reflection}`,
    ctaLabel: "Explore this in your chart"
  };
}
