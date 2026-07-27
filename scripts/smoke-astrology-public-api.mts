import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import * as astrology from "@astra/astrology";

const exports = Object.keys(astrology).sort();
const fingerprint = createHash("sha256").update(JSON.stringify(exports)).digest("hex");

assert.equal(exports.length, 71);
assert.equal(fingerprint, "5e891d6593e07c7b04a61dc78cd03992697e20667d51ea51a9931c65a6f5417b");

console.log("Astra astrology public API fingerprint passed.");
