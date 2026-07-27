import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { reportRuleCatalog } from "../packages/astrology/src/report/rules/catalog";

const sha256 = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

assert.equal(reportRuleCatalog.schemaVersion, 1);
assert.equal(sha256(reportRuleCatalog.voice.plainspoken), "c6ef70eb6c0e49c2b45f2c0688e0bcb1dd02f148158538b148cc4a7588591387");
assert.equal(sha256(reportRuleCatalog.voice.interpretive), "f1c14a4d47f7c19cb65dbe1fa303f8890b046baa20878932b43970c376e99021");
assert.equal(sha256(reportRuleCatalog.safety), "4f18c6409e2e77cdb3a569669ccc7558f2ee11d99e2e09dab4e123c11df9c78b");
assert.equal(sha256(reportRuleCatalog.evidence), "472a8869a4f9bc7acd9e615834dff1eac4f27ff28d2cd8d697480edf9017c0ca");
assert.equal(sha256(reportRuleCatalog.voice.sectionClosings), "31e489f6202dc64764bdb1436ca8023ee3eb4fadb08818f62ec97a5674539145");
assert.equal(sha256(reportRuleCatalog.evaluation), "922e79b503990216d8c25f9a39a9c487af74e44b94b8ec144d82b803a4e14d70");

console.log("Astra report-rule catalog schema and behavior fingerprints passed.");
