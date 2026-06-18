import type { ComposerAvailabilityCard, ComposerAvailabilityRequest, ComposerAvailabilityResponse } from "@astra/contracts";
import seedPayload from "../data/stream-cards.seed.json";
import signReference from "../data/anthropomorphic-sign-reference.json";
import astrology101AspectsModulePayload from "../data/astrology-101-aspects-module-v1.json";
import astrology101CertificationModulePayload from "../data/astrology-101-certification-module-v1.json";
import astrology101First12Payload from "../data/astrology-101-first-12-v1.json";
import astrology101GeneratedImages from "../data/astrology-101-generated-images-v1.json";
import astrology101HousesModulePayload from "../data/astrology-101-houses-module-v1.json";
import astrology101PlanetsModulePayload from "../data/astrology-101-planets-module-v1.json";
import astrology101QuizModulePayload from "../data/astrology-101-quiz-module-v1.json";
import astrology101QuizPacksPayload from "../data/astrology-101-quiz-packs-v1.json";
import astrology101ReflectionModulePayload from "../data/astrology-101-reflection-module-v1.json";
import astrology101TimingModulePayload from "../data/astrology-101-timing-module-v1.json";
import astrology101ZodiacModulePayload from "../data/astrology-101-zodiac-module-v1.json";

export type ComposerCardAction = {
  label?: string;
  href?: string;
  action?: string;
  variant?: string;
};

export type ComposerCardPlacement = {
  feeds?: string[];
  type?: string;
  energy?: string[];
  lifecycleState?: string;
  tags?: string[];
  priority?: number;
  difficulty?: string;
};

export type ComposerQuizChoice = {
  id: string;
  label: string;
  isCorrect: boolean;
};

export type ComposerQuizQuestion = {
  id: string;
  prompt: string;
  choices: ComposerQuizChoice[];
  explanation?: string;
};

export type ComposerCardQuiz = {
  format: "multiple_choice";
  questions: ComposerQuizQuestion[];
};

export type ComposerStreamCard = {
  id: string;
  kind: string;
  status: string;
  title: string;
  body: string;
  subtitle?: string;
  excerpt?: string;
  eyebrow?: string;
  tags: string[];
  actions: ComposerCardAction[];
  isOnboarding?: boolean;
  onboardingOrder?: number;
  priority?: number;
  publishedAt?: string;
  lane?: string;
  seriesId?: string;
  seriesOrder?: number;
  ctaLabel?: string;
  ctaAction?: string;
  href?: string;
  placement?: ComposerCardPlacement;
  image_url?: string;
  imageUrl?: string;
  imageSrc?: string;
  originalImageSrc?: string;
  thumbnailImageSrc?: string;
  artPrompt?: string;
  image_prompt?: string;
  visualMode?: string;
  styleLabel?: string;
  difficulty?: string;
  ontologyType?: ComposerCardOntologyType;
  courseId?: string;
  courseTitle?: string;
  courseSectionId?: string;
  courseSectionTitle?: string;
  quiz?: ComposerCardQuiz;
  createdAt?: string;
  updatedAt?: string;
  source?: string;
};

export type ComposerCardOntologyType = "lesson" | "reflection" | "quiz" | "test" | "certification" | "art" | "onboarding" | "series";

export type ComposerCardOntologyItem = {
  id: ComposerCardOntologyType;
  title: string;
  description: string;
};

export type ComposerCourseSection = {
  id: string;
  title: string;
  description: string;
  order: number;
  cards: ComposerStreamCard[];
  lessonCount: number;
  quizCount: number;
  testCount: number;
  certificationCount: number;
};

export type ComposerCardSummary = {
  totalCards: number;
  cardsWithImages: number;
  cardsWithPrompts: number;
  onboardingCards: number;
  courseCards: number;
  localAssetFiles: number;
  remoteImageCards: number;
  statusCounts: Record<string, number>;
  kindCounts: Record<string, number>;
  laneCounts: Record<string, number>;
};

export type ComposerLibraryBox = {
  id: string;
  title: string;
  kind: "course" | "series" | "collection" | "onboarding";
  cards: ComposerStreamCard[];
  cardCount: number;
  imageCount: number;
  promptCount: number;
  lessonCount: number;
  quizCount: number;
  testCount: number;
  certificationCount: number;
  statusCounts: Record<string, number>;
};

export type ComposerCardScope = "all" | "drafts" | "course";

export type ComposerCardMembership = {
  id: string;
  title: string;
  kind: "course" | "series" | "collection" | "pool" | "ordered_list" | "onboarding";
  href: string;
  detail: string;
  order?: number;
};

export type ComposerCardQueryInput = {
  scope?: ComposerCardScope;
  query?: string;
  feeds?: string[];
  kinds?: string[];
  lanes?: string[];
  statuses?: string[];
  tags?: string[];
  page?: number;
  pageSize?: number;
};

export type ComposerCardPageState = {
  cacheKey: string;
  fingerprint: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  selectionLimit: number;
  windowEnd: number;
  windowStart: number;
};

export type ComposerCardQueryResult = {
  cards: ComposerStreamCard[];
  totalCards: number;
  page: number;
  pageSize: number;
  pageCount: number;
  pageState: ComposerCardPageState;
  facets: {
    feeds: Array<[string, number]>;
    kinds: Array<[string, number]>;
    lanes: Array<[string, number]>;
    statuses: Array<[string, number]>;
    tags: Array<[string, number]>;
  };
};

export type ComposerAvailabilityQueryInput = Partial<ComposerAvailabilityRequest>;

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function uniqueSorted(values: string[] | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function cardArray(): ComposerStreamCard[] {
  const cards = (seedPayload as { cards?: ComposerStreamCard[] }).cards ?? [];
  return cards.map((card) => ({
    ...card,
    tags: Array.isArray(card.tags) ? card.tags : [],
    actions: Array.isArray(card.actions) ? card.actions : []
  }));
}

export const composerCardOntology: ComposerCardOntologyItem[] = [
  {
    id: "lesson",
    title: "Lesson",
    description: "Teaches one idea, symbol, placement, or practice step."
  },
  {
    id: "reflection",
    title: "Reflection",
    description: "Prompts introspection or applies a symbol to lived experience."
  },
  {
    id: "quiz",
    title: "Quiz",
    description: "Checks recall or recognition inside a course section."
  },
  {
    id: "test",
    title: "Test",
    description: "Checks readiness across several lessons or a course module."
  },
  {
    id: "certification",
    title: "Certification",
    description: "Marks completion, mastery, or a course credential moment."
  },
  {
    id: "art",
    title: "Art",
    description: "Carries visual language, symbolic reference, or gallery material."
  },
  {
    id: "onboarding",
    title: "Onboarding",
    description: "Introduces Astra, first-run guidance, or setup context."
  },
  {
    id: "series",
    title: "Series",
    description: "Belongs to an ordered or themed collection."
  }
];

const astrology101CourseId = "astrology_101";
const astrology101CourseTitle = "Astrology 101";

type ImportedAstrology101Payload = {
  cards?: Array<Partial<ComposerStreamCard> & { energy?: string[] }>;
};

type GeneratedCourseImage = {
  imageUrl?: string;
  thumbnailImageUrl?: string;
  prompt?: string;
};

function normalizeImportedQuiz(value: unknown): ComposerCardQuiz | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const quiz = value as { format?: unknown; questions?: unknown };
  if (quiz.format !== "multiple_choice" || !Array.isArray(quiz.questions)) return undefined;
  const questions = quiz.questions
    .map((question, questionIndex): ComposerQuizQuestion | null => {
      if (!question || typeof question !== "object" || Array.isArray(question)) return null;
      const item = question as { id?: unknown; prompt?: unknown; choices?: unknown; explanation?: unknown };
      if (typeof item.prompt !== "string" || !Array.isArray(item.choices)) return null;
      const choices = item.choices
        .map((choice): ComposerQuizChoice | null => {
          if (!choice || typeof choice !== "object" || Array.isArray(choice)) return null;
          const option = choice as { id?: unknown; label?: unknown; isCorrect?: unknown };
          if (typeof option.label !== "string") return null;
          return {
            id: typeof option.id === "string" ? option.id : option.label.toLowerCase().replace(/\W+/g, "_"),
            label: option.label,
            isCorrect: option.isCorrect === true
          };
        })
        .filter((choice): choice is ComposerQuizChoice => Boolean(choice));
      if (choices.length < 2 || choices.filter((choice) => choice.isCorrect).length !== 1) return null;
      return {
        id: typeof item.id === "string" ? item.id : `question_${questionIndex + 1}`,
        prompt: item.prompt,
        choices,
        explanation: typeof item.explanation === "string" ? item.explanation : undefined
      };
    })
    .filter((question): question is ComposerQuizQuestion => Boolean(question));
  if (!questions.length) return undefined;
  return {
    format: "multiple_choice",
    questions
  };
}

function importedCourseOrder(card: Partial<ComposerStreamCard>) {
  if (typeof card.seriesOrder === "number") return card.seriesOrder;
  const idOrder = card.id?.match(/astro101_(\d+)/)?.[1];
  return idOrder ? Number(idOrder) : undefined;
}

function sectionForAstrology101Order(order: number | undefined) {
  if (!order || order <= 12) {
    return {
      sectionId: "section_01_foundations",
      sectionTitle: "Foundations"
    };
  }
  if (order <= 24) {
    return {
      sectionId: "section_02_zodiac_language",
      sectionTitle: "Zodiac language"
    };
  }
  if (order <= 34) {
    return {
      sectionId: "section_03_planets",
      sectionTitle: "Planets as functions"
    };
  }
  if (order <= 46) {
    return {
      sectionId: "section_04_houses",
      sectionTitle: "Houses as life areas"
    };
  }
  if (order <= 60) {
    return {
      sectionId: "section_05_aspects_timing",
      sectionTitle: "Aspects and timing"
    };
  }
  if (order <= 71) {
    return {
      sectionId: "section_06_reflection_quiz",
      sectionTitle: "Reflection and quiz"
    };
  }
  return {
    sectionId: "section_07_completion",
    sectionTitle: "Completion"
  };
}

function generatedImageForAstrology101Card(card: Partial<ComposerStreamCard>, order: number | undefined): GeneratedCourseImage | undefined {
  const images = astrology101GeneratedImages as Record<string, GeneratedCourseImage>;
  const orderKey = typeof order === "number" ? `astro101-${String(order).padStart(3, "0")}` : undefined;
  const idKey = card.id?.replace(/^astro101_/, "astro101-").replace(/_.*/, "");
  return (orderKey ? images[orderKey] : undefined) ?? (idKey ? images[idKey] : undefined);
}

function normalizeImportedAstrology101Cards(
  payload: ImportedAstrology101Payload,
  options: { source: string; sectionId?: string; sectionTitle?: string; includeCard?: (card: Partial<ComposerStreamCard>) => boolean } 
): ComposerStreamCard[] {
  return (payload.cards ?? []).flatMap((card) => {
    if (!card.id || !card.title || !card.body || !card.kind) return [];
    if (options.includeCard && !options.includeCard(card)) return [];
    const quiz = normalizeImportedQuiz(card.quiz);
    const order = importedCourseOrder(card);
    const section = options.sectionId && options.sectionTitle ? { sectionId: options.sectionId, sectionTitle: options.sectionTitle } : sectionForAstrology101Order(order);
    const generatedImage = generatedImageForAstrology101Card(card, order);
    const ontologyType =
      card.kind === "test"
        ? "test"
        : card.kind === "certification"
          ? "certification"
          : card.kind === "reflection"
            ? "reflection"
            : card.kind === "art"
              ? "art"
              : card.kind === "quiz"
                ? "quiz"
                : "lesson";
    return [
      {
        id: card.id,
        kind: card.kind,
        ontologyType,
        status: card.status ?? "draft",
        title: card.title,
        subtitle: card.subtitle,
        excerpt: card.excerpt,
        eyebrow: card.eyebrow,
        body: card.body,
        tags: Array.isArray(card.tags) ? card.tags : ["astrology_101", ontologyType, "beginner"],
        actions: [],
        lane: card.lane ?? "astrology_101",
        seriesId: card.seriesId ?? "astra_astrology_101",
        seriesOrder: order,
        ctaLabel: card.ctaLabel,
        ctaAction: card.ctaAction,
        href: card.href,
        imageUrl: card.imageUrl ?? generatedImage?.imageUrl,
        thumbnailImageSrc: card.thumbnailImageSrc ?? generatedImage?.thumbnailImageUrl,
        originalImageSrc: card.originalImageSrc ?? generatedImage?.imageUrl,
        image_prompt: card.image_prompt,
        artPrompt: card.artPrompt ?? generatedImage?.prompt,
        difficulty: card.difficulty ?? "beginner",
        quiz,
        courseId: astrology101CourseId,
        courseTitle: astrology101CourseTitle,
        courseSectionId: section.sectionId,
        courseSectionTitle: section.sectionTitle,
        source: options.source
      }
    ];
  });
}

const astrology101CourseCards: ComposerStreamCard[] = [
  ...normalizeImportedAstrology101Cards(astrology101First12Payload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-first-12"
  }),
  ...normalizeImportedAstrology101Cards(astrology101ZodiacModulePayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-zodiac-module"
  }),
  ...normalizeImportedAstrology101Cards(astrology101PlanetsModulePayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-planets-module"
  }),
  ...normalizeImportedAstrology101Cards(astrology101HousesModulePayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-houses-module"
  }),
  ...normalizeImportedAstrology101Cards(astrology101AspectsModulePayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-aspects-module"
  }),
  ...normalizeImportedAstrology101Cards(astrology101TimingModulePayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-timing-module"
  }),
  ...normalizeImportedAstrology101Cards(astrology101ReflectionModulePayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-reflection-module"
  }),
  ...normalizeImportedAstrology101Cards(astrology101QuizModulePayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-quiz-module",
    sectionId: "section_06_reflection_quiz",
    sectionTitle: "Reflection and quiz"
  }),
  ...normalizeImportedAstrology101Cards(astrology101CertificationModulePayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-certification-module",
    sectionId: "section_07_completion",
    sectionTitle: "Completion"
  }),
  ...normalizeImportedAstrology101Cards(astrology101QuizPacksPayload as ImportedAstrology101Payload, {
    source: "v1-astrology-101-quiz-packs",
    sectionId: "section_07_completion",
    sectionTitle: "Completion"
  })
];

function countBy(cards: ComposerStreamCard[], readValue: (card: ComposerStreamCard) => string | undefined) {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    const value = readValue(card) ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function optionCounts(cards: ComposerStreamCard[], readValues: (card: ComposerStreamCard) => string[]) {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const value of new Set(readValues(card).filter(Boolean))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function displayComposerValue(value: string) {
  return value.replace(/^astra_/, "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getComposerCardOntologyType(card: ComposerStreamCard): ComposerCardOntologyType {
  if (card.ontologyType) return card.ontologyType;
  if (card.isOnboarding || getComposerCardFeeds(card).includes("onboarding") || card.kind === "welcome") return "onboarding";
  if (card.kind === "quiz") return "quiz";
  if (card.kind === "test") return "test";
  if (card.kind === "certification") return "certification";
  if (card.kind === "portrait_gallery" || card.visualMode || getComposerCardImage(card)) return "art";
  if (card.kind === "reflection" || card.lane === "know_yourself") return "reflection";
  if (card.seriesId) return "series";
  return "lesson";
}

export function getComposerCardImage(card: ComposerStreamCard) {
  return card.image_url ?? card.imageUrl ?? card.originalImageSrc ?? card.imageSrc ?? card.thumbnailImageSrc ?? "";
}

export function getComposerCardFeeds(card: ComposerStreamCard) {
  const feeds = card.placement?.feeds ?? [];
  if (feeds.length) return feeds;
  if (card.isOnboarding) return ["onboarding"];
  return ["standard"];
}

export function listComposerCards() {
  return [...cardArray(), ...astrology101CourseCards].sort((a, b) => {
    const aHasImage = Boolean(getComposerCardImage(a));
    const bHasImage = Boolean(getComposerCardImage(b));
    if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;
    const aPriority = a.priority ?? 0;
    const bPriority = b.priority ?? 0;
    if (aPriority !== bPriority) return bPriority - aPriority;
    return a.title.localeCompare(b.title);
  });
}

export function getComposerCardById(cardId: string) {
  const decodedCardId = decodeURIComponent(cardId);
  return listComposerCards().find((card) => card.id === decodedCardId) ?? null;
}

export function getComposerCardMemberships(card: ComposerStreamCard): ComposerCardMembership[] {
  const memberships = new Map<string, ComposerCardMembership>();
  const ontologyType = getComposerCardOntologyType(card);
  const feeds = getComposerCardFeeds(card);

  if (card.courseId) {
    memberships.set(`course:${card.courseId}`, {
      id: card.courseId,
      title: card.courseTitle ?? displayComposerValue(card.courseId),
      kind: "course",
      href: "/course",
      detail: [card.courseSectionTitle, card.seriesOrder ? `#${card.seriesOrder}` : ""].filter(Boolean).join(" · "),
      order: card.seriesOrder
    });
  }

  if (card.seriesId) {
    memberships.set(`series:${card.seriesId}`, {
      id: card.seriesId,
      title: displayComposerValue(card.seriesId),
      kind: "series",
      href: `/cards?lane=${encodeURIComponent(card.seriesId)}`,
      detail: card.seriesOrder ? `#${card.seriesOrder}` : displayComposerValue(card.kind),
      order: card.seriesOrder
    });
  }

  if (card.isOnboarding || feeds.includes("onboarding")) {
    memberships.set("onboarding:onboarding", {
      id: "onboarding",
      title: displayComposerValue("onboarding"),
      kind: "onboarding",
      href: "/onboarding",
      detail: card.onboardingOrder ? `#${card.onboardingOrder}` : displayComposerValue(ontologyType),
      order: card.onboardingOrder
    });
  }

  for (const feed of feeds) {
    memberships.set(`pool:${feed}`, {
      id: feed,
      title: displayComposerValue(feed),
      kind: "pool",
      href: `/cards?feed=${encodeURIComponent(feed)}`,
      detail: "Feed pool"
    });
  }

  if (card.lane) {
    memberships.set(`collection:${card.lane}`, {
      id: card.lane,
      title: displayComposerValue(card.lane),
      kind: "collection",
      href: `/cards?lane=${encodeURIComponent(card.lane)}`,
      detail: "Library lane"
    });
  }

  memberships.set(`ontology:${ontologyType}`, {
    id: ontologyType,
    title: displayComposerValue(ontologyType),
    kind: "collection",
    href: `/cards?kind=${encodeURIComponent(card.kind)}`,
    detail: "Ontology type"
  });

  return [...memberships.values()].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title));
}

export function listImportedComposerCards() {
  return cardArray();
}

export function getComposerCardSummary(cards = listComposerCards()): ComposerCardSummary {
  const cardsWithImages = cards.filter(getComposerCardImage).length;
  return {
    totalCards: cards.length,
    cardsWithImages,
    cardsWithPrompts: cards.filter((card) => card.artPrompt || card.image_prompt).length,
    onboardingCards: cards.filter((card) => card.isOnboarding || getComposerCardFeeds(card).includes("onboarding")).length,
    courseCards: cards.filter((card) => card.courseId === astrology101CourseId).length,
    localAssetFiles: 0,
    remoteImageCards: cards.filter((card) => getComposerCardImage(card).startsWith("http")).length,
    statusCounts: countBy(cards, (card) => card.status),
    kindCounts: countBy(cards, (card) => card.kind),
    laneCounts: countBy(cards, (card) => card.seriesId ?? card.lane)
  };
}

export function listComposerDraftCards(cards = listComposerCards()) {
  return cards.filter((card) => ["draft", "in_review", "approved", "published"].includes(card.status));
}

export function listComposerCourseCards(cards = listComposerCards()) {
  return cards
    .filter((card) => card.courseId === astrology101CourseId)
    .sort((a, b) => {
      const aOrder = a.seriesOrder ?? a.priority ?? 9999;
      const bOrder = b.seriesOrder ?? b.priority ?? 9999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.title.localeCompare(b.title);
    });
}

function courseSectionForCard(card: ComposerStreamCard): Omit<ComposerCourseSection, "cards" | "lessonCount" | "quizCount" | "testCount" | "certificationCount"> {
  if (card.courseSectionId && card.courseSectionTitle) {
    const order = Number(card.courseSectionId.match(/section_(\d+)/)?.[1] ?? 99);
    return {
      id: card.courseSectionId,
      title: card.courseSectionTitle,
      description: card.courseSectionTitle,
      order
    };
  }

  if (card.kind === "zodiac") {
    return {
      id: "section_01_zodiac_language",
      title: "Zodiac language",
      description: "Signs, elements, modalities, and symbolic style.",
      order: 1
    };
  }

  if (card.kind === "house") {
    return {
      id: "section_02_houses",
      title: "Houses as life areas",
      description: "The twelve houses as fields of experience.",
      order: 2
    };
  }

  if (card.kind === "planet") {
    return {
      id: "section_03_planets",
      title: "Planets as functions",
      description: "Planets as verbs, needs, drives, and developmental forces.",
      order: 3
    };
  }

  if (card.kind === "test" || card.kind === "quiz") {
    return {
      id: "section_06_reflection_quiz",
      title: "Reflection and quiz",
      description: "Review, multiple-choice checks, and readiness questions.",
      order: 6
    };
  }

  if (card.kind === "certification") {
    return {
      id: "section_07_completion",
      title: "Completion",
      description: "Completion cards and next-path readiness.",
      order: 7
    };
  }

  return {
    id: "section_05_aspects_timing",
    title: "Aspects and timing",
    description: "Beginner chart literacy, synthesis, aspects, and timing posture.",
    order: 5
  };
}

export function buildAstrology101CourseSections(cards = listComposerCourseCards()): ComposerCourseSection[] {
  const groups = new Map<string, { meta: ReturnType<typeof courseSectionForCard>; cards: ComposerStreamCard[] }>();
  for (const card of cards) {
    const meta = courseSectionForCard(card);
    const current = groups.get(meta.id) ?? { meta, cards: [] };
    current.cards.push(card);
    groups.set(meta.id, current);
  }

  return [...groups.values()]
    .map(({ meta, cards: sectionCards }) => {
      const sortedCards = [...sectionCards].sort((a, b) => {
        const aOrder = a.seriesOrder ?? a.priority ?? 9999;
        const bOrder = b.seriesOrder ?? b.priority ?? 9999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.title.localeCompare(b.title);
      });
      return {
        ...meta,
        cards: sortedCards,
        lessonCount: sortedCards.filter((card) => getComposerCardOntologyType(card) === "lesson").length,
        quizCount: sortedCards.filter((card) => getComposerCardOntologyType(card) === "quiz").length,
        testCount: sortedCards.filter((card) => getComposerCardOntologyType(card) === "test").length,
        certificationCount: sortedCards.filter((card) => getComposerCardOntologyType(card) === "certification").length
      };
    })
    .sort((a, b) => a.order - b.order);
}

function availabilityCardFromComposerCard(
  card: ComposerStreamCard,
  fallback: { collectionId: string; collectionTitle: string; sectionId?: string; sectionTitle?: string },
  index: number
): ComposerAvailabilityCard {
  const section = card.courseSectionId && card.courseSectionTitle ? { sectionId: card.courseSectionId, sectionTitle: card.courseSectionTitle } : {};
  return {
    id: card.id,
    title: card.title,
    subtitle: card.subtitle,
    body: card.body,
    excerpt: card.excerpt,
    kind: card.kind,
    ontologyType: getComposerCardOntologyType(card),
    status: card.status,
    order: index,
    collectionId: card.courseId ?? card.seriesId ?? fallback.collectionId,
    collectionTitle: card.courseTitle ?? fallback.collectionTitle,
    sectionId: section.sectionId ?? fallback.sectionId,
    sectionTitle: section.sectionTitle ?? fallback.sectionTitle,
    lane: card.lane,
    tags: card.tags,
    imageUrl: getComposerCardImage(card) || undefined,
    quiz: card.quiz,
    source: card.source ?? "v1-quarry"
  };
}

function limitCards(cards: ComposerStreamCard[], limit: number) {
  return cards.slice(0, Math.min(Math.max(limit, 1), 100));
}

export function buildComposerAvailability(input: ComposerAvailabilityQueryInput = {}): ComposerAvailabilityResponse {
  const request = {
    requestType: input.requestType ?? "course",
    id: input.id,
    cardIds: input.cardIds ?? [],
    limit: input.limit ?? 48
  } satisfies ComposerAvailabilityRequest;
  const generatedAt = new Date().toISOString();

  if (request.requestType === "course") {
    const courseId = request.id ?? astrology101CourseId;
    const sections = buildAstrology101CourseSections();
    const cards = limitCards(listComposerCourseCards().filter((card) => !request.id || card.courseId === courseId || courseId === astrology101CourseId), request.limit);
    return {
      request,
      collection: {
        id: courseId,
        title: courseId === astrology101CourseId ? astrology101CourseTitle : displayComposerValue(courseId),
        kind: "course",
        description: "Beginner course availability for Astra retrieval by course id.",
        totalCards: cards.length,
        cards: cards.map((card, index) => {
          const section = sections.find((item) => item.cards.some((sectionCard) => sectionCard.id === card.id));
          return availabilityCardFromComposerCard(
            card,
            {
              collectionId: courseId,
              collectionTitle: astrology101CourseTitle,
              sectionId: section?.id,
              sectionTitle: section?.title
            },
            index
          );
        }),
        generatedAt
      }
    };
  }

  if (request.requestType === "ordered_list") {
    const requestedIds = new Set(request.cardIds);
    const cardsById = new Map(listComposerCards().map((card) => [card.id, card]));
    const cards = limitCards(request.cardIds.map((id) => cardsById.get(id)).filter((card): card is ComposerStreamCard => Boolean(card)), request.limit);
    return {
      request,
      collection: {
        id: request.id ?? `ordered_list:${request.cardIds.join("_") || "empty"}`,
        title: request.id ? displayComposerValue(request.id) : "Ordered list",
        kind: "ordered_list",
        description: "Explicit ordered-card availability for Astra retrieval.",
        totalCards: requestedIds.size,
        cards: cards.map((card, index) => availabilityCardFromComposerCard(card, { collectionId: request.id ?? "ordered_list", collectionTitle: "Ordered list" }, index)),
        generatedAt
      }
    };
  }

  const allCards = listComposerCards();
  const collectionId = request.id ?? (request.requestType === "onboarding" ? "onboarding" : "all");
  const filtered = allCards.filter((card) => {
    if (request.requestType === "onboarding") return card.isOnboarding || getComposerCardFeeds(card).includes("onboarding");
    if (request.requestType === "series") return card.seriesId === collectionId || card.lane === collectionId;
    if (request.requestType === "pool") return collectionId === "all" || getComposerCardFeeds(card).includes(collectionId) || card.tags.includes(collectionId) || card.lane === collectionId;
    return true;
  });
  const cards = limitCards(filtered, request.limit);

  return {
    request,
    collection: {
      id: collectionId,
      title: displayComposerValue(collectionId),
      kind: request.requestType,
      description: `${displayComposerValue(request.requestType)} availability for Astra retrieval.`,
      totalCards: filtered.length,
      cards: cards.map((card, index) => availabilityCardFromComposerCard(card, { collectionId, collectionTitle: displayComposerValue(collectionId) }, index)),
      generatedAt
    }
  };
}

export function buildComposerLibraryBoxes(cards = listComposerCards()): ComposerLibraryBox[] {
  const groups = new Map<string, ComposerStreamCard[]>();
  for (const card of cards) {
    const key = card.seriesId ?? card.lane ?? card.kind;
    groups.set(key, [...(groups.get(key) ?? []), card]);
  }

  return [...groups.entries()]
    .map(([id, groupCards]) => {
      const sortedCards = [...groupCards].sort((a, b) => {
        const aOrder = a.seriesOrder ?? a.onboardingOrder ?? a.priority ?? 9999;
        const bOrder = b.seriesOrder ?? b.onboardingOrder ?? b.priority ?? 9999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.title.localeCompare(b.title);
      });
      const statusCounts = countBy(sortedCards, (card) => card.status);
      const isOnboarding = sortedCards.some((card) => card.isOnboarding);
      const hasCourse = sortedCards.some((card) => card.courseId === astrology101CourseId);
      return {
        id,
        title: displayComposerValue(id),
        kind: isOnboarding ? "onboarding" : hasCourse ? "course" : sortedCards.length > 1 ? "series" : "collection",
        cards: sortedCards,
        cardCount: sortedCards.length,
        imageCount: sortedCards.filter(getComposerCardImage).length,
        promptCount: sortedCards.filter((card) => card.artPrompt || card.image_prompt).length,
        lessonCount: sortedCards.filter((card) => getComposerCardOntologyType(card) === "lesson").length,
        quizCount: sortedCards.filter((card) => getComposerCardOntologyType(card) === "quiz").length,
        testCount: sortedCards.filter((card) => getComposerCardOntologyType(card) === "test").length,
        certificationCount: sortedCards.filter((card) => getComposerCardOntologyType(card) === "certification").length,
        statusCounts
      } satisfies ComposerLibraryBox;
    })
    .sort((a, b) => b.cardCount - a.cardCount || a.title.localeCompare(b.title));
}

export function countComposerSignReferenceCards() {
  return Array.isArray(signReference) ? signReference.length : 0;
}

export function listComposerCardsForScope(scope: ComposerCardScope = "all") {
  if (scope === "drafts") return listComposerDraftCards();
  if (scope === "course") return listComposerCourseCards();
  return listComposerCards();
}

export function queryComposerCards(input: ComposerCardQueryInput = {}): ComposerCardQueryResult {
  const scope = input.scope ?? "all";
  const scopedCards = listComposerCardsForScope(scope);
  const normalizedQuery = input.query?.trim().toLowerCase() ?? "";
  const normalizedFeeds = uniqueSorted(input.feeds);
  const normalizedKinds = uniqueSorted(input.kinds);
  const normalizedLanes = uniqueSorted(input.lanes);
  const normalizedStatuses = uniqueSorted(input.statuses);
  const normalizedTags = uniqueSorted(input.tags);
  const feeds = new Set(normalizedFeeds);
  const kinds = new Set(normalizedKinds);
  const lanes = new Set(normalizedLanes);
  const statuses = new Set(normalizedStatuses);
  const tags = new Set(normalizedTags);
  const pageSize = Math.min(Math.max(input.pageSize ?? 48, 12), 96);
  const requestedPage = Math.max(input.page ?? 1, 1);
  const fingerprint = JSON.stringify({
    feeds: normalizedFeeds,
    kinds: normalizedKinds,
    lanes: normalizedLanes,
    query: normalizedQuery,
    scope,
    statuses: normalizedStatuses,
    tags: normalizedTags
  });

  const filtered = scopedCards.filter((card) => {
    const cardFeeds = getComposerCardFeeds(card);
    const lane = card.seriesId ?? card.lane ?? "";
    const searchable = [card.id, card.title, card.subtitle, card.body, card.kind, lane, card.status, ...card.tags]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      (!normalizedQuery || searchable.includes(normalizedQuery)) &&
      (!feeds.size || cardFeeds.some((feed) => feeds.has(feed))) &&
      (!kinds.size || kinds.has(card.kind)) &&
      (!lanes.size || lanes.has(lane)) &&
      (!statuses.size || statuses.has(card.status)) &&
      (!tags.size || card.tags.some((tag) => tags.has(tag)))
    );
  });

  const pageCount = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, filtered.length);
  const cacheKey = `composer_cards:${stableHash(`${fingerprint}:page:${page}:size:${pageSize}:total:${filtered.length}`)}`;

  return {
    cards: filtered.slice(start, start + pageSize),
    totalCards: filtered.length,
    page,
    pageSize,
    pageCount,
    pageState: {
      cacheKey,
      fingerprint,
      hasNextPage: page < pageCount,
      hasPreviousPage: page > 1,
      selectionLimit: pageSize,
      windowEnd: end,
      windowStart: filtered.length ? start + 1 : 0
    },
    facets: {
      feeds: optionCounts(scopedCards, getComposerCardFeeds),
      kinds: optionCounts(scopedCards, (card) => [card.kind]),
      lanes: optionCounts(scopedCards, (card) => [card.seriesId ?? card.lane ?? ""]),
      statuses: optionCounts(scopedCards, (card) => [card.status]),
      tags: optionCounts(scopedCards, (card) => card.tags).slice(0, 24)
    }
  };
}
