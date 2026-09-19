import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, openSync, closeSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { astrologyReportRequestSchema, type AstrologyReportRequest, type RecordAstrologyReportResult } from "@astra/contracts";
import { buildAstrologyReportResultAsync, buildPortraitV4Evidence, synastryToneSnapshot } from "@astra/astrology";
import { editPortraitV4Draft, portraitV4ReviewPrompt, portraitV4ReviewSchema, portraitV4ReviewFormat, ASTRA_PORTRAITS_V4_PROMPT_VERSION } from "../packages/astrology/src/report/portraitsV4";
import { writeOpenRouterModelText } from "../packages/astrology/src/report/openRouterAdapter";
import { mergeProviderUsage, type ProviderUsage } from "../packages/astrology/src/report/providerUsage";
import { portraitBudgetExposure, reservePortraitBudget, type PortraitBudgetTransaction as Transaction } from "./portraits-v4-budget";

// Private local acceptance harness. Never writes the application database.
const root = resolve(".astra-exports/portraits-v4");
mkdirSync(root, { recursive: true, mode: 0o700 });
const write = (path: string, value: unknown) => writeFileSync(path, typeof value === "string" ? value : JSON.stringify(value, null, 2), { mode: 0o600 });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const key = process.env.OPENROUTER_API_KEY ?? process.env.ASTRA_OPENROUTER_API_KEY;
if (!key) throw new Error("OpenRouter key missing");
const lockPath = root + "/spend.lock";
const lock = openSync(lockPath, "wx", 0o600);
const ledgerPath = root + "/ledger.json";
const ledger: { cap: number; transactions: Transaction[] } = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, "utf8")) : { cap: 30, transactions: [] };
const exposure = () => portraitBudgetExposure(ledger);
const callsDir = root + "/calls";
mkdirSync(callsDir, { recursive: true, mode: 0o700 });
const fetchBudgeted: typeof fetch = async (url, init) => {
  if (String(url) !== "https://openrouter.ai/api/v1/chat/completions") throw new Error("Unapproved provider endpoint");
  if (ledger.transactions.some(row => row.state === "reserved")) throw new Error("Unsettled call reservation: reconcile before proceeding");
  const body = JSON.parse(String(init?.body));
  if (!["anthropic/claude-sonnet-5", "anthropic/claude-sonnet-4.6", "anthropic/claude-opus-4.8"].includes(body.model)) throw new Error("Unapproved model");
  body.provider = { only: [body.model === "anthropic/claude-opus-4.8" ? "amazon-bedrock" : "amazon-bedrock/global"], allow_fallbacks: false, data_collection: "deny", zdr: true, max_price: { prompt: 5, completion: 25 } };
  // Sonnet 5 does not advertise temperature support; retain adapter defaults otherwise.
  if (body.model !== "anthropic/claude-sonnet-4.6") delete body.temperature;
  const developmentCap = ["frame-qualification","repair-source-frame","confirmation-source-frame"].includes(process.argv[2]) ? 2.94749 + 2 : ["review-calibration-v2", "development-proportionate"].includes(process.argv[2]) ? 1.668093 + 2 : process.argv[2] === "development-4.5" ? 1.530241 + 2 : process.argv[2] === "chapter-qualification" ? 1.335886 + 1 : ["editor-opus", "development-4.4"].includes(process.argv[2]) ? 0.664807 + 3 : ["opus-canary", "gate-qualification-opus"].includes(process.argv[2]) ? 0.529497 + 2 : process.argv[2] === "gate-qualification" ? 0.488091 + 1 : ["editor-development", "development-4.3"].includes(process.argv[2]) ? 0.312087 + 3 : 30;
  const reserve = reservePortraitBudget(ledger, body, process.argv[2] === "synastry-light" ? 5.209835 + 1.5 : process.argv[2] === "api-wired" ? 4.395551 + 1.5 : ["voice", "voice-retry"].includes(process.argv[2]) ? 3.534705 + 2 : developmentCap);
  const id = randomUUID();
  const row: Transaction = { id, state: "reserved", reserve };
  ledger.transactions.push(row); write(ledgerPath, ledger);
  write(`${callsDir}/${id}.request.json`, { requestedAt: new Date().toISOString(), body, sha256: hash(JSON.stringify(body)) });
  const response = await fetch(url, { ...init, body: JSON.stringify(body) });
  const payload = await response.clone().json();
  write(`${callsDir}/${id}.response.json`, { status: response.status, payload });
  if (typeof payload.usage?.cost !== "number" || !Number.isFinite(payload.usage.cost) || payload.usage.cost < 0) throw new Error("Provider cost unavailable; reservation retained, acquisition stopped");
  row.state = "settled"; row.cost = payload.usage.cost; row.providerCallId = payload.id; write(ledgerPath, ledger);
  if (payload.provider !== "Amazon Bedrock") throw new Error("Unexpected actual provider; acquisition stopped");
  if (exposure() > 30 || payload.usage.cost > reserve) throw new Error("Cost bound violated; acquisition stopped");
  return response;
};

try {
  const mode = process.argv[2] ?? "development";
  if (mode === "review-calibration-v2" || mode === "frame-qualification") {
    const cohort = root + "/" + mode + "-" + new Date().toISOString().replaceAll(":", "-");
    mkdirSync(cohort, { mode: 0o700 });
    const frameQualification=mode==="frame-qualification";
    const packet = readFileSync(root+`/calibration/${frameQualification ? "frame" : "v2"}-controls.json`,"utf8");
    const units: Array<{id:string;notes:string;passage:string}> = JSON.parse(packet);
    const expected: Record<string,boolean> = JSON.parse(readFileSync(root+`/calibration/${frameQualification ? "frame" : "v2"}-control-key.json`,"utf8"));
    if(units.length!==(frameQualification?2:8) || new Set(units.map(unit=>unit.id)).size!==units.length) throw new Error("Wrong control count or duplicate controls");
    const request = astrologyReportRequestSchema.parse({id:"synthetic-v2-calibration",userId:"offline",chartRequestId:"synthetic",reportType:"personal",subjectName:"Test Reader",birthData:{date:"1990-04-05",time:"09:00",timezone:"UTC",latitude:0,longitude:0,location:"Synthetic",birthTimeKnown:true},status:"queued",source:"self",createdAt:"2026-09-18T00:00:00Z",updatedAt:"2026-09-18T00:00:00Z"});
    write(cohort+"/manifest.json",{amendment:frameQualification?"A14":"A13",protocol:"portraits-v4-reader-review-2",controlsHash:hash(packet),gateHash:hash(readFileSync("packages/astrology/src/report/portraitsV4.ts","utf8")),units:units.map(unit=>unit.id)});
    const decisions=[];
    for(const unit of units) {
      const current = unit.id==="M52" || frameQualification ? astrologyReportRequestSchema.parse({...request,reportType:"progressed",reportBasis:{schemaVersion:2,type:"progressed",asOfDate:"2026-09-18",primary:{chartRequestId:"synthetic",subjectType:"self",subjectName:"Test Reader",birthData:request.birthData,calculationMode:"full"},chartSettings:{zodiacMode:"tropical",houseSystem:"whole-sign"}}}) : request;
      const prompt=portraitV4ReviewPrompt(current,[{id:"P01",topic:"Control",fact:unit.notes,meaning:"Interpretive material, not observed history."}],{thread:"One independent materiality control excerpt; not a full-length report.",sections:[{title:"Reading",body:unit.passage,evidenceIds:["P01"]}]});
      const response=await writeOpenRouterModelText({prompt,maxOutputTokens:6000,responseFormat:portraitV4ReviewFormat,model:"anthropic/claude-opus-4.8",apiKey:key,baseUrl:"https://openrouter.ai/api/v1",timeoutMs:240_000,reasoningEffort:"medium",siteUrl:"https://astraportrait.com",appName:"Astra V4 proportionate review qualification",privatePortraitRoute:true,fetchImpl:fetchBudgeted});
      write(`${cohort}/${unit.id}.response.json`,response);
      const verdict=portraitV4ReviewSchema.parse(JSON.parse(response.text));
      const matched=verdict.accepted===expected[unit.id] && (verdict.accepted ? verdict.issues.length===0 : verdict.issues.length>0);
      decisions.push({id:unit.id,...verdict,matched}); write(cohort+"/decisions.json",decisions);
      console.log(JSON.stringify({control:unit.id,matched,actualSpend:exposure()}));
    }
    write(cohort+"/qualification.json",{passed:decisions.every(d=>d.matched),correct:decisions.filter(d=>d.matched).length,total:decisions.length});
    console.log(JSON.stringify({qualification:decisions.every(d=>d.matched),cohort,actualSpend:exposure()}));
  } else if (mode === "chapter-qualification") {
    const cohort = root + "/" + mode + "-" + new Date().toISOString().replaceAll(":", "-");
    mkdirSync(cohort, { mode: 0o700 });
    const units = [
      { source:"development-4.4-2026-09-19T02-45-42.953Z/R-9ca6ece9", index:0, expected:false },
      { source:"editor-opus-2026-09-19T02-44-14.938Z/R-7089171e", index:2, expected:true },
      { source:"development-4.4-2026-09-19T02-45-42.953Z/R-9ca6ece9", index:2, expected:false },
      { source:"editor-opus-2026-09-19T02-44-14.938Z/R-7089171e", index:0, expected:true }
    ];
    write(cohort+"/manifest.json",{amendment:"A11",units,sourceHashes:Object.fromEntries(units.map(unit=>[unit.source,hash(readFileSync(`${root}/${unit.source}.result.json`,"utf8"))])),gateHash:hash(readFileSync("packages/astrology/src/report/portraitsV4.ts","utf8"))});
    const decisions=[];
    for(const [i,unit] of units.entries()) {
      const result=JSON.parse(readFileSync(`${root}/${unit.source}.result.json`,"utf8"));
      const request=astrologyReportRequestSchema.parse(JSON.parse(readFileSync(`${root}/${unit.source}.input.json`,"utf8")));
      const support=result.generationMetadata.portraitsV4;
      const ids=support.trace[unit.index].evidenceIds as string[];
      const prompt=portraitV4ReviewPrompt(request,support.evidence.filter((item:{id:string})=>ids.includes(item.id)),{thread:support.thread,sections:[{...result.sections[unit.index],evidenceIds:ids}]});
      const response=await writeOpenRouterModelText({prompt,maxOutputTokens:6000,responseFormat:portraitV4ReviewFormat,model:"anthropic/claude-opus-4.8",apiKey:key,baseUrl:"https://openrouter.ai/api/v1",timeoutMs:240_000,reasoningEffort:"medium",siteUrl:"https://astraportrait.com",appName:"Astra V4 chapter qualification",privatePortraitRoute:true,fetchImpl:fetchBudgeted});
      write(`${cohort}/C${i+1}.response.json`,response);
      const verdict=portraitV4ReviewSchema.parse(JSON.parse(response.text));
      const matched=verdict.accepted===unit.expected && (verdict.accepted ? verdict.issues.length===0 : /learn|early|history|biograph|full arc|lived|life arc/i.test(verdict.issues.join(" ")));
      decisions.push({id:`C${i+1}`,...verdict,matched});
      write(cohort+"/decisions.json",decisions);
      console.log(JSON.stringify({unit:i+1,matched,actualSpend:exposure()}));
    }
    write(cohort+"/qualification.json",{passed:decisions.every(d=>d.matched),decisions});
    console.log(JSON.stringify({qualification:decisions.every(d=>d.matched),cohort}));
  } else if (mode === "gate-qualification" || mode === "gate-qualification-opus") {
    const model = mode === "gate-qualification-opus" ? "anthropic/claude-opus-4.8" : "anthropic/claude-sonnet-5";
    const cohort = root + "/" + mode + "-" + new Date().toISOString().replaceAll(":", "-");
    mkdirSync(cohort, { mode: 0o700 });
    const controlText = readFileSync(root + "/calibration/controls.md", "utf8") + "\n" + readFileSync(root + "/calibration/control-supplement.md", "utf8");
    const units = [...controlText.matchAll(/## (C\d+)\nSupplied notes: ([\s\S]*?)\nPassage: ([\s\S]*?)(?=\n## |$)/g)].map(match => ({ id: match[1], notes: match[2].trim(), text: match[3].trim(), expected: ["C42", "C90"].includes(match[1]) }));
    if (units.length !== 9) throw new Error("Expected nine qualified controls");
    const parentPath = root + "/editor-development-2026-09-19T02-31-52.584Z/R-e296f660.result.json";
    const parent = JSON.parse(readFileSync(parentPath, "utf8"));
    const request = astrologyReportRequestSchema.parse(JSON.parse(readFileSync(root + "/editor-development-2026-09-19T02-31-52.584Z/R-e296f660.input.json", "utf8")));
    units.push({ id: "D", notes: "", text: "", expected: false });
    write(cohort + "/manifest.json", { amendment: mode === "gate-qualification-opus" ? "A09" : "A08", model, units: units.map(({id,expected})=>({id,expected})), controlHash: hash(controlText), parentHash: hash(readFileSync(parentPath,"utf8")), sourceHash: hash(readFileSync("packages/astrology/src/report/portraitsV4.ts","utf8")) });
    const decisions = [];
    for (const unit of units) {
      const evidence = unit.id === "D" ? parent.generationMetadata.portraitsV4.evidence : [{ id: "P01", topic: "Control", fact: unit.notes, meaning: "The supplied notes are symbolic possibilities, not observed history." }];
      const draft = unit.id === "D" ? { thread: parent.generationMetadata.portraitsV4.thread, sections: parent.sections.map((section: {title:string;body:string},i:number)=>({...section,evidenceIds:parent.generationMetadata.portraitsV4.trace[i].evidenceIds})) } : { thread: "One independent qualification passage.", sections: [{ title: "Passage", body: unit.text, evidenceIds: ["P01"] }] };
      const prompt = portraitV4ReviewPrompt(unit.id === "C56" ? { ...request, reportType:"progressed", reportBasis:{...request.reportBasis!,type:"progressed",asOfDate:"2026-09-18"} } : request,evidence,draft);
      const result = await writeOpenRouterModelText({ prompt, maxOutputTokens:mode === "gate-qualification-opus" ? 6000 : 1800, responseFormat:portraitV4ReviewFormat, model, apiKey:key, baseUrl:"https://openrouter.ai/api/v1", timeoutMs:240_000, reasoningEffort:mode === "gate-qualification-opus" ? "medium" : "none", siteUrl:"https://astraportrait.com", appName:"Astra V4 checker qualification", fetchImpl:fetchBudgeted });
      write(`${cohort}/${unit.id}.response.json`,result);
      const decision = portraitV4ReviewSchema.parse(JSON.parse(result.text));
      const matched = decision.accepted === unit.expected && (decision.accepted ? decision.issues.length===0 : decision.issues.length>0) && (unit.id!=="D" || /accura|function|perform|self.knowledge|understand|comparative/i.test(decision.issues.join(" ")));
      decisions.push({id:unit.id,...decision,matched});
      write(cohort+"/decisions.json",decisions);
      console.log(JSON.stringify({control:unit.id,matched,actualSpend:exposure()}));
    }
    write(cohort+"/qualification.json",{passed:decisions.every(d=>d.matched),correct:decisions.filter(d=>d.matched).length,total:decisions.length});
    console.log(JSON.stringify({qualification:decisions.every(d=>d.matched),cohort,actualSpend:exposure()}));
  } else if (mode === "schema-canary") {
    for (const model of ["anthropic/claude-sonnet-5", "anthropic/claude-sonnet-4.6"]) {
      const schema = { type: "object", properties: { sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, body: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } } }, required: ["title", "body", "evidenceIds"], additionalProperties: false } } }, required: ["sections"], additionalProperties: false };
      const response = await fetchBudgeted("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "user", content: 'Return this exact JSON and nothing else: {"sections":[{"title":"Example","body":"A synthetic test.","evidenceIds":["P01"]}]}' }], max_tokens: 256, response_format: { type: "json_schema", json_schema: { name: "test_trace", strict: true, schema } } }) });
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content;
      console.log(JSON.stringify({ model, text, actualSpend: exposure() }));
    }
  } else if (mode === "canary" || mode === "opus-canary") {
    const model = mode === "opus-canary" ? "anthropic/claude-opus-4.8" : "anthropic/claude-sonnet-5";
    write(root+`/${mode}-endpoints.json`,await (await fetch(`https://openrouter.ai/api/v1/models/${model}/endpoints`)).json());
    const response = await fetchBudgeted("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "user", content: "Return only the word READY." }], max_tokens: 32, reasoning: { effort: "none" } }) });
    const result = await response.json();
    if (result.choices?.[0]?.message?.content?.trim() !== "READY") throw new Error("Canary did not return READY");
    console.log(JSON.stringify({ canary: "pass", actualSpend: exposure() }));
  } else {
    const sources = JSON.parse(readFileSync(root + "/sources.json", "utf8"));
    const people = {
      tony: sources["approved-personal"].request.reportBasis.primary,
      donna: sources["failed-donna"].request.reportBasis.primary,
      cheyenne: sources["approved-relationship"].request.reportBasis.partner
    };
    type Case = [keyof typeof people, "personal" | "progressed" | "synastry", (keyof typeof people)?];
    const cases: Case[] = ["development", "development-4.6", "editor-development", "development-4.3", "editor-opus", "development-4.4", "development-4.5", "development-proportionate"].includes(mode) ? [["donna", "personal"]]
      : ["repair-source-frame","confirmation-source-frame"].includes(mode) ? [["cheyenne","progressed"]]
      : ["voice", "api-wired"].includes(mode) ? [["tony", "personal"], ["tony", "progressed"], ["tony", "synastry", "cheyenne"]]
      : mode === "synastry-light" ? [["tony", "synastry", "cheyenne"]]
      : mode === "voice-retry" ? [["tony", "personal"]]
      : mode === "holdout" ? [["tony", "personal"], ["cheyenne", "personal"], ["tony", "progressed"], ["donna", "progressed"], ["cheyenne", "progressed"], ["tony", "synastry", "donna"], ["tony", "synastry", "cheyenne"]]
      : mode === "repeat" ? [["donna", "personal"], ["tony", "progressed"]] : [];
    if (!cases.length) throw new Error("Use canary, development, holdout, repeat or voice");
    const cohort = root + "/" + mode + "-" + new Date().toISOString().replaceAll(":", "-");
    mkdirSync(cohort, { mode: 0o700 });
    const sourcePaths = ["packages/astrology/src/index.ts", "packages/astrology/src/report/portraitsV4.ts", "packages/astrology/src/report/synastryV3.ts", "packages/astrology/src/report/openRouterAdapter.ts", "packages/astrology/src/report/providerUsage.ts", "packages/contracts/src/index.ts", "scripts/run-portraits-v4.mts", "scripts/portraits-v4-budget.ts", "docs/evaluations/ASTRA_PORTRAITS_V4_PREREGISTRATION.md", "docs/evaluations/ASTRA_PORTRAITS_V4_REVIEW_PROTOCOL_V2.md", "docs/evaluations/ASTRA_PORTRAITS_V4_AMENDMENTS.md"];
    sourcePaths.push("packages/astrology/src/report/portraitVoice.ts", "packages/astrology/src/report/synastryV3Validation.ts", "packages/astrology/src/readability.ts");
    write(cohort + "/manifest.json", { mode, protocol:["api-wired", "synastry-light"].includes(mode) ? "production-path-untouched-output-1" : mode.startsWith("voice") ? "owner-voice-refinement-1" : "portraits-v4-reader-review-2", promptVersion:ASTRA_PORTRAITS_V4_PROMPT_VERSION, date: "2026-09-18", cases, sourceHashes: Object.fromEntries(sourcePaths.map(path => [path, hash(readFileSync(path, "utf8"))])) });
    console.log(JSON.stringify({phase:"started",cohort,cases:cases.length}));
    const mask: Record<string, unknown> = {};
    for (const [person, type, partner] of cases) {
      const primary = people[person];
      const partnerSource = partner ? people[partner] : undefined;
      const tone = partner ? synastryToneSnapshot({ relationship: partner === "donna" ? "Sibling" : "Lover" }) : undefined;
      const candidate = "R-" + randomUUID().slice(0, 8);
      const request: AstrologyReportRequest = astrologyReportRequestSchema.parse({
        id: "v4-" + randomUUID(), userId: "private-v4-evaluation", chartRequestId: primary.chartRequestId,
        reportType: type, subjectName: primary.subjectName, birthData: primary.birthData,
        context: tone ? { synastryTone: tone } : undefined,
        status: "queued", source: "self", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        reportBasis: { schemaVersion: 2, type: type === "personal" ? "natal" : type,
          chartSettings: { zodiacMode: "tropical", houseSystem: "whole-sign" }, primary,
          ...(partnerSource ? { partner: partnerSource } : {}), ...(type === "progressed" ? { asOfDate: "2026-09-18" } : {}) }
      });
      write(`${cohort}/${candidate}.input.json`, request);
      const result: RecordAstrologyReportResult = ["editor-development", "editor-opus","repair-source-frame"].includes(mode) ? await (async () => {
        const repair=mode==="repair-source-frame";
        const opus=mode!=="editor-development";
        const parentPath = root + (repair ? "/holdout-2026-09-19T03-11-19.315Z/R-207b443d.result.json" : "/development-4.6-2026-09-19T02-19-44.594Z/R-e1fe69a5.result.json");
        const parent = JSON.parse(readFileSync(parentPath, "utf8"));
        const metadata = parent.generationMetadata.portraitsV4;
        write(cohort + "/lineage.json", { parentPath, parentSha256: hash(readFileSync(parentPath, "utf8")), amendment: repair ? "A14" : mode === "editor-opus" ? "A10" : "A07" });
        let usage: ProviderUsage = {}; let attemptCount = 0; const started = Date.now();
        const edited = await editPortraitV4Draft(request, metadata.evidence, {
          thread: metadata.thread,
          sections: parent.sections.map((section: { title: string; body: string }, index: number) => ({ ...section, evidenceIds: metadata.trace[index].evidenceIds }))
        }, async (prompt, maxOutputTokens, responseFormat) => {
          attemptCount++;
          const response = await writeOpenRouterModelText({ prompt, maxOutputTokens, responseFormat, model: opus ? "anthropic/claude-opus-4.8" : "anthropic/claude-sonnet-4.6", apiKey: key, baseUrl: "https://openrouter.ai/api/v1", timeoutMs: 240_000, reasoningEffort: opus ? "medium" : "none", siteUrl: "https://astraportrait.com", appName: "Astra private V4 development", privatePortraitRoute:true, fetchImpl: fetchBudgeted });
          usage = mergeProviderUsage(usage, response.usage);
          return response;
        }, [], repair ? ["The Relationships chapter misidentifies P07's natal Mars in Libra as P09's separate progressed Mars in Scorpio/2nd house. Correct the exact aspect participants and remove consequences that depend on that conflation, preserving the supported psychological distinction and the rest of the reading. Do not rewrite unrelated good chapters."] : []);
        return { ...parent, requestId: request.id, sections: edited.draft.sections.map((section,index) => ({ id: `${request.id}:v4:${index+1}`, title: section.title, body: section.body, emphasis: index===0 ? "primary" : "supporting" })),
          generationMetadata: { ...parent.generationMetadata, promptVersion: ASTRA_PORTRAITS_V4_PROMPT_VERSION, ...usage, attemptCount, latencyMs: Date.now()-started, portraitsV4: { ...metadata, reviews: edited.reviews, advisories:edited.advisories } } };
      })() : await buildAstrologyReportResultAsync(request, { env: {
        ASTRA_EPHEMERIS_ENGINE: "local-chart-routine", ASTRA_REPORT_WRITER: "debug-model-writer",
        ASTRA_REPORT_MODEL_PROFILE: "production", ASTRA_OPENROUTER_API_KEY: key,
        ...(["development-4.6", "development-4.3"].includes(mode) ? { ASTRA_REPORT_MODEL: "anthropic/claude-sonnet-4.6" } : {}),
        ASTRA_OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1"
      }, fetchImpl: fetchBudgeted });
      write(`${cohort}/${candidate}.result.json`, result);
      write(`${cohort}/${candidate}.reading.md`, result.sections.map(s => `## ${s.title}\n\n${s.body}`).join("\n\n") || `Generation did not complete: ${result.error}`);
      write(`${cohort}/${candidate}.evidence.json`, { topic: type, reader: primary.subjectName, relationship: tone?.authoredRelationship, partner: partnerSource?.subjectName, date: request.reportBasis?.asOfDate,
        evidence: type === "synastry" ? result.generationMetadata?.synastryV3?.evidenceIndex : buildPortraitV4Evidence(request) });
      mask[candidate] = { person, type, partner, status: result.status, model: result.generationMetadata?.model, prompt: result.generationMetadata?.promptVersion };
      write(cohort + "/mask-key.json", mask);
      console.log(JSON.stringify({ candidate, status: result.status, words: result.sections.map(s => s.body).join(" ").split(/\s+/).length, actualSpend: exposure(), cohort, error: result.error }));
      if (ledger.transactions.some(row => row.state === "reserved")) throw new Error("Unsettled provider call; stopped cohort");
    }
  }
} finally { closeSync(lock); unlinkSync(lockPath); }
