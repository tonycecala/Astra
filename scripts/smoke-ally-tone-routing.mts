import { allyRelationshipTags, normalizeAllyRelationshipTag } from "@astra/contracts";
import { synastryToneSnapshot } from "@astra/astrology";

if (allyRelationshipTags.length !== 22 || allyRelationshipTags.includes("Self" as never)) {
  throw new Error("The Ally chooser must contain the 22 canonical non-Self tags.");
}

for (const tag of allyRelationshipTags) {
  const exact = synastryToneSnapshot({ relationship: tag });
  const lower = synastryToneSnapshot({ relationship: tag.toLocaleLowerCase() });
  if (exact.normalizedTag !== tag || lower.normalizedTag !== tag || normalizeAllyRelationshipTag(tag) !== tag) {
    throw new Error(`Canonical and legacy casing did not normalize identically for ${tag}.`);
  }
}

const policies = new Map([
  ["Lover", "lead-romantic-sexual"],
  ["Spouse", "allow-full-romantic"],
  ["Companion", "allow-full-romantic"],
  ["Ex", "allow-full-romantic"],
  ["Friend", "allow-adult-overtones"]
]);
for (const tag of allyRelationshipTags) {
  const expected = policies.get(tag) ?? "prohibit";
  if (synastryToneSnapshot({ relationship: tag }).romanticLanguage !== expected) {
    throw new Error(`${tag} did not route to ${expected}.`);
  }
}
if (synastryToneSnapshot({ relationship: "Child" }).structuralLens !== "family-caregiving-child") {
  throw new Error("Child must route through the caregiving-safe structural lens.");
}
const unknown = synastryToneSnapshot({ relationship: "Steady observer" });
if (unknown.normalizedTag !== "unknown" || unknown.structuralLens !== "neutral" || unknown.authoredRelationship !== "Steady observer") {
  throw new Error("Unknown legacy labels must retain display text and route neutrally.");
}

console.log("Ally tone routing smoke passed for all canonical and legacy policies.");
