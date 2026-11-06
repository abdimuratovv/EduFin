import { createHash, randomUUID } from "node:crypto";
import { DomainError } from "../errors";
import { immediate, type Db } from "../db/connection";

export const MAX_AMOUNT = 10_000_000;

export interface LedgerEntry {
  id: string;
  type: "TOPUP" | "REWARD";
  sourceAccount: string;
  destAccount: string;
  amount: number;
  currency: string;
  entitlementId: string | null;
  createdAt: string;
}

export const childAccount = (childId: string) => `child:${childId}`;

export function assertAmount(amount: unknown): asserts amount is number {
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    throw new DomainError("INVALID_AMOUNT", `Miqdor 1 dan ${MAX_AMOUNT} gacha butun son bo‘lishi kerak.`);
  }
}

/** Hisob balansi: kirimlar − chiqimlar (faqat hisob jadvalidan). */
export function accountBalance(db: Db, familyId: string, account: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN dest_account = @a THEN amount ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN source_account = @a THEN amount ELSE 0 END), 0) AS balance
       FROM ledger_transactions WHERE family_id = @f`,
    )
    .get({ a: account, f: familyId }) as { balance: number };
  return row.balance;
}

const hashRequest = (parts: unknown[]) => createHash("sha256").update(JSON.stringify(parts)).digest("hex");

/**
 * Faqat tranzaksiya ichida chaqiriladi. Bir xil kalit + bir xil mazmun → mavjud yozuv;
 * bir xil kalit + boshqa mazmun → IDEMPOTENCY_CONFLICT. Manfiy balansga yo'l qo'yilmaydi.
 */
export function transferInTx(
  db: Db,
  p: {
    familyId: string;
    type: "TOPUP" | "REWARD";
    source: string;
    dest: string;
    amount: number;
    key: string;
    entitlementId?: string;
  },
): { id: string; replayed: boolean } {
  assertAmount(p.amount);
  const requestHash = hashRequest([p.type, p.source, p.dest, p.amount, p.entitlementId ?? null]);
  const existing = db
    .prepare("SELECT id, request_hash FROM ledger_transactions WHERE family_id = ? AND idempotency_key = ?")
    .get(p.familyId, p.key) as { id: string; request_hash: string } | undefined;
  if (existing) {
    if (existing.request_hash !== requestHash) {
      throw new DomainError("IDEMPOTENCY_CONFLICT", "Bu so‘rov kaliti boshqa amal uchun ishlatilgan.");
    }
    return { id: existing.id, replayed: true };
  }
  if (p.source !== "external" && accountBalance(db, p.familyId, p.source) < p.amount) {
    throw new DomainError("INSUFFICIENT_FUND", "Fondda mablag‘ yetarli emas.");
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO ledger_transactions
       (id, family_id, type, source_account, dest_account, amount, entitlement_id, idempotency_key, request_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    p.familyId,
    p.type,
    p.source,
    p.dest,
    p.amount,
    p.entitlementId ?? null,
    p.key,
    requestHash,
    new Date().toISOString(),
  );
  return { id, replayed: false };
}

/** Demo fondni to'ldirish (haqiqiy pul emas). */
export function topUp(db: Db, familyId: string, amount: number, idempotencyKey: string) {
  if (!idempotencyKey) throw new DomainError("INVALID_AMOUNT", "So‘rov kaliti kerak.");
  return immediate(db, () =>
    transferInTx(db, { familyId, type: "TOPUP", source: "external", dest: "fund", amount, key: idempotencyKey }),
  );
}

export function listLedger(db: Db, familyId: string): LedgerEntry[] {
  return db
    .prepare(
      `SELECT id, type, source_account AS sourceAccount, dest_account AS destAccount, amount, currency,
              entitlement_id AS entitlementId, created_at AS createdAt
       FROM ledger_transactions WHERE family_id = ? ORDER BY created_at DESC, rowid DESC`,
    )
    .all(familyId) as LedgerEntry[];
}

export function getBalances(db: Db, familyId: string, childId: string) {
  return { fund: accountBalance(db, familyId, "fund"), child: accountBalance(db, familyId, childAccount(childId)) };
}

/** Izchillik: barcha balanslar yig'indisi = jami top-up; hech bir balans manfiy emas. */
export function verifyLedger(db: Db, familyId: string): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const accounts = db
    .prepare(
      "SELECT DISTINCT dest_account AS a FROM ledger_transactions WHERE family_id = ? AND dest_account != 'external'",
    )
    .all(familyId) as { a: string }[];
  let total = 0;
  for (const { a } of accounts) {
    const b = accountBalance(db, familyId, a);
    if (b < 0) problems.push(`${a} balansi manfiy: ${b}`);
    total += b;
  }
  const topups = (
    db.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM ledger_transactions WHERE family_id = ? AND type = 'TOPUP'").get(familyId) as { s: number }
  ).s;
  if (total !== topups) problems.push(`balanslar yig‘indisi ${total} ≠ top-uplar ${topups}`);
  return { ok: problems.length === 0, problems };
}
