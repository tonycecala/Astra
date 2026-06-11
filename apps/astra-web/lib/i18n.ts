export const ui = {
  metadata: {
    title: "Astra",
    description: "A clean symbolic stream reader foundation."
  },
  nav: {
    journey: "Journey",
    allies: "Allies",
    self: "Self",
    library: "Library",
    gifts: "Gifts",
    primaryNavigation: "Primary navigation",
    mobileNavigation: "Mobile navigation"
  },
  shell: {
    brand: "Astra",
    tagline: "Clean start foundation"
  },
  theme: {
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode"
  },
  journey: {
    eyebrow: "Journey",
    title: "A living stream",
    intro: "Meaningful cards, reflections, achievements, allies, artifacts, and gifts begin here as one calm reader surface.",
    seededStream: "Seeded stream",
    noLegacyData: "No legacy data",
    cardCount: (count: number) => `${count} cards`,
    streamCardsLabel: "Stream cards",
    laneFilterLabel: "Stream lanes",
    allLanes: "All",
    savedCount: (count: number) => `${count} saved`,
    reflectedCount: (count: number) => `${count} reflected`,
    openCard: "Open card",
    saveCard: "Save",
    savedCard: "Saved",
    reflectCard: "Reflect",
    reflectedCard: "Reflected",
    closeDetail: "Close detail",
    detailLabel: "Card detail",
    emptyTitle: "No cards in this lane",
    emptyBody: "Choose another lane to keep reading.",
    lanes: {
      today: "Today",
      know_yourself: "Know yourself",
      myth_and_symbol: "Myth and symbol",
      practice: "Practice",
      gift: "Gift"
    }
  },
  allies: {
    eyebrow: "Allies",
    title: "Companions with clear names",
    intro: "People, guides, mentors, archetypes, and symbolic companions stay legible as first-class records.",
    listLabel: "Allies list"
  },
  self: {
    eyebrow: "Self",
    intro: "The account home is small on purpose: identity, onboarding state, achievements, and star balance.",
    summaryLabel: "Self summary",
    stars: "Stars",
    starsDescription: "Seed balance for value-flow testing.",
    onboarding: "Onboarding",
    onboardingDescription: "Clean account state without legacy migration requirements.",
    achievement: "Achievement"
  },
  library: {
    eyebrow: "Library",
    title: "Artifacts worth keeping",
    intro: "Saved reports, reflections, notes, chart objects, and cards live behind one simple artifact contract.",
    listLabel: "Artifacts list"
  },
  gifts: {
    eyebrow: "Gifts",
    title: "Stars stay accountable",
    intro: "Gifts and star transactions are symbolic, but their accounting is explicit from the first slice.",
    listLabel: "Gifts and star transactions",
    starCost: (count: number) => `${count} stars`,
    starAmount: (count: number) => `${count} stars`
  },
  login: {
    eyebrow: "Login",
    title: "Better Auth boundary",
    intro: "The clean-start foundation exposes the Better Auth route and keeps UI auth flows ready for the next authenticated slice.",
    infrastructureTitle: "Authentication is wired as infrastructure",
    infrastructureDescription: "Email/password, verification codes, and reset delivery route through Better Auth and the shared email boundary."
  }
} as const;
