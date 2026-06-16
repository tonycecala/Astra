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
      id: "card_public_figure_portrait_cleopatra_image_strategy_and_survival",
      title: "Cleopatra: image, strategy, and survival",
      subtitle: "Image can become leverage.",
      body: "Cleopatra spoke nine languages, commanded fleets, and made her arrivals into political events. Being seen was not vanity - it was leverage. The shadow is what happens when image becomes the only tool left.",
      lane: "myth_and_symbol",
      tone: "ceremonial",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/lucid-dream-real/2026/05/cleopatra-strategy-survival--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_public_figure_portrait_frida_kahlo_self_portrait_as_survival",
      title: "Frida Kahlo: Self-portrait as survival",
      subtitle: "The witness can be chosen.",
      body: "Kahlo painted herself more than fifty times - not out of vanity, but because she decided what the witness would say.",
      lane: "myth_and_symbol",
      tone: "ceremonial",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/hyperreal-mythic/2026/05/frida-kahlo-self-portrait-survival--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_zodiac_reflection_where_aries_lives_in_you",
      title: "Where Aries lives in you",
      subtitle: "Find where you move first.",
      body: "Aries shows up in everyone somewhere. Look for where you move first, want most directly, and run out of patience fastest. That spot is worth knowing.",
      lane: "know_yourself",
      tone: "grounded",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/morning-mysticism/2026/05/aries-lives--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_public_figure_portrait_nina_simone_voice_as_truth_force",
      title: "Nina Simone: voice as truth-force",
      subtitle: "The full self becomes the instrument.",
      body: "Nina Simone played and sang as one thing. Her full self was the instrument, and she did not ask permission before using it.",
      lane: "myth_and_symbol",
      tone: "ceremonial",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/scandinavian-mythic/2026/05/nina-simone-voice-truth-force--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_planet_reflection_ask_your_sun",
      title: "Ask your Sun",
      subtitle: "A question for the self.",
      body: "One question worth sitting with: which does that part of you need more of right now - honesty, rhythm, courage, tenderness, or room to move?",
      lane: "know_yourself",
      tone: "grounded",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/mythic-editorial-portrait/2026/05/sun--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_zodiac_education_aries_is_ignition",
      title: "Aries is ignition",
      subtitle: "The body moves first.",
      body: "Aries is the moment before you talk yourself out of it. The body moves. The mind catches up later.",
      lane: "practice",
      tone: "bright",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/white-paper-celestial/2026/05/aries-ignition--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_house_education_house_2_the_ground_of_value",
      title: "House 2: The ground of value",
      subtitle: "Worth gets tested and built.",
      body: "The 2nd House covers money, body, skills, and the resources you can actually touch. Planets here point to where worth gets tested and built.",
      lane: "practice",
      tone: "bright",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/electric-aquarian-linework/2026/05/2-ground-value--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_chart_literacy_compatibility_is_not_a_score",
      title: "Compatibility is not a score",
      subtitle: "It shows activation, flow, and friction.",
      body: "A compatibility reading does not give you a verdict. It shows where two people activate each other, where things flow, and where they hit the same wall every time.",
      lane: "practice",
      tone: "bright",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/cosmic-bauhaus-signal/2026/05/compatibility-not-score--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_planet_reflection_ask_your_moon",
      title: "Ask your Moon",
      subtitle: "Track what you actually need.",
      body: "Your Moon tracks what you actually need, not what you say you need. Pick one area of your life and ask what this part of you needs more of right now.",
      lane: "know_yourself",
      tone: "grounded",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/faded-dream-real/2026/05/moon--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_zodiac_shadow_the_shadow_of_aries",
      title: "The shadow of Aries",
      subtitle: "Starting is not staying.",
      body: "Aries energy starts things well. The shadow is what happens when it forgets to stay.",
      lane: "know_yourself",
      tone: "grounded",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/sacred-woodcut-alchemy/2026/05/aries--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_planet_reflection_ask_your_saturn",
      title: "Ask your Saturn",
      subtitle: "Notice where the pattern repeats.",
      body: "Saturn is the part of you that keeps score. It notices where you keep saying you will do something differently and then do not.",
      lane: "know_yourself",
      tone: "grounded",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/nocturne-constellation-manuscript/2026/05/saturn--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    },
    {
      id: "card_planet_reflection_ask_your_uranus",
      title: "Ask your Uranus",
      subtitle: "Find the self you keep postponing.",
      body: "Uranus is the part of you that gets restless when something has been too small for too long. It shows up as the version of yourself you keep postponing.",
      lane: "know_yourself",
      tone: "grounded",
      ctaLabel: "Open",
      ctaAction: "open",
      imageUrl: "https://media.astraportrait.com/stream/cards/neon-oracular-signal/2026/05/uranus--v2-r1.jpg?v=openai-v2-20260526-r1",
      publishedAt: now
    }
  ],
  streamItems: [
    { id: "stream_001", cardId: "card_public_figure_portrait_cleopatra_image_strategy_and_survival", kind: "card", position: 0, status: "published", audience: "all" },
    { id: "stream_002", cardId: "card_public_figure_portrait_frida_kahlo_self_portrait_as_survival", kind: "card", position: 1, status: "published", audience: "all" },
    { id: "stream_003", cardId: "card_zodiac_reflection_where_aries_lives_in_you", kind: "card", position: 2, status: "published", audience: "all" },
    { id: "stream_004", cardId: "card_public_figure_portrait_nina_simone_voice_as_truth_force", kind: "card", position: 3, status: "published", audience: "all" },
    { id: "stream_005", cardId: "card_planet_reflection_ask_your_sun", kind: "card", position: 4, status: "published", audience: "all" },
    { id: "stream_006", cardId: "card_zodiac_education_aries_is_ignition", kind: "card", position: 5, status: "published", audience: "all" },
    { id: "stream_007", cardId: "card_house_education_house_2_the_ground_of_value", kind: "card", position: 6, status: "published", audience: "all" },
    { id: "stream_008", cardId: "card_chart_literacy_compatibility_is_not_a_score", kind: "card", position: 7, status: "published", audience: "all" },
    { id: "stream_009", cardId: "card_planet_reflection_ask_your_moon", kind: "card", position: 8, status: "published", audience: "all" },
    { id: "stream_010", cardId: "card_zodiac_shadow_the_shadow_of_aries", kind: "card", position: 9, status: "published", audience: "all" },
    { id: "stream_011", cardId: "card_planet_reflection_ask_your_saturn", kind: "card", position: 10, status: "published", audience: "all" },
    { id: "stream_012", cardId: "card_planet_reflection_ask_your_uranus", kind: "card", position: 11, status: "published", audience: "all" }
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
