import assert from "node:assert/strict";
import { BirthPlaceSearchUnavailableError, searchBirthPlaces } from "@astra/astrology";

const providerEnv = { ASTRA_PLACE_SEARCH_PROVIDER: "open-meteo" };

const success = await searchBirthPlaces(
  { query: "Cedar Rapids", limit: 5 },
  providerEnv,
  async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin + url.pathname, "https://geocoding-api.open-meteo.com/v1/search");
    assert.equal(url.searchParams.get("name"), "Cedar Rapids");
    assert.equal(url.searchParams.get("count"), "5");
    assert.equal(init?.headers && new Headers(init.headers).get("accept"), "application/json");
    assert.ok(init?.signal, "Provider calls must have a timeout signal.");

    return Response.json({
      results: [
        {
          id: 4850751,
          name: "Cedar Rapids",
          latitude: 41.9831,
          longitude: -91.6693,
          timezone: "America/Chicago",
          country: "United States",
          admin1: "Iowa"
        },
        { id: "invalid-row", name: "Missing coordinates", country: "United States", timezone: "America/Chicago" }
      ]
    });
  }
);

assert.deepEqual(success, {
  provider: "open-meteo",
  results: [
    {
      id: "open-meteo:4850751",
      label: "Cedar Rapids, Iowa, United States",
      timezone: "America/Chicago",
      latitude: 41.9831,
      longitude: -91.6693,
      provider: "open-meteo"
    }
  ]
});

await assert.rejects(
  () => searchBirthPlaces({ query: "Cedar Rapids", limit: 5 }, providerEnv, async () => new Response("upstream failure", { status: 503 })),
  (error: unknown) => error instanceof BirthPlaceSearchUnavailableError && error.message === "Birth place search is temporarily unavailable."
);

const empty = await searchBirthPlaces(
  { query: "No Such Place", limit: 5 },
  providerEnv,
  async () => Response.json({})
);
assert.deepEqual(empty, { provider: "open-meteo", results: [] });

console.log("Open-Meteo birth-place provider checks passed.");
