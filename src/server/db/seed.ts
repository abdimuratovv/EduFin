import { randomUUID } from "node:crypto";
import { lesson } from "../../content/lesson";
import { topUp } from "../rewards/ledger";
import { setRewardRule } from "../rewards/rewards";
import { immediate, type Db } from "./connection";

export const DEMO_TOPUP = 100_000;
export const DEMO_REWARD = 2_000;

export interface DemoIds {
  familyId: string;
  parentId: string;
  childId: string;
}

/** Demo oila, 5 yoshli bola, mukofot qoidasi va fondning birinchi top-up'i. Qayta chaqirilsa mavjudni qaytaradi. */
export function seedDemo(db: Db): DemoIds {
  const existing = db
    .prepare(
      "SELECT f.id AS familyId, p.id AS parentId, c.id AS childId FROM families f JOIN parents p ON p.family_id = f.id JOIN child_profiles c ON c.family_id = f.id LIMIT 1",
    )
    .get() as DemoIds | undefined;
  if (existing) return existing;

  const ids: DemoIds = { familyId: randomUUID(), parentId: randomUUID(), childId: randomUUID() };
  const now = new Date().toISOString();
  immediate(db, () => {
    db.prepare("INSERT INTO families (id, name, created_at) VALUES (?, ?, ?)").run(ids.familyId, "Demo oila", now);
    db.prepare("INSERT INTO parents (id, family_id, display_name, created_at) VALUES (?, ?, ?, ?)").run(ids.parentId, ids.familyId, "Demo ota-ona", now);
    db.prepare("INSERT INTO child_profiles (id, family_id, name, avatar, age, created_at) VALUES (?, ?, ?, ?, 5, ?)").run(ids.childId, ids.familyId, "Madina", "bilimcha", now);
  });
  setRewardRule(db, ids.familyId, lesson.id, DEMO_REWARD);
  topUp(db, ids.familyId, DEMO_TOPUP, `seed-topup-${ids.familyId}`);
  return ids;
}
