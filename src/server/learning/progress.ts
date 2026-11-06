import { randomUUID } from "node:crypto";
import { lesson as defaultLesson, type Lesson } from "../../content/lesson";
import { DomainError } from "../errors";
import { immediate, type Db } from "../db/connection";
import { accountBalance } from "../rewards/ledger";
import { getRewardRule, newEntitlementId, tryPayInTx, type Entitlement } from "../rewards/rewards";

interface ProgressRow {
  id: string;
  childId: string;
  lessonId: string;
  lessonVersion: number;
  rewardAmount: number;
  startedAt: string;
  completedAt: string | null;
}

const PCOLS = `id, child_id AS childId, lesson_id AS lessonId, lesson_version AS lessonVersion,
  reward_amount AS rewardAmount, started_at AS startedAt, completed_at AS completedAt`;

function childFamily(db: Db, childId: string): string {
  const r = db.prepare("SELECT family_id AS f FROM child_profiles WHERE id = ?").get(childId) as { f: string } | undefined;
  if (!r) throw new DomainError("NOT_FOUND", "Bola profili topilmadi.");
  return r.f;
}

function getProgress(db: Db, childId: string, l: Lesson): ProgressRow | undefined {
  return db
    .prepare(`SELECT ${PCOLS} FROM lesson_progress WHERE child_id = ? AND lesson_id = ? AND lesson_version = ?`)
    .get(childId, l.id, l.version) as ProgressRow | undefined;
}

export function completedTaskIds(db: Db, progressId: string): string[] {
  return (
    db.prepare("SELECT DISTINCT task_id AS t FROM attempts WHERE progress_id = ? AND correct = 1").all(progressId) as { t: string }[]
  ).map((r) => r.t);
}

/** Darsni boshlash: mukofot miqdori snapshot qilinadi. Qayta chaqirilsa mavjud holat (snapshot o'zgarmaydi). */
export function startLesson(db: Db, childId: string, l: Lesson = defaultLesson) {
  return immediate(db, () => {
    const familyId = childFamily(db, childId);
    let p = getProgress(db, childId, l);
    if (!p) {
      const amount = getRewardRule(db, familyId, l.id) ?? 0;
      db.prepare(
        "INSERT INTO lesson_progress (id, child_id, lesson_id, lesson_version, reward_amount, started_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(randomUUID(), childId, l.id, l.version, amount, new Date().toISOString());
      p = getProgress(db, childId, l)!;
    }
    const fundBalance = accountBalance(db, familyId, "fund");
    return {
      progress: p,
      completedTasks: completedTaskIds(db, p.id),
      /** Dars boshida fond yetishmasligi oldindan ko'rsatiladi. */
      fundSufficient: p.completedAt !== null || fundBalance >= p.rewardAmount,
    };
  });
}

/** Javobni server baholaydi. To'g'ri javob mijozdan olinmaydi. */
export function recordAttempt(db: Db, childId: string, taskId: string, optionId: string, l: Lesson = defaultLesson) {
  return immediate(db, () => {
    const p = getProgress(db, childId, l);
    if (!p) throw new DomainError("LESSON_NOT_STARTED", "Dars hali boshlanmagan.");
    const task = l.tasks.find((t) => t.id === taskId);
    if (!task) throw new DomainError("INVALID_TASK", "Topshiriq topilmadi.");
    if (!task.options.some((o) => o.id === optionId)) throw new DomainError("INVALID_OPTION", "Variant topilmadi.");
    const correct = optionId === task.correctOptionId;
    db.prepare("INSERT INTO attempts (id, progress_id, task_id, option_id, correct, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      randomUUID(),
      p.id,
      taskId,
      optionId,
      correct ? 1 : 0,
      new Date().toISOString(),
    );
    return { correct, feedback: correct ? task.correct : task.wrong, completedTasks: completedTaskIds(db, p.id) };
  });
}

/**
 * Darsni tugatish: barcha topshiriqlar to'g'ri bajarilganini tekshiradi, bitta mukofot huquqi yaratadi
 * va fond yetarli bo'lsa o'sha tranzaksiyada to'laydi. Takroriy chaqiruv yangi mukofot bermaydi.
 */
export function completeLesson(
  db: Db,
  childId: string,
  l: Lesson = defaultLesson,
): { entitlement: Entitlement | null; alreadyCompleted: boolean } {
  return immediate(db, () => {
    const familyId = childFamily(db, childId);
    const p = getProgress(db, childId, l);
    if (!p) throw new DomainError("LESSON_NOT_STARTED", "Dars hali boshlanmagan.");
    const done = new Set(completedTaskIds(db, p.id));
    if (!l.tasks.every((t) => done.has(t.id))) {
      throw new DomainError("LESSON_INCOMPLETE", "Barcha topshiriqlar bajarilmagan.");
    }

    const alreadyCompleted = p.completedAt !== null;
    if (!alreadyCompleted) {
      db.prepare("UPDATE lesson_progress SET completed_at = ? WHERE id = ?").run(new Date().toISOString(), p.id);
    }

    if (p.rewardAmount <= 0) return { entitlement: null, alreadyCompleted };
    let ent = db
      .prepare("SELECT id FROM reward_entitlements WHERE child_id = ? AND lesson_id = ? AND lesson_version = ?")
      .get(childId, l.id, l.version) as { id: string } | undefined;
    if (!ent) {
      const id = newEntitlementId();
      db.prepare(
        "INSERT INTO reward_entitlements (id, family_id, child_id, lesson_id, lesson_version, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)",
      ).run(id, familyId, childId, l.id, l.version, p.rewardAmount, new Date().toISOString());
      ent = { id };
    }
    return { entitlement: tryPayInTx(db, ent.id), alreadyCompleted };
  });
}
