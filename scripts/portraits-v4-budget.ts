export type PortraitBudgetTransaction = { id: string; state: "reserved" | "settled"; reserve: number; cost?: number; providerCallId?: string };
export type PortraitBudgetLedger = { cap: number; transactions: PortraitBudgetTransaction[] };

export function portraitBudgetExposure(ledger: PortraitBudgetLedger) {
  return ledger.transactions.reduce((sum, row) => {
    const amount = row.state === "settled" ? row.cost : row.reserve;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) throw new Error("Invalid budget ledger; reconcile before proceeding");
    return sum + amount;
  }, 0);
}

export function reservePortraitBudget(ledger: PortraitBudgetLedger, body: { max_tokens?: unknown }, stageCap = 30) {
  if (ledger.transactions.some(row => row.state === "reserved")) throw new Error("Unsettled call reservation: reconcile before proceeding");
  if (!Number.isFinite(ledger.cap) || ledger.cap <= 0 || !Number.isFinite(stageCap) || stageCap <= 0) throw new Error("Invalid budget cap");
  if (typeof body.max_tokens !== "number" || !Number.isInteger(body.max_tokens) || body.max_tokens <= 0) throw new Error("Invalid completion bound");
  const reserve = Buffer.byteLength(JSON.stringify(body), "utf8") * 0.000005 + body.max_tokens * 0.000025 + 0.02;
  if (portraitBudgetExposure(ledger) + reserve > Math.min(30, ledger.cap, stageCap)) throw new Error("OpenRouter hard budget cap would be exceeded");
  return reserve;
}
