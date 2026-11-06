import { randomUUID } from "node:crypto";
import { DomainError } from "../errors";
import { immediate, type Db } from "../db/connection";
import { accountBalance, assertAmount, childAccount, transferInTx } from "./ledger";

export interface Entitlement {
  id: string;
  familyId: string;
  childId: string;
  lessonId: string;
  lessonVersion: number;
  amount: number;
  status: "pending" | "paid";
  ledgerTxId: string | null;
  createdAt: string;
  paidAt: string | null;
}

const COLS = `id, family_id AS familyId, child_id AS childId, lesson_id AS lessonId, lesson_version AS lessonVersion,
  amount, status, ledger_tx_id AS ledgerTxId, created_at AS createdAt, paid_at AS paidAt`;

/** Ota-ona mukofot qoidasi. Faqat keyingi boshlanadigan darsga ta'sir qiladi (boshlangan darsda snapshot saqlanadi). */
export function setRewardRule(db: Db, familyId: string, lessonId: string, amount: number): void {
  assertAmount(amount);
  db.prepare(
    `INSERT INTO reward_rules (family_id, lesson_id, amount, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (family_id, lesson_id) DO UPDATE SET amount = excluded.amount, updated_at = excluded.updated_at`,
  ).run(familyId, lessonId, amount, new Date().toISOString());
}

export function getRewardRule(db: Db, familyId: string, lessonId: string): number | null {
  const row = db.prepare("SELECT amount FROM reward_rules WHERE family_id = ? AND lesson_id = ?").get(familyId, lessonId) as
    | { amount: number }
    | undefined;
  return row?.amount ?? null;
}

export function getEntitlement(db: Db, id: string): Entitlement | undefined {
  return db.prepare(`SELECT ${COLS} FROM reward_entitlements WHERE id = ?`).get(id) as Entitlement | undefined;
}

export function listEntitlements(db: Db, familyId: string): Entitlement[] {
  return db
    .prepare(`SELECT ${COLS} FROM reward_entitlements WHERE family_id = ? ORDER BY created_at DESC, rowid DESC`)
    .all(familyId) as Entitlement[];
}

/** Tranzaksiya ichida: huquqni to'lashga urinadi. Fond yetmasa 'pending' holatda qoldiradi. */
export function tryPayInTx(db: Db, entitlementId: string): Entitlement {
  const e = getEntitlement(db, entitlementId);
  if (!e) throw new DomainError("NOT_FOUND", "Mukofot huquqi topilmadi.");
  if (e.status === "paid") return e;
  if (accountBalance(db, e.familyId, "fund") < e.amount) return e;
  const tx = transferInTx(db, {
    familyId: e.familyId,
    type: "REWARD",
    source: "fund",
    dest: childAccount(e.childId),
    amount: e.amount,
    key: `reward:${e.id}`,
    entitlementId: e.id,
  });
  db.prepare("UPDATE reward_entitlements SET status = 'paid', ledger_tx_id = ?, paid_at = ? WHERE id = ? AND status = 'pending'").run(
    tx.id,
    new Date().toISOString(),
    e.id,
  );
  return getEntitlement(db, e.id)!;
}

/** Ota-ona "Mukofotni berish": kutilayotgan huquqni bir marta to'laydi. */
export function settleReward(db: Db, familyId: string, entitlementId: string): Entitlement {
  return immediate(db, () => {
    const e = getEntitlement(db, entitlementId);
    if (!e || e.familyId !== familyId) throw new DomainError("NOT_FOUND", "Mukofot huquqi topilmadi.");
    if (e.status === "paid") return e; // takroriy so'rov: ikkinchi to'lov yo'q
    const result = tryPayInTx(db, entitlementId);
    if (result.status !== "paid") {
      throw new DomainError("INSUFFICIENT_FUND", "Fondda mablag‘ yetarli emas. Avval fondni to‘ldiring.");
    }
    return result;
  });
}

export const newEntitlementId = () => randomUUID();
