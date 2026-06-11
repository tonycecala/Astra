import { z } from "zod";

const idSchema = z.string().min(1);
const isoDateSchema = z.string().datetime();

export const userSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.enum(["customer", "operator", "admin"]).default("customer"),
  onboardingStatus: z.enum(["pending", "complete"]).default("pending"),
  starBalance: z.number().int().nonnegative().default(0),
  createdAt: isoDateSchema
});

export const cardSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  body: z.string().min(1),
  lane: z.enum(["today", "know_yourself", "myth_and_symbol", "practice", "gift"]),
  tone: z.enum(["calm", "bright", "grounded", "ceremonial"]).default("grounded"),
  ctaLabel: z.string().min(1).optional(),
  ctaAction: z.enum(["open", "save", "reflect", "claim"]).optional(),
  imageUrl: z.string().min(1).optional(),
  publishedAt: isoDateSchema
});

export const streamItemSchema = z.object({
  id: idSchema,
  cardId: idSchema,
  kind: z.enum(["card", "achievement", "artifact", "gift", "ally"]),
  position: z.number().int().nonnegative(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  audience: z.enum(["all", "new_user", "returning_user"]).default("all")
});

export const achievementSchema = z.object({
  id: idSchema,
  userId: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  earnedAt: isoDateSchema.optional(),
  starReward: z.number().int().nonnegative().default(0)
});

export const allySchema = z.object({
  id: idSchema,
  userId: idSchema,
  name: z.string().min(1),
  kind: z.enum(["guide", "mentor", "ancestor", "archetype", "person"]),
  relationship: z.string().min(1),
  note: z.string().min(1).optional(),
  createdAt: isoDateSchema
});

export const artifactSchema = z.object({
  id: idSchema,
  userId: idSchema,
  title: z.string().min(1),
  kind: z.enum(["report", "reflection", "chart", "note", "saved_card"]),
  summary: z.string().min(1),
  createdAt: isoDateSchema
});

export const giftSchema = z.object({
  id: idSchema,
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  starCost: z.number().int().nonnegative(),
  active: z.boolean().default(true)
});

export const starTransactionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  amount: z.number().int(),
  direction: z.enum(["earned", "purchased", "spent", "gifted", "adjusted", "refunded"]),
  reason: z.string().min(1),
  createdAt: isoDateSchema
});

export type AstraUser = z.infer<typeof userSchema>;
export type AstraCard = z.infer<typeof cardSchema>;
export type StreamItem = z.infer<typeof streamItemSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type Ally = z.infer<typeof allySchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type Gift = z.infer<typeof giftSchema>;
export type StarTransaction = z.infer<typeof starTransactionSchema>;

export const foundationSeedSchema = z.object({
  user: userSchema,
  cards: z.array(cardSchema).min(1),
  streamItems: z.array(streamItemSchema).min(1),
  achievements: z.array(achievementSchema),
  allies: z.array(allySchema),
  artifacts: z.array(artifactSchema),
  gifts: z.array(giftSchema),
  starTransactions: z.array(starTransactionSchema)
});

export type FoundationSeed = z.infer<typeof foundationSeedSchema>;
