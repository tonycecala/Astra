import { type FoundationSeed, foundationSeedSchema } from "@astra/contracts";

const now = "2026-06-01T12:00:00.000Z";

export const foundationSeed: FoundationSeed = foundationSeedSchema.parse({
  user: {
    id: "user_founder",
    email: "founder@example.com",
    displayName: "Astra Founder",
    role: "customer",
    onboardingStatus: "complete",
    starBalance: 42,
    createdAt: now
  },
  cards: [
    {
      id: "card_river",
      title: "The River Keeps Moving",
      subtitle: "A calm signal for steady progress.",
      body: "A river does not hurry, but it keeps its direction. Today asks for steady motion rather than dramatic force.",
      lane: "myth_and_symbol",
      tone: "calm",
      ctaLabel: "Reflect",
      ctaAction: "reflect",
      imageUrl: "/stream/river.svg",
      publishedAt: now
    },
    {
      id: "card_mirror",
      title: "The Mirror Gives Shape",
      subtitle: "Notice what becomes easier to name.",
      body: "Some truths become useful only after they become visible. Let one pattern come into focus without rushing to fix it.",
      lane: "know_yourself",
      tone: "grounded",
      ctaLabel: "Save",
      ctaAction: "save",
      imageUrl: "/stream/mirror.svg",
      publishedAt: now
    },
    {
      id: "card_star_gift",
      title: "A Small Star Credit",
      subtitle: "A symbolic reward for returning.",
      body: "Astra keeps value legible. Stars mark useful actions, meaningful progress, and future gifts.",
      lane: "gift",
      tone: "bright",
      ctaLabel: "View gifts",
      ctaAction: "claim",
      imageUrl: "/stream/stars.svg",
      publishedAt: now
    },
    {
      id: "card_breath_practice",
      title: "Three Quiet Breaths",
      subtitle: "A practical pause for returning to yourself.",
      body: "Before the next task, take three quiet breaths and notice what changed. Small practices count when they are repeatable.",
      lane: "practice",
      tone: "ceremonial",
      ctaLabel: "Mark complete",
      ctaAction: "reflect",
      imageUrl: "/stream/breath.svg",
      publishedAt: now
    },
    {
      id: "card_today_signal",
      title: "Today Has One Clean Signal",
      subtitle: "Choose the useful thread.",
      body: "Not every signal deserves the same attention. Let one useful thread become visible, then let the rest stay quiet.",
      lane: "today",
      tone: "grounded",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "/stream/today.svg",
      publishedAt: now
    }
  ],
  streamItems: [
    { id: "stream_001", cardId: "card_river", kind: "card", position: 0, status: "published", audience: "all" },
    { id: "stream_002", cardId: "card_mirror", kind: "card", position: 1, status: "published", audience: "all" },
    { id: "stream_003", cardId: "card_star_gift", kind: "card", position: 2, status: "published", audience: "all" },
    { id: "stream_004", cardId: "card_breath_practice", kind: "card", position: 3, status: "published", audience: "all" },
    { id: "stream_005", cardId: "card_today_signal", kind: "card", position: 4, status: "published", audience: "all" }
  ],
  achievements: [
    {
      id: "achievement_first_arrival",
      userId: "user_founder",
      title: "First Arrival",
      description: "Opened the clean-start Astra stream.",
      earnedAt: now,
      starReward: 7
    }
  ],
  allies: [
    {
      id: "ally_the_witness",
      userId: "user_founder",
      name: "The Witness",
      kind: "archetype",
      relationship: "Steady observer",
      note: "Helps separate signal from noise.",
      createdAt: now
    }
  ],
  artifacts: [
    {
      id: "artifact_foundation_note",
      userId: "user_founder",
      title: "Foundation Note",
      kind: "note",
      summary: "A saved marker for Astra's first stable subassembly.",
      createdAt: now
    }
  ],
  gifts: [
    {
      id: "gift_star_bundle",
      code: "STARTER_STARS",
      name: "Starter Stars",
      description: "A small symbolic balance for testing gifts and value flow.",
      starCost: 12,
      active: true
    }
  ],
  starTransactions: [
    {
      id: "stars_seed_balance",
      userId: "user_founder",
      amount: 42,
      direction: "earned",
      reason: "Clean-start seed balance",
      createdAt: now
    }
  ]
});

export function getFoundationSeed() {
  return foundationSeed;
}
