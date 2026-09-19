import assert from "node:assert/strict";
import { astrologyReportRequestSchema, reportGenerationMetadataSchema } from "@astra/contracts";
import { buildAstrologyReportResult, buildAstrologyReportResultAsync, buildPortraitV4Evidence, ASTRA_PORTRAITS_V4_PROMPT_VERSION } from "@astra/astrology";
import { applyPortraitV4Edits, editPortraitV4Draft, portraitV4OriginAdvisories, portraitV4Prompt, portraitV4ReviewPrompt, validatePortraitV4Draft } from "../packages/astrology/src/report/portraitsV4";
import { REPORT_PRODUCT_ORDER, reportProductFor } from "../apps/astra-web/lib/reportCatalog";

const birthData = { date: "1990-04-05", time: "09:00", timezone: "America/New_York", latitude: 40.7128, longitude: -74.006, location: "New York", birthTimeKnown: true };
const base = astrologyReportRequestSchema.parse({ id: "v4-offline", userId: "offline", reportType: "personal", subjectName: "Test Reader", birthData, status: "queued", source: "self", createdAt: "2026-09-18T00:00:00Z", updatedAt: "2026-09-18T00:00:00Z", reportBasis: { schemaVersion: 2, type: "natal", primary: { chartRequestId: "offline-chart", subjectType: "self", subjectName: "Test Reader", birthData, calculationMode: "full" }, chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" } } });
const env = { ASTRA_EPHEMERIS_ENGINE: "local-chart-routine", ASTRA_REPORT_WRITER: "debug-model-writer", ASTRA_REPORT_MODEL_PROFILE: "production", ASTRA_OPENROUTER_API_KEY: "offline-not-a-key" };
assert.deepEqual(REPORT_PRODUCT_ORDER, ["personal", "synastry", "progressed"]);
assert.equal(reportProductFor("personal").costStars, 10);
assert.equal(reportProductFor("synastry").costStars, 10);
assert.equal(reportProductFor("progressed").costStars, 5);
assert.equal(buildAstrologyReportResult(base).status,"failed","A sync call must not substitute default prose");
const unsupportedRoute=await buildAstrologyReportResultAsync(base,{env:{...env,ASTRA_REPORT_MODEL_PROVIDER:"openai",ASTRA_REPORT_MODEL:"gpt-5",ASTRA_OPENAI_API_KEY:"offline-key"},fetchImpl:async()=>{throw new Error("An unqualified route must be rejected before any call");}});
assert.equal(unsupportedRoute.status,"failed");
assert.match(unsupportedRoute.error ?? "",/qualified OpenRouter/);

// Deliberately synthetic fixture tests plumbing, NEVER literary quality.
function draft() {
  return { thread: "A private thread linking distinct chapters with no reused saved prose.", sections: Array.from({ length: 4 }, (_,i) => ({ title: `Chapter ${i + 1}`, evidenceIds: ["P01"], body: Array.from({length:3}, (_,j) => `You can approach topic ${i} through lens ${j}. ` + Array.from({length: 18}, (_,k) => `This distinct example ${i}-${j}-${k} supports reflection.`).join(" ")).join("\n\n") })) };
}
for (const reportType of ["personal", "progressed"] as const) {
  const request = astrologyReportRequestSchema.parse({ ...base, reportType, reportBasis: { ...base.reportBasis, type: reportType === "personal" ? "natal" : "progressed", ...(reportType === "progressed" ? { asOfDate: "2026-09-18" } : {}) } });
  const evidence = buildPortraitV4Evidence(request);
  assert(evidence.length > 4);
  const prompt = portraitV4Prompt(request, evidence);
  assert(!prompt.includes("State F1"));
  assert(!prompt.includes("Approved paragraph claim plan"));
  assert(prompt.includes("FIRST PLAN"));
  assert(prompt.includes("INTERPRETIVE LICENSE:"));
  assert(prompt.includes("READABILITY:"));
  assert(prompt.includes("No mechanical ban"));
  assert(prompt.includes("IDEA ECONOMY:"));
  assert(prompt.includes("one-sentence chapter purposes"));
  assert(prompt.includes("650-2200"));
  assert(!prompt.includes("1400-1800"));
  assert.equal(prompt.includes("PRACTICAL LIFE CHAPTER:"), reportType === "progressed");
  assert.equal(prompt.includes("PERSONAL PORTRAIT:"), reportType === "personal");
  const contextualReview = portraitV4ReviewPrompt({ ...request, question: "I recently changed jobs." }, evidence, draft());
  assert(contextualReview.includes("I recently changed jobs."), "The gate must see authorized context, not falsely label it invented biography.");
  assert(contextualReview.includes("Intensity or discomfort alone is not grounds"));
  assert(contextualReview.includes("compare the conclusions of chapters"));
  if (reportType === "progressed") assert(prompt.includes("2026-09-18"));
  assert.equal(portraitV4ReviewPrompt(request,evidence,draft()).includes("SOURCE IDENTITY:"),reportType==="progressed");
  if (reportType === "personal") {
    assert(prompt.includes("PERSONAL PORTRAIT:"));
    assert(contextualReview.includes("specific source, meaning, clarity or coherence problem"));
    assert(contextualReview.includes("Do not invent a defect to give an editor something to do."));
  }
  let calls=0;
  const result = await buildAstrologyReportResultAsync(request, { env, fetchImpl: async (_url,init) => {
    calls++;
    const body=JSON.parse(String(init?.body));
    assert.equal(body.model, calls===1 ? "anthropic/claude-sonnet-4.6" : "anthropic/claude-opus-4.8");
    assert.equal(body.provider.zdr,true);
    assert.equal(body.provider.allow_fallbacks,false);
    assert.equal(body.provider.data_collection,"deny");
    if(calls>1) { assert.equal(body.reasoning.effort,"medium"); assert.equal(body.temperature,undefined); }
    assert(body.messages[0].content.includes(calls===1 ? "Astra Portraits V4" : "independent acceptance gate"));
    if(calls>1) assert.equal(body.messages[0].content.includes("SOURCE IDENTITY:"),reportType==="progressed");
    if(calls===2) assert(!body.messages[0].content.includes("TRUEBYLINE-STYLE DIAGNOSIS:"));
    assert(body.messages[0].content.includes("IDEA ECONOMY:"), "Planning, editing and review must share the reader standard.");
    assert.equal(body.messages[0].content.includes("PRACTICAL LIFE CHAPTER:"), reportType === "progressed");
    const content = calls === 1 ? draft() : { accepted: true, issues: [] };
    return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content:JSON.stringify(content)}}],usage:{prompt_tokens:10,completion_tokens:10,cost:0.001}}));
  }});
  assert.equal(result.status,"completed",result.error);
  assert.equal(calls, 2);
  assert.equal(result.generationMetadata?.promptVersion,ASTRA_PORTRAITS_V4_PROMPT_VERSION);
  assert.equal(result.generationMetadata?.orchestration,"portraits-v4");
  assert.equal(result.generationMetadata?.estimatedSpend, 0.002);
  assert.equal(result.generationMetadata?.portraitsV4?.reviewerModel, "anthropic/claude-opus-4.8");
  assert.equal(result.generationMetadata?.portraitsV4?.editorModel, undefined);
  const parsedMetadata = reportGenerationMetadataSchema.parse(result.generationMetadata);
  assert(parsedMetadata.portraitsV4);
  assert.equal(parsedMetadata.portraitsV4.reviewerModel, "anthropic/claude-opus-4.8");
  assert.equal(parsedMetadata.portraitsV4.editorModel, undefined);
  assert.equal(result.sections.length,4);
  assert(!JSON.stringify(result.sections).includes("P01"));
  assert.equal(result.publicSignal?.summary,"A private portrait is ready to explore.","Public signal must be generic, never private prose or evidence");
}
const evidence=buildPortraitV4Evidence(base);
// Cross-context plumbing tests, not generated literary evidence. No Tony lesson
// or manually edited sample may become a template for unrelated readers.
for (const [subjectName, question, fact] of [
  ["Morgan", "I want to make more time for friends.", "A supplied connection pattern."],
  ["Riley", "I am content with work and want to enjoy a hobby.", "A supplied creative expression pattern."],
  ["Sam", "I need more quiet time.", "A supplied rest and solitude pattern."]
]) {
  const request = astrologyReportRequestSchema.parse({...base, subjectName, question, reportType:"progressed", reportBasis:{...base.reportBasis,type:"progressed",asOfDate:"2026-09-18"}});
  const prompt = portraitV4Prompt(request,[{id:"P01",topic:"Selected theme",fact,meaning:"Interpret this supplied theme only."}]);
  assert(prompt.includes(fact) && prompt.includes(question));
  assert(prompt.includes("do not force work, ambition, approval, intimacy"));
  assert(!/Tony|Cheyenne|Donna|Performer and the Craftsman|Finish Something You Can Use/.test(prompt));
}
function sizedDraft(words: number) {
  const value=draft();
  value.sections.forEach((section,index)=>{
    const count=Math.floor(words/4)+(index<words%4?1:0);
    section.body=Array.from({length:count},(_,i)=>`word${index}_${i}`).join(" ").replace(" ","\n\n");
  });
  return value;
}
const progressedRequest = astrologyReportRequestSchema.parse({ ...base, reportType: "progressed", reportBasis: { ...base.reportBasis, type: "progressed", asOfDate: "2026-09-18" } });
for (const request of [base, progressedRequest]) {
  for (const privatePlan of ["x".repeat(1688), "short", ""]) {
    let planCalls = 0;
    const planned = draft();
    planned.thread = privatePlan;
    const plannedResult = await buildAstrologyReportResultAsync(request, { env, fetchImpl: async () => {
      planCalls++;
      const content = planCalls === 1 ? planned : { accepted: true, issues: [] };
      return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
    } });
    assert.equal(plannedResult.status, "completed", plannedResult.error);
    assert.equal(planCalls, 2, "Long, short, and empty private plans must still reach the mandatory review in two calls.");
    assert.equal(plannedResult.generationMetadata?.portraitsV4?.thread, privatePlan);
    assert.deepEqual(plannedResult.sections.map(({ title, body }) => ({ title, body })), planned.sections.map(({ title, body }) => ({ title, body })));
  }
}
for (const invalidDraft of [
  { ...draft(), thread: 42 },
  { ...draft(), sections: draft().sections.map(({ title, body }) => ({ title, body })) }
] as unknown[]) {
  let invalidPlanCalls = 0;
  const invalidPlan = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
    invalidPlanCalls++;
    return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(invalidDraft) } }], usage: { cost: 0.001 } }));
  } });
  assert.equal(invalidPlan.status, "failed"); assert.equal(invalidPlanCalls, 2, "Wrong-type private plans and missing required evidence source remain rejected.");
}
assert.deepEqual(validatePortraitV4Draft(sizedDraft(650),evidence),[],"Concise complete structure must not be padded to the old 1050-word floor.");
assert(validatePortraitV4Draft(sizedDraft(649),evidence).some(x=>x.includes("650-2200")));
assert.deepEqual(validatePortraitV4Draft(sizedDraft(2200),evidence),[]);
assert(validatePortraitV4Draft(sizedDraft(2201),evidence).some(x=>x.includes("650-2200")));
let formatCalls=0;
const formatRecovered=await buildAstrologyReportResultAsync(progressedRequest,{env,fetchImpl:async()=>{
  formatCalls++;
  const content=formatCalls===1?JSON.stringify(draft()):formatCalls===2?JSON.stringify({accepted:false,issues:["Correct one source claim."]}):formatCalls===3?'{"edits":[':formatCalls===4?'{"edits":[]}':'{"accepted":true,"issues":[]}';
  return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content}}],usage:{cost:0.001}}));
}});
assert.equal(formatRecovered.status,"completed",formatRecovered.error);
assert.equal(formatCalls,5,"One malformed Life editor response reuses the bounded edit retry, without redrafting.");
const astrologyLed = draft();
astrologyLed.sections.forEach((section, sectionIndex) => {
  section.body = section.body.split(/\n\s*\n/).map((paragraph, paragraphIndex) => `Sun-led paragraph ${sectionIndex}-${paragraphIndex}: ${paragraph}`).join("\n\n");
});
assert.equal(astrologyLed.sections.flatMap(section => section.body.split(/\n\s*\n/)).length, 12);
assert.deepEqual(validatePortraitV4Draft(astrologyLed, evidence), [], "Technical paragraph openings are not a source or prose integrity failure.");
let zeroEditCalls = 0;
const zeroEdit = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  zeroEditCalls++;
  const content = zeroEditCalls === 1 ? JSON.stringify(astrologyLed) : JSON.stringify({ accepted: true, issues: [] });
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content } }], usage: { cost: 0.001 } }));
} });
assert.equal(zeroEdit.status, "completed", zeroEdit.error);
assert.equal(zeroEditCalls, 2, "A clean Personal zero-edit pipeline must not pay for an editor or retry technical openings.");
assert.deepEqual(zeroEdit.sections.map(({ title, body }) => ({ title, body })), astrologyLed.sections.map(({ title, body }) => ({ title, body })), "Accepted zero-edit prose must survive unchanged.");
assert(!JSON.stringify(zeroEdit.sections).includes("P01"), "Private evidence IDs must stay out of visible report sections.");
assert(zeroEdit.generationMetadata?.portraitsV4?.evidence?.some(item => item.id === "P01"), "Private evidence trace remains available in generation metadata.");
let invalidEditCalls=0;
const invalidEdits=await buildAstrologyReportResultAsync(progressedRequest,{env,fetchImpl:async()=>{
  invalidEditCalls++;
  const content=invalidEditCalls===1?JSON.stringify(draft()):invalidEditCalls===2?JSON.stringify({accepted:false,issues:["Correct one source claim."]}):'{"edits":[';
  return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content}}],usage:{cost:0.001}}));
}});
assert.equal(invalidEdits.status,"failed");
assert.equal(invalidEditCalls,4,"Repeated malformed Life editing stops at the existing two-edit bound.");
let malformedInitialCalls = 0;
const malformedInitial = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  malformedInitialCalls++;
  const content = malformedInitialCalls === 1 ? "not-json" : malformedInitialCalls === 2 ? draft() : { accepted: true, issues: [] };
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(malformedInitial.status, "completed", malformedInitial.error);
assert.equal(malformedInitialCalls, 3, "A malformed Personal draft gets one bounded writer retry, then review.");
let malformedReviewCalls = 0;
const malformedReview = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  malformedReviewCalls++;
  const content = malformedReviewCalls === 1 ? draft() : "not-json";
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(malformedReview.status, "failed");
assert.equal(malformedReviewCalls, 2, "A malformed Personal review fails closed without cosmetic editing.");
const missingFindingsCalls = { value: 0 };
await assert.rejects(() => editPortraitV4Draft(base, evidence, draft(), async () => { missingFindingsCalls.value++; throw new Error("editor must not be called"); }), /material findings/);
assert.equal(missingFindingsCalls.value, 0, "Personal editing without material findings must fail before any paid call.");
const sourceEdit = { sectionIndex: 0, original: "Your Sun is in Libra.", replacement: "Your Sun is in Aries.", reason: "Corrects the source-supported Sun sign." };
const missingLifeFindingsCalls = { value: 0 };
await assert.rejects(() => editPortraitV4Draft(progressedRequest, evidence, draft(), async () => { missingLifeFindingsCalls.value++; throw new Error("editor must not be called"); }), /material findings/);
assert.equal(missingLifeFindingsCalls.value, 0, "Life editing without material findings must fail before any paid call.");
const unknownTimeData={...birthData,time:undefined,birthTimeKnown:false};
const unknownTime=astrologyReportRequestSchema.parse({...base,birthData:unknownTimeData,reportBasis:{...base.reportBasis,primary:{...base.reportBasis!.primary,birthData:unknownTimeData,calculationMode:"signs-aspects-only"}}});
const unknownTimeEvidence=buildPortraitV4Evidence(unknownTime);
assert(unknownTimeEvidence.length>4);
assert(!unknownTimeEvidence.some(item=>/"house":\d|ascendant|midheaven/i.test(item.fact)),"Unknown birth time must not introduce houses or angles into the writer packet");
const leaked=draft(); leaked.sections[0].body += " PRIVATE evidenceIds P01";
assert(validatePortraitV4Draft(leaked,evidence).some(x=>x.includes("leaked")));
const defensive=draft(); defensive.sections[0].body += " This does not establish a talent. This does not prove a skill. This only means nothing.";
assert(validatePortraitV4Draft(defensive,evidence).some(x=>x.includes("establish")));
const wrong=draft();wrong.sections[0].evidenceIds=["P999"];
assert(validatePortraitV4Draft(wrong,evidence).some(x=>x.includes("unknown")));
const repairDraft = draft();
const repairSpan = "Your Sun is in Libra.";
repairDraft.sections[0].body = repairDraft.sections[0].body.replace("You can approach topic 0 through lens 0.", repairSpan);
assert.match(evidence.find(item => item.id === "P01")?.fact ?? "", /Aries/);
const expectedRepairedDraft = structuredClone(repairDraft);
expectedRepairedDraft.sections[0].body = expectedRepairedDraft.sections[0].body.replace(repairSpan, "Your Sun is in Aries.");
let repairCalls = 0;
const repaired = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async (_url, init) => {
  repairCalls++;
  const body = JSON.parse(String(init?.body)) as { messages?: Array<{ content?: string }> };
  if (repairCalls === 3) {
    assert(body.messages?.[0]?.content?.includes("Your Sun is in Libra conflicts with source P01 Aries"));
    assert(body.messages?.[0]?.content?.includes("This is a targeted repair, not a polishing pass."));
    assert(!body.messages?.[0]?.content?.includes("TRUEBYLINE-STYLE DIAGNOSIS:"));
  }
  const content = repairCalls === 1 ? repairDraft : repairCalls === 2 ? { accepted: false, issues: ["Your Sun is in Libra conflicts with source P01 Aries; correct the sign so the reader receives the supported chart fact."] } : repairCalls === 3 ? { edits: [{ sectionIndex: 0, original: "Your Sun is in Libra.", replacement: "Your Sun is in Aries.", reason: "Corrects the source-supported Sun sign." }] } : { accepted: true, issues: [] };
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(repaired.status, "completed", repaired.error);
assert.equal(repairCalls, 4, "Personal material repair uses writer, review, one editor, and review.");
assert.equal(repaired.generationMetadata?.portraitsV4?.editorModel, "anthropic/claude-opus-4.8");
assert.equal(repaired.generationMetadata?.estimatedSpend, 0.004);
assert(repaired.sections[0]?.body.includes("Your Sun is in Aries."), "The material source repair must change the requested exact span.");
assert(repaired.sections[0]?.body.includes("This distinct example 0-1-0 supports reflection."), "An exact-span repair must preserve unrelated prose.");
assert.deepEqual(repaired.sections.map(({ title, body }) => ({ title, body })), expectedRepairedDraft.sections.map(({ title, body }) => ({ title, body })), "Only the requested source span may change; all other section prose must remain equivalent.");
let lifeRepairCalls = 0;
const lifeRepair = await buildAstrologyReportResultAsync(progressedRequest, { env, fetchImpl: async (_url, init) => {
  lifeRepairCalls++;
  const body = JSON.parse(String(init?.body)) as { messages?: Array<{ content?: string }> };
  if (lifeRepairCalls === 2) {
    assert(body.messages?.[0]?.content?.includes("SOURCE IDENTITY:"));
    assert(body.messages?.[0]?.content?.includes("2026-09-18"));
  }
  if (lifeRepairCalls === 3) {
    assert(body.messages?.[0]?.content?.includes("SOURCE IDENTITY:"));
    assert(body.messages?.[0]?.content?.includes("2026-09-18"));
    assert(body.messages?.[0]?.content?.includes("This is a targeted repair, not a polishing pass."));
    assert(!body.messages?.[0]?.content?.includes("TRUEBYLINE-STYLE DIAGNOSIS:"));
  }
  const content = lifeRepairCalls === 1 ? repairDraft : lifeRepairCalls === 2 ? { accepted: false, issues: ["Your Sun is in Libra conflicts with source P01 Aries; correct the sign."] } : lifeRepairCalls === 3 ? { edits: [sourceEdit] } : { accepted: true, issues: [] };
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(lifeRepair.status, "completed", lifeRepair.error); assert.equal(lifeRepairCalls, 4); assert.equal(lifeRepair.generationMetadata?.portraitsV4?.editorModel, "anthropic/claude-opus-4.8");
for (const verdict of [{ accepted: true, issues: ["A contradictory issue must not accompany acceptance."] }, { accepted: false, issues: ["   "] }]) {
  let inconsistentCalls = 0;
  const inconsistent = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
    inconsistentCalls++;
    const content = inconsistentCalls === 1 ? draft() : verdict;
    return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
  } });
  assert.equal(inconsistent.status, "failed"); assert.equal(inconsistentCalls, 2, "Inconsistent or blank Personal verdicts fail closed before editing.");
}
let recoveredPersonalEditCalls = 0;
const recoveredPersonalEdit = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  recoveredPersonalEditCalls++;
  const content = recoveredPersonalEditCalls === 1 ? repairDraft : recoveredPersonalEditCalls === 2 ? { accepted: false, issues: ["Correct the source-supported Sun sign."] } : recoveredPersonalEditCalls === 3 ? "{\"edits\":[" : recoveredPersonalEditCalls === 4 ? { edits: [sourceEdit] } : { accepted: true, issues: [] };
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(recoveredPersonalEdit.status, "completed", recoveredPersonalEdit.error); assert.equal(recoveredPersonalEditCalls, 5);
let failedPersonalEditCalls = 0;
const failedPersonalEdit = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  failedPersonalEditCalls++;
  const content = failedPersonalEditCalls === 1 ? repairDraft : failedPersonalEditCalls === 2 ? { accepted: false, issues: ["Correct the source-supported Sun sign."] } : "{\"edits\":[";
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(failedPersonalEdit.status, "failed"); assert.equal(failedPersonalEditCalls, 4);
let malformedFinalReviewCalls = 0;
const malformedFinalReview = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  malformedFinalReviewCalls++;
  const content = malformedFinalReviewCalls === 1 ? repairDraft : malformedFinalReviewCalls === 2 ? { accepted: false, issues: ["Correct the source-supported Sun sign."] } : malformedFinalReviewCalls === 3 ? { edits: [sourceEdit] } : "not-json";
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(malformedFinalReview.status, "failed"); assert.equal(malformedFinalReviewCalls, 4); assert.equal(malformedFinalReview.sections.length, 0);
let personalInvalidEditorCalls = 0;
const personalInvalidEditor = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  personalInvalidEditorCalls++;
  const content = personalInvalidEditorCalls === 1 ? draft() : personalInvalidEditorCalls === 2 ? { accepted: false, issues: ["Correct one source claim."] } : personalInvalidEditorCalls === 3 ? "{\"edits\":[" : personalInvalidEditorCalls === 4 ? { edits: [{ sectionIndex: 0, original: "You can approach topic 0 through lens 0.", replacement: "You can approach topic 0 through lens 0 with a source-grounded distinction.", reason: "Corrects one source claim." }] } : { accepted: true, issues: [] };
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(personalInvalidEditor.status, "completed", personalInvalidEditor.error); assert.equal(personalInvalidEditorCalls, 5);
let personalEditorFailureCalls = 0;
const personalEditorFailure = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  personalEditorFailureCalls++;
  const content = personalEditorFailureCalls === 1 ? draft() : personalEditorFailureCalls === 2 ? { accepted: false, issues: ["Correct one source claim."] } : "{\"edits\":[";
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(personalEditorFailure.status, "failed"); assert.equal(personalEditorFailureCalls, 4);

let rejectedCalls = 0;
const rejected = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  rejectedCalls++;
  const content = rejectedCalls === 1 ? draft() : rejectedCalls % 2 === 0 ? { accepted: false, issues: ["Invented personal history"] } : { edits: [] };
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(rejected.status, "failed"); assert.equal(rejectedCalls, 6); assert.equal(rejected.sections.length, 0);
assert.equal(rejected.generationMetadata?.estimatedSpend, 0.006);
let emptyVerdictCalls = 0;
const emptyVerdict = await buildAstrologyReportResultAsync(base, { env, fetchImpl: async () => {
  emptyVerdictCalls++;
  const content = emptyVerdictCalls === 1 ? draft() : { accepted: false, issues: [] };
  return new Response(JSON.stringify({ provider: "Amazon Bedrock", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }], usage: { cost: 0.001 } }));
} });
assert.equal(emptyVerdict.status, "failed"); assert.equal(emptyVerdictCalls, 2, "False with blank findings fails closed without cosmetic editing.");
const original=draft();
const span="You can approach topic 0 through lens 0.";
const edited=applyPortraitV4Edits(original,{edits:[{sectionIndex:0,original:span,replacement:"A more precise interpretation belongs here.",reason:"Synthetic exact replacement test"}]});
assert.equal(edited.sections[0].body,original.sections[0].body.replace(span,"A more precise interpretation belongs here."));
assert.deepEqual(edited.sections.slice(1),original.sections.slice(1));
assert.equal(applyPortraitV4Edits(original,{edits:[{sectionIndex:0,original:"topic 0 through lens 0",replacement:"a focused topic",reason:"Unique short span"}]}).sections[0].body.includes("a focused topic"),true);
assert.throws(()=>applyPortraitV4Edits(original,{edits:[{sectionIndex:0,original:" ",replacement:"x",reason:"blank"}]}),/blank/);
assert.throws(()=>applyPortraitV4Edits(original,{edits:[{sectionIndex:0,original:"This",replacement:"That",reason:"ambiguous short span"}]}),/exactly once/);
assert.throws(()=>applyPortraitV4Edits(original,{edits:[{sectionIndex:0,original:"This span does not exist in the source",replacement:"x",reason:"invalid"}]}),/exactly once/);
assert.throws(()=>applyPortraitV4Edits(original,{edits:[{sectionIndex:0,original:span,replacement:"x",reason:"first"},{sectionIndex:0,original:span,replacement:"y",reason:"overlap"}]}),/overlap/);
assert.throws(()=>applyPortraitV4Edits(original,{edits:[{sectionIndex:0,original:span,replacement:"word ".repeat(500),reason:"excessive"}]}),/25%/);
for(const body of ["A hard-won self-protection that learned early to be careful about what it hoped for.","There is a quality of someone who has been through the full arc of self-expression.","You were raised to keep your feelings private.","You have already mastered the art of emotional distance."]) {
  assert(portraitV4OriginAdvisories({...original,sections:[{...original.sections[0],body}]}).length>0);
}
for(const body of ["Wanting closeness and wanting room to think can coexist.","If you learned early to hide a feeling, consider what sharing it would ask of you now.","Imagine growing up with more room to speak; what changes in that imagined room?"]) {
  assert.equal(portraitV4OriginAdvisories({...original,sections:[{...original.sections[0],body}]}).length,0);
}
let advisoryCalls=0;
const nearMiss=draft(); nearMiss.sections[0].body += " You learned early to leave room for reflection.";
const acceptedWithAdvice=await buildAstrologyReportResultAsync(base,{env,fetchImpl:async()=>{
  advisoryCalls++;
  return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content:JSON.stringify(advisoryCalls===1?nearMiss:{accepted:true,issues:[]})}}],usage:{cost:0.001}}));
}});
assert.equal(acceptedWithAdvice.status,"completed",acceptedWithAdvice.error);
assert.equal(advisoryCalls,2,"An advisory must not trigger another paid editorial cycle");
assert.equal(acceptedWithAdvice.generationMetadata?.portraitsV4?.advisories?.length,1);
assert(acceptedWithAdvice.sections[0].body.includes("learned early"),"Do not silently rewrite an accepted near miss");
console.log("PASS V4 schema-2 production dispatch, whole-portrait prompt, independent gate, bounded rejection, private trace, date, cost and three-topic catalog. Synthetic fixture is not quality evidence.");
