import { buildSynastryV3EvidenceIndex, buildSynastryV3Prompt, synastryToneSnapshot } from "@astra/astrology";

const packet = buildSynastryV3EvidenceIndex([
  { title: "Attraction", evidenceBullets: [{ label: "A", meaning: "first" }, { label: "B", meaning: "second" }] },
  { title: "Friction", evidenceBullets: [{ label: "B", meaning: "second" }, { label: "C", meaning: "third" }] }
]);
if (packet.length !== 3 || packet.map((row) => row.id).join(",") !== "S01,S02,S03") {
  throw new Error("V3 packet did not preserve order, deduplicate labels, or assign stable IDs.");
}
if (packet[1]?.evidenceJobs.join(",") !== "Attraction,Friction") {
  throw new Error("V3 packet did not retain every evidence job for a deduplicated signal.");
}
const prompt = buildSynastryV3Prompt({
  readerName: "Tony",
  allyName: "Cheyenne",
  tone: synastryToneSnapshot({ allyId: "ally_1", relationship: "Lover" }),
  evidenceIndex: packet
});
if (/saved report|prior portrait|complete inventory/i.test(prompt)) {
  throw new Error("V3 writer prompt referenced a forbidden writer input path.");
}
if (!prompt.includes("S01") || !prompt.includes("exactly six Markdown chapters")) {
  throw new Error("V3 writer prompt did not receive the stable selected packet and six-chapter contract.");
}

console.log("Synastry V3 packet smoke passed without padding or saved-report input.");
