import assert from "node:assert/strict";
import { buildComposerAvailability } from "../apps/composer-web/lib/cardLibrary";
import { buildPublicComposerPreview, PUBLIC_COMPOSER_SAMPLE_COUNT } from "../apps/astra-web/lib/public-composer-preview";

const availability = buildComposerAvailability({ requestType: "pool", id: "public", limit: PUBLIC_COMPOSER_SAMPLE_COUNT });
const preview = buildPublicComposerPreview(availability, "Open card");

assert.equal(preview.length, 4, "logged-out preview should stay deliberately small");
assert.equal(availability.collection.totalCards > preview.length, true, "Composer should retain a larger public pool behind the preview");
assert.equal(preview.every(({ item }) => item.source === "composer_public" && item.audience === "public_composer"), true);
assert.equal(preview.every(({ card }) => Boolean(card.imageUrl)), true, "public sample cards should carry inspectable media");
assert.equal(preview[0]?.card.title, "Cleopatra: image, strategy, and survival", "Composer order should remain curated and stable");

const serialized = JSON.stringify(preview);
assert.doesNotMatch(serialized, /userId|userKey|email|birthData/, "public Composer requests and cards must not include private identity data");

console.log("public Composer preview smoke checks passed");
