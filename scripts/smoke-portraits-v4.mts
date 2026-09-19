import assert from "node:assert/strict";
import { astrologyReportRequestSchema } from "@astra/contracts";
import { buildAstrologyReportResult, buildAstrologyReportResultAsync, buildPortraitV4Evidence, ASTRA_PORTRAITS_V4_PROMPT_VERSION } from "@astra/astrology";
import { applyPortraitV4Edits, portraitV4OriginAdvisories, portraitV4Prompt, portraitV4ReviewPrompt, validatePortraitV4Draft } from "../packages/astrology/src/report/portraitsV4";
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
  let calls=0;
  const result = await buildAstrologyReportResultAsync(request, { env, fetchImpl: async (_url,init) => {
    calls++;
    const body=JSON.parse(String(init?.body));
    assert.equal(body.model, calls===1 ? "anthropic/claude-sonnet-4.6" : "anthropic/claude-opus-4.8");
    assert.equal(body.provider.zdr,true);
    assert.equal(body.provider.allow_fallbacks,false);
    assert.equal(body.provider.data_collection,"deny");
    if(calls>1) { assert.equal(body.reasoning.effort,"medium"); assert.equal(body.temperature,undefined); }
    assert(body.messages[0].content.includes(calls===1 ? "Astra Portraits V4" : calls===2 ? "substantive editor" : "independent acceptance gate"));
    if(calls>1) assert.equal(body.messages[0].content.includes("SOURCE IDENTITY:"),reportType==="progressed");
    if(calls===2) assert(body.messages[0].content.includes("TRUEBYLINE-STYLE DIAGNOSIS:"));
    assert(body.messages[0].content.includes("IDEA ECONOMY:"), "Planning, editing and review must share the reader standard.");
    assert.equal(body.messages[0].content.includes("PRACTICAL LIFE CHAPTER:"), reportType === "progressed");
    return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content:JSON.stringify(calls===1?draft():calls===2?{edits:[]}:{accepted:true,issues:[]})}}],usage:{prompt_tokens:10,completion_tokens:10,cost:0.001}}));
  }});
  assert.equal(result.status,"completed",result.error);
  assert.equal(calls,3);
  assert.equal(result.generationMetadata?.promptVersion,ASTRA_PORTRAITS_V4_PROMPT_VERSION);
  assert.equal(result.generationMetadata?.orchestration,"portraits-v4");
  assert.equal(result.generationMetadata?.estimatedSpend,0.003);
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
assert.deepEqual(validatePortraitV4Draft(sizedDraft(650),evidence),[],"Concise complete structure must not be padded to the old 1050-word floor.");
assert(validatePortraitV4Draft(sizedDraft(649),evidence).some(x=>x.includes("650-2200")));
assert.deepEqual(validatePortraitV4Draft(sizedDraft(2200),evidence),[]);
assert(validatePortraitV4Draft(sizedDraft(2201),evidence).some(x=>x.includes("650-2200")));
let formatCalls=0;
const formatRecovered=await buildAstrologyReportResultAsync(base,{env,fetchImpl:async()=>{
  formatCalls++;
  const content=formatCalls===1?JSON.stringify(draft()):formatCalls===2?'{"edits":[]':formatCalls===3?'{"edits":[]}':'{"accepted":true,"issues":[]}';
  return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content}}],usage:{cost:0.001}}));
}});
assert.equal(formatRecovered.status,"completed",formatRecovered.error);
assert.equal(formatCalls,4,"One malformed editor response reuses the bounded edit retry, without redrafting.");
let invalidEditCalls=0;
const invalidEdits=await buildAstrologyReportResultAsync(base,{env,fetchImpl:async()=>{
  invalidEditCalls++;
  return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content:invalidEditCalls===1?JSON.stringify(draft()):'{"edits":['}}],usage:{cost:0.001}}));
}});
assert.equal(invalidEdits.status,"failed");
assert.equal(invalidEditCalls,3,"Repeated malformed editing stops at the existing two-edit bound.");
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
let rejectedCalls=0;
const rejected=await buildAstrologyReportResultAsync(base,{env,fetchImpl:async()=>{
  rejectedCalls++;
  return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content:JSON.stringify(rejectedCalls===1?draft():rejectedCalls%2===0?{edits:[]}:{accepted:false,issues:["Invented personal history"]})}}],usage:{cost:0.001}}));
}});
assert.equal(rejected.status,"failed");assert.equal(rejectedCalls,5);assert.equal(rejected.sections.length,0);
assert.equal(rejected.generationMetadata?.estimatedSpend,0.005);
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
  return new Response(JSON.stringify({provider:"Amazon Bedrock",choices:[{finish_reason:"stop",message:{content:JSON.stringify(advisoryCalls===1?nearMiss:advisoryCalls===2?{edits:[]}:{accepted:true,issues:[]})}}],usage:{cost:0.001}}));
}});
assert.equal(acceptedWithAdvice.status,"completed",acceptedWithAdvice.error);
assert.equal(advisoryCalls,3,"An advisory must not trigger another paid editorial cycle");
assert.equal(acceptedWithAdvice.generationMetadata?.portraitsV4?.advisories?.length,1);
assert(acceptedWithAdvice.sections[0].body.includes("learned early"),"Do not silently rewrite an accepted near miss");
console.log("PASS V4 schema-2 production dispatch, whole-portrait prompt, independent gate, bounded rejection, private trace, date, cost and three-topic catalog. Synthetic fixture is not quality evidence.");
