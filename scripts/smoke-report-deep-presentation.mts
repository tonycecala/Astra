import assert from "node:assert/strict";

import { deepChapterSubtitles, firstDirectAtomicFact } from "../apps/astra-web/lib/report-deep-presentation";

const focuses = {
  identity: "organizing identity",
  emotions: "emotional clarity",
  relationships: "reciprocity and explicit terms",
  work: "contribution and useful effort",
  drive: "force, pacing, and proportion",
  gifts: "resources available to develop",
  blindSpots: "interpretations needing verification",
  growth: "updating self-understanding",
  integration: "cross-domain decision criteria"
};

const evidence = {
  Identity: [{ label: "Sun", meaning: "Sun; Scorpio; Sun in Scorpio; 2nd house" }],
  Work: [{ label: "Mars", meaning: "Mars; Libra; Mars in Libra; 1st house" }],
  Growth: [{ label: "conjunction_cluster", meaning: "configuration conjunction cluster; rulership provenance" }],
  Integration: [{ label: "mercury sextile saturn", meaning: "mercury sextile saturn; aspect sextile" }]
};

assert.equal(firstDirectAtomicFact(evidence.Identity), "Sun in Scorpio");
assert.equal(firstDirectAtomicFact(evidence.Growth), undefined);
assert.equal(firstDirectAtomicFact([{ label: "Venus", meaning: "Venus in Sagittarius; rulership dispositor" }]), undefined);

const subtitles = deepChapterSubtitles({ reportType: "deep" } as never, evidence, focuses);
assert.deepEqual(subtitles, {
  Identity: "Sun in Scorpio · organizing identity",
  Work: "Mars in Libra · contribution and useful effort",
  Integration: "Mercury sextile saturn · cross-domain decision criteria"
});
assert.deepEqual(deepChapterSubtitles({ reportType: "core" } as never, evidence, focuses), {});

console.log("Deep report presentation subtitle gates passed.");
