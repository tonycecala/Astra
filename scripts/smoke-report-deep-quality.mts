import assert from "node:assert/strict";

import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_REPORT_MODEL_PROFILE_ENV,
  ASTRA_REPORT_WRITER_ENV,
  DEBUG_MODEL_REPORT_WRITER,
  LOCAL_CHART_ROUTINE_ENGINE,
  buildAstrologyReportResultAsync
} from "@astra/astrology";
import { astrologyReportRequestSchema } from "@astra/contracts";

const headings = ["Identity", "Emotions", "Relationships", "Work", "Drive", "Gifts", "Blind Spots", "Growth", "Integration"];
const request = astrologyReportRequestSchema.parse({
  id: "51111111-1111-4111-8111-111111111111",
  userId: "52222222-2222-4222-8222-222222222222",
  chartRequestId: "53333333-3333-4333-8333-333333333333",
  reportType: "deep",
  subjectName: "Deep Quality Fixture",
  birthData: { date: "1961-05-23", time: "09:30", birthTimeKnown: true, timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 },
  source: "self",
  status: "queued",
  costCredits: 10,
  reportBasis: {
    schemaVersion: 1,
    type: "natal",
    chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" },
    primary: {
      chartRequestId: "53333333-3333-4333-8333-333333333333",
      subjectType: "self",
      subjectId: "52222222-2222-4222-8222-222222222222",
      subjectName: "Deep Quality Fixture",
      birthData: { date: "1961-05-23", time: "09:30", birthTimeKnown: true, timezone: "America/Chicago", location: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 }
    }
  },
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z"
});

const env = {
  [ASTRA_EPHEMERIS_ENGINE_ENV]: LOCAL_CHART_ROUTINE_ENGINE,
  [ASTRA_REPORT_WRITER_ENV]: DEBUG_MODEL_REPORT_WRITER,
  [ASTRA_REPORT_MODEL_PROFILE_ENV]: "production",
  ASTRA_OPENROUTER_API_KEY: "test-key"
};

function prose(title: string, words: number, timingFailure = false) {
  const opening = title === "Identity"
    ? "Your Gemini Sun gives the identity chapter a clear center."
    : title === "Integration" && timingFailure
      ? "This natal pattern is currently active and defines this season."
      : `${title} asks a distinct human question and offers a grounded present choice.`;
  const sentence = "This chapter develops its own psychological tension, practical consequence, useful recognition, and concrete next move without repeating another chapter's lesson.";
  const parts = [opening];
  while (parts.join(" ").split(/\s+/).length < words) parts.push(sentence);
  return parts.join(" ");
}

function markdown(depth: "complete" | "shallow", timingFailure = false) {
  return headings.map((title) => {
    const words = depth === "shallow" ? (title === "Identity" ? 400 : 140) : title === "Identity" ? 400 : title === "Integration" ? 240 : 310;
    return `## ${title}\n\n${prose(title, words, timingFailure && title === "Integration")}`;
  }).join("\n\n");
}

function responseFor(content: string, capture?: (prompt: string) => void) {
  return async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { messages?: Array<{ content?: string }> };
    capture?.(body.messages?.map((message) => message.content ?? "").join("\n") ?? "");
    return new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2, cost: 0 } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
}

let prompt = "";
const completed = await buildAstrologyReportResultAsync(request, {
  env,
  fetchImpl: responseFor(markdown("complete"), (value) => { prompt = value; })
});
assert.equal(completed.status, "completed");
assert.match(prompt, /Emotions, Relationships, and Work should each be 300-425 words/);
assert.match(prompt, /Integration must synthesize enduring natal patterns/);

const shallow = await buildAstrologyReportResultAsync(request, { env, fetchImpl: responseFor(markdown("shallow")) });
assert.equal(shallow.status, "failed");
assert.match(shallow.error ?? "", /Deep (?:Emotions|Report) should be at least/);

const falseTiming = await buildAstrologyReportResultAsync(request, { env, fetchImpl: responseFor(markdown("complete", true)) });
assert.equal(falseTiming.status, "failed");
assert.match(falseTiming.error ?? "", /must not imply current timing/);

console.log("Deep Report depth and natal timing quality checks passed.");
