// Private, opt-in one-case editorial comparison. No application/database writes.
import { createHash, randomInt, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, openSync, closeSync, unlinkSync, existsSync } from "node:fs";
import { strict as assert } from "node:assert";
import { measureReportReadability } from "../packages/astrology/src/readability";
import { portraitBudgetExposure, reservePortraitBudget, type PortraitBudgetLedger } from "./portraits-v4-budget";

export const PLAYFUL_VOICE_VERSION = "synastry-playful-private-v1";
export const PLAYFUL_VOICE = `Write for feeling and pleasure, not a seminar. Warm, wise, plainspoken: the good sense of a beloved elder who sees what people get up to and can smile about it. No imitation of an ethnicity, accent, dialect, farmer persona, grandmother persona, stock proverbs or folksy costume.
Use everyday verbs: want, notice, laugh, flirt, wait, ask, pull back, push, miss. Let the reader feel attraction, curiosity, teasing, tenderness and the small sting of being seen. Insight should land in the body before it needs an explanation. Be playful without forced jokes, sitcom banter or making fun of either person.
Aim around reading grade 7-8. Prefer short, varied sentences and familiar words. Avoid abstract machinery such as relational dynamics, structural weight, psychological penetration, activation, field, container and third protagonist. Do not replace these with equally puzzling metaphors. Say what the two people want or do.
Keep the sharp insights: wishing can masquerade as knowing; care can turn into control; wanting attention can make someone perform; closeness can arrive before trust. Use these only where the actual evidence supports them, not as a checklist. Do not turn every pleasure into a problem. Do not explain the insight twice or finish every paragraph with advice. Let some paragraphs end on the feeling.
Avoid reflexive not-X-but-Y constructions, mirrored opposite reactions, inflated flattery and three-item lists. Keep a contrast when it earns its place. No disclaimers sprinkled through the prose. Frame the report once as romantic potential, then write directly. Do not claim a specific event happened or that you know either person's actual feelings, consent, contact or future. Generalized motives and learned defenses are welcome. Simpler must not mean more timid.`;

const root = ".astra-exports/portraits-v4";
const out = `${root}/tc-ca-playful-v1`;
const source = `${root}/voice-2026-09-19T13-17-29.629Z/R-ae537861.result.json`;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const write = (p: string, v: unknown) => writeFileSync(p, typeof v === "string" ? v : JSON.stringify(v, null, 2), { flag: "wx", mode: 0o600 });
const bodyOnly = (s: string) => s.split("\n").filter(line => !/^\s*#/.test(line)).join("\n");
function validate(text: string) {
  const headings = text.match(/^## .+$/gm) ?? [];
  assert.equal(headings.length, 6, "Expected six chapters");
  assert.ok(/\byou\b/i.test(text) && /Cheyenne/.test(text), "Missing subjects");
  assert.ok(!/\bS\d{2}\b|<thinking>|<evidence_trace/i.test(text), "Private leakage");
  assert.ok(text.length > 2000, "Incomplete report");
  return measureReportReadability(bodyOnly(text));
}

if (process.argv.includes("--check")) {
  assert.throws(() => validate(""));
  assert.throws(() => validate("## A\nS01 you Cheyenne"));
  const fixture = Array.from({length:6}, (_,i) => `## Chapter ${i+1}\n${"You and Cheyenne can laugh. ".repeat(20)}`).join("\n\n");
  assert.equal(validate(fixture).wordCount, 600);
  assert.ok(PLAYFUL_VOICE.includes("Simpler must not mean more timid"));
  assert.ok(PLAYFUL_VOICE.includes("grade 7-8"));
  console.log("Private playful comparison fixtures passed; no network calls.");
} else if (process.argv.includes("--generate")) {
  const key = process.env.OPENROUTER_API_KEY ?? process.env.ASTRA_OPENROUTER_API_KEY;
  assert.ok(key, "OpenRouter key missing");
  assert.ok(!existsSync(`${out}/manifest.json`), "Immutable run already exists; do not repeat");
  const lockPath = `${root}/spend.lock`;
  const lock = openSync(lockPath, "wx", 0o600);
  try {
    mkdirSync(out, {recursive:true, mode:0o700});
    const ledgerPath = `${root}/ledger.json`;
    const ledger: PortraitBudgetLedger = JSON.parse(readFileSync(ledgerPath,"utf8"));
    const before = portraitBudgetExposure(ledger);
    const packet = JSON.parse(readFileSync(source,"utf8")).generationMetadata.synastryV3.evidenceIndex;
    const context = `Reader: Tony Cecala, addressed as you. Other person: Cheyenne Autumn. Romantic potential, not proof of an existing relationship. The private chart-derived evidence below is the sole factual basis. It is curated and non-exhaustive. Do not infer missing contacts are absent. Do not print astrology terms or evidence IDs.\n${JSON.stringify(packet)}`;
    const format = "Return only a complete Markdown reading with one # title and six ## chapters. Aim for 1000-1300 words, advisory not a hard gate. Cover recognition, what she awakens in you, what you awaken in her, desire/friction, the hidden bargain, and what the two of you could make together. Give Cheyenne a distinct possible response, but no mechanical three-part paragraph formula. No bullets or commentary. The closing chapter need not be long; end when the thought lands.";
    const labels = ["A","B","C"];
    for (let i=labels.length-1;i>0;i--) { const j=randomInt(i+1); [labels[i],labels[j]]=[labels[j],labels[i]]; }
    const routes = ["anthropic/claude-sonnet-4.6","anthropic/claude-haiku-4.5","anthropic/claude-opus-4.8"];
    const manifest = {version:PLAYFUL_VOICE_VERSION, sourceSha256:hash(readFileSync(source,"utf8")), codeSha256:hash(readFileSync(import.meta.filename,"utf8")), contract:PLAYFUL_VOICE, contextSha256:hash(context), format, routes, baselineSpend:before, additionalCap:1, reasoning:"disabled for all three; isolates model choice, not historical medium-reasoning editor configuration", retries:0, noModelJudge:true, noRuntimePromotion:true};
    write(`${out}/manifest.json`,manifest);
    write(`${out}/mask-key.json`,Object.fromEntries(labels.map((label,i)=>[label,{role:["writer-control","cheap-editor","expensive-editor"][i],model:routes[i]}])));
    async function call(model: string, prompt: string, label: string) {
      const request = {model,messages:[{role:"user",content:prompt}],max_tokens:6000,reasoning:{enabled:false},provider:{only:[model.includes("opus") ? "amazon-bedrock" : "amazon-bedrock/global"],allow_fallbacks:false,data_collection:"deny",zdr:true,max_price:{prompt:5,completion:25}}};
      const reserve = reservePortraitBudget(ledger,request,before+1);
      const id=randomUUID();
      const row={id,state:"reserved" as "reserved"|"settled",reserve,cost:undefined as number|undefined,providerCallId:undefined as string|undefined};
      ledger.transactions.push(row);
      writeFileSync(ledgerPath,JSON.stringify(ledger,null,2),{mode:0o600});
      write(`${out}/${label}.request.json`,{id,sha256:hash(JSON.stringify(request)),body:request});
      const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(request),signal:AbortSignal.timeout(240000)});
      const payload=await response.json();
      write(`${out}/${label}.response.json`,{status:response.status,payload});
      assert.ok(Number.isFinite(payload.usage?.cost) && payload.usage.cost>=0,"Unknown spend: preserve reservation and stop");
      row.state="settled";row.cost=payload.usage.cost;row.providerCallId=payload.id;
      writeFileSync(ledgerPath,JSON.stringify(ledger,null,2),{mode:0o600});
      assert.ok(response.ok && payload.provider==="Amazon Bedrock","Unexpected provider or HTTP failure");
      assert.equal(payload.model,model,"Unexpected model");
      assert.ok(payload.usage.cost<=reserve && portraitBudgetExposure(ledger)<=before+1,"Budget bound violation");
      assert.equal(payload.choices?.[0]?.finish_reason,"stop","Incomplete output; do not repair");
      const text=payload.choices[0].message.content;
      assert.equal(typeof text,"string");
      write(`${out}/${label}.reading.md`,text);
      const metrics=validate(text);
      write(`${out}/${label}.metrics.json`,{sha256:hash(text),...metrics});
      console.log(JSON.stringify({completed:label}));
      return text;
    }
    const draft=await call(routes[0],`${PLAYFUL_VOICE}\n\n${format}\n\n${context}`,labels[0]);
    const editPrompt=`You are editing the following complete report, not writing a new one. Make only changes that materially improve ease, warmth, playfulness or clarity. Preserve the distinctive sharp insights and the subjects. Leave good lines alone. Do not add explanatory padding, vague metaphors, instructions about managing yourself, or extra reassurance. Return the complete revised report without commentary.\n${PLAYFUL_VOICE}\n${format}\n${context}\n\nDRAFT:\n${draft}`;
    write(`${out}/editor-prompt.sha256`,hash(editPrompt));
    await call(routes[1],editPrompt,labels[1]);
    await call(routes[2],editPrompt,labels[2]);
    write(`${out}/spend.json`,{before,after:portraitBudgetExposure(ledger),additional:portraitBudgetExposure(ledger)-before,calls:3});
    console.log("Three masked readings ready. No further calls.");
  } finally {closeSync(lock);unlinkSync(lockPath);}
} else {
  console.log("Use --check (offline) or --generate (private, capped, immutable one-case run).");
}
