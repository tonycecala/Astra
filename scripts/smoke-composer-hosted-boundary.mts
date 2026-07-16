import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { getComposerAccessState } from "../apps/composer-web/lib/config";
import { proxy } from "../apps/composer-web/proxy";

const previous = {
  VERCEL_ENV: process.env.VERCEL_ENV,
  COMPOSER_REQUIRE_AUTH: process.env.COMPOSER_REQUIRE_AUTH,
  ASTRA_INTERNAL_API_TOKEN: process.env.ASTRA_INTERNAL_API_TOKEN
};

try {
  process.env.VERCEL_ENV = "preview";
  delete process.env.COMPOSER_REQUIRE_AUTH;
  process.env.ASTRA_INTERNAL_API_TOKEN = "alpha-internal-token-0123456789";
  assert.equal(getComposerAccessState().isLocked, true, "hosted Composer must lock by default");

  const publicResponse = proxy(new NextRequest("https://composer-alpha.example/api/library/availability?requestType=pool&id=public&limit=4"));
  assert.equal(publicResponse.status, 200, "public availability must remain readable by signed-out Astra");

  const privateApiResponse = proxy(new NextRequest("https://composer-alpha.example/api/cards/query"));
  assert.equal(privateApiResponse.status, 401, "Composer operator APIs must reject anonymous hosted access");

  const privatePageResponse = proxy(new NextRequest("https://composer-alpha.example/"));
  assert.equal(privatePageResponse.status, 404, "Composer operator UI must not be publicly discoverable");

  const authorizedResponse = proxy(
    new NextRequest("https://composer-alpha.example/api/cards/query", {
      headers: { "x-astra-internal-token": process.env.ASTRA_INTERNAL_API_TOKEN }
    })
  );
  assert.equal(authorizedResponse.status, 200, "matching internal token should preserve operator integrations");
} finally {
  for (const [name, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

console.log("Composer hosted public/private boundary smoke checks passed");
