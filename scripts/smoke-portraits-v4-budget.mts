import assert from "node:assert/strict";
import { closeSync, mkdtempSync, openSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { portraitBudgetExposure, reservePortraitBudget, type PortraitBudgetLedger } from "./portraits-v4-budget";

const body = { max_tokens: 6000, messages: [{ content: "Private synthetic test, no provider request." }] };
const ledger: PortraitBudgetLedger = { cap: 30, transactions: [] };
const reserve = reservePortraitBudget(ledger, body);
assert(reserve > 0.15);
assert.throws(() => reservePortraitBudget({ cap: 30, transactions: [{ id: "near-cap", state: "settled", reserve: 30, cost: 29.99 }] }, body), /cap would be exceeded/);
assert.throws(() => reservePortraitBudget({ cap: 100, transactions: [{ id: "cannot-raise-cap", state: "settled", reserve: 30, cost: 29.99 }] }, body), /cap would be exceeded/);
assert.throws(() => reservePortraitBudget(ledger, body, 0.1), /cap would be exceeded/);
ledger.transactions.push({ id: "uncertain-call", state: "reserved", reserve });
const resumed: PortraitBudgetLedger = JSON.parse(JSON.stringify(ledger));
assert.throws(() => reservePortraitBudget(resumed, body), /Unsettled/);
assert.equal(portraitBudgetExposure(resumed), reserve);
resumed.transactions[0] = { ...resumed.transactions[0], state: "settled", cost: 0.03, providerCallId: "reconciled" };
assert.equal(portraitBudgetExposure(resumed), 0.03);
assert(reservePortraitBudget(resumed, body) > 0);
assert.throws(() => portraitBudgetExposure({ cap: 30, transactions: [{ id: "missing-cost", state: "settled", reserve: 1 }] }), /Invalid budget ledger/);
assert.throws(() => reservePortraitBudget({ cap: NaN, transactions: [] }, body), /Invalid budget cap/);
assert.throws(() => reservePortraitBudget({ cap: 30, transactions: [] }, { max_tokens: "6000" }), /Invalid completion/);
const dir = mkdtempSync(join(tmpdir(), "astra-v4-lock-test-"));
const path = join(dir, "spend.lock");
const lock = openSync(path, "wx", 0o600);
try { assert.throws(() => openSync(path, "wx", 0o600), { code: "EEXIST" }); }
finally { closeSync(lock); unlinkSync(path); rmdirSync(dir); }
console.log("PASS cap refusal, immutable $30 ceiling, stage cap, uncertain-call resume refusal, reconciled resume, invalid ledger and exclusive lock; zero network calls.");
