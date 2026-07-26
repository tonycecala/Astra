export const ASTRA_PLAINSPOKEN_READING_GRADE_MIN = 6;
export const ASTRA_PLAINSPOKEN_READING_GRADE_MAX = 7;
export const ASTRA_READABILITY_ALGORITHM = "flesch-kincaid-en-us-v1";

export type ReportReadabilityMetrics = {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  averageSentenceWords: number;
  polysyllabicWordRate: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
};

export function measureReportReadability(value: string): ReportReadabilityMetrics {
  const text = stripMarkdown(value);
  const words = text.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) ?? [];
  const sentenceCount = Math.max(1, (text.match(/[.!?]+(?=\s|$)/g) ?? []).length);
  const syllables = words.map(estimateSyllables);
  const syllableCount = syllables.reduce((total, count) => total + count, 0);
  const polysyllabicWords = syllables.filter((count) => count >= 3).length;
  const wordCount = words.length;
  if (!wordCount) {
    return {
      wordCount: 0,
      sentenceCount: 1,
      syllableCount: 0,
      averageSentenceWords: 0,
      polysyllabicWordRate: 0,
      fleschReadingEase: 0,
      fleschKincaidGrade: 0
    };
  }
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / Math.max(1, wordCount);

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    averageSentenceWords: rounded(wordsPerSentence),
    polysyllabicWordRate: rounded((polysyllabicWords / Math.max(1, wordCount)) * 100),
    fleschReadingEase: rounded(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord),
    fleschKincaidGrade: rounded(0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59)
  };
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateSyllables(value: string) {
  const word = value.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;

  const withoutSilentEndings = word
    .replace(/(?:[^laeiouy]e|(?:[^aeiouy]es)|(?:[^aeiouy]ed))$/, "")
    .replace(/^y/, "");
  const groups = withoutSilentEndings.match(/[aeiouy]+/g)?.length ?? 0;
  return Math.max(1, groups);
}

function rounded(value: number) {
  return Number(value.toFixed(1));
}
