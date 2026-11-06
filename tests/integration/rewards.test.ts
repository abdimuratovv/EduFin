import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { lesson } from "../../src/content/lesson";
import { immediate, openDb, type Db } from "../../src/server/db/connection";
import { DEMO_REWARD, DEMO_TOPUP, seedDemo, type DemoIds } from "../../src/server/db/seed";
import { DomainError } from "../../src/server/errors";
import { completeLesson, recordAttempt, startLesson } from "../../src/server/learning/progress";
import { getBalances, listLedger, topUp, transferInTx, verifyLedger } from "../../src/server/rewards/ledger";
import { listEntitlements, setRewardRule, settleReward } from "../../src/server/rewards/rewards";

function solveAll(db: Db, childId: string) {
  for (const t of lesson.tasks) recordAttempt(db, childId, t.id, t.correctOptionId);
}

function wrongOption(taskIndex: number) {
  const t = lesson.tasks[taskIndex];
  return t.options.find((o) => o.id !== t.correctOptionId)!.id;
}

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : `OTHER:${String(e)}`;
  }
  return undefined;
}

/** Fondsiz yangi oila (fond yetishmasligi holati uchun). */
function emptyFamily(db: Db, reward = DEMO_REWARD) {
  const ids = { familyId: randomUUID(), childId: randomUUID() };
  const now = new Date().toISOString();
  db.prepare("INSERT INTO families (id, name, created_at) VALUES (?, 'F2', ?)").run(ids.familyId, now);
  db.prepare("INSERT INTO child_profiles (id, family_id, name, avatar, age, created_at) VALUES (?, ?, 'Ali', 'bilimcha', 5, ?)").run(ids.childId, ids.familyId, now);
  setRewardRule(db, ids.familyId, lesson.id, reward);
  return ids;
}

describe("demo oqimi: ota-ona → bola → mukofot", () => {
  let db: Db;
  let ids: DemoIds;
  beforeEach(() => {
    db = openDb(":memory:");
    ids = seedDemo(db);
  });

  it("seed: fond 100 000, bola 0, top-up hisob orqali yaratilgan", () => {
    expect(getBalances(db, ids.familyId, ids.childId)).toEqual({ fund: DEMO_TOPUP, child: 0 });
    expect(listLedger(db, ids.familyId)).toHaveLength(1);
    expect(seedDemo(db)).toEqual(ids); // qayta seed yangi oila yaratmaydi
  });

  it("xato javob, qayta urinish, uchta to'g'ri javob → fond 98 000, bola 2 000", () => {
    const start = startLesson(db, ids.childId);
    expect(start.fundSufficient).toBe(true);
    expect(start.progress.rewardAmount).toBe(DEMO_REWARD);

    const wrong = recordAttempt(db, ids.childId, lesson.tasks[0].id, wrongOption(0));
    expect(wrong.correct).toBe(false);
    expect(wrong.completedTasks).toEqual([]);
    expect(codeOf(() => completeLesson(db, ids.childId))).toBe("LESSON_INCOMPLETE");

    solveAll(db, ids.childId);
    const done = completeLesson(db, ids.childId);
    expect(done.entitlement?.status).toBe("paid");
    expect(getBalances(db, ids.familyId, ids.childId)).toEqual({ fund: 98_000, child: 2_000 });
    expect(verifyLedger(db, ids.familyId)).toEqual({ ok: true, problems: [] });
    const rewards = listLedger(db, ids.familyId).filter((t) => t.type === "REWARD");
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ sourceAccount: "fund", destAccount: `child:${ids.childId}`, amount: 2_000 });
  });

  it("takroriy tugatish va darsni takrorlash qo'shimcha mukofot bermaydi", () => {
    startLesson(db, ids.childId);
    solveAll(db, ids.childId);
    completeLesson(db, ids.childId);
    const again = completeLesson(db, ids.childId);
    expect(again.alreadyCompleted).toBe(true);

    startLesson(db, ids.childId); // darsni qayta ochish
    solveAll(db, ids.childId);
    completeLesson(db, ids.childId);

    expect(getBalances(db, ids.familyId, ids.childId)).toEqual({ fund: 98_000, child: 2_000 });
    expect(listEntitlements(db, ids.familyId)).toHaveLength(1);
    expect(listLedger(db, ids.familyId).filter((t) => t.type === "REWARD")).toHaveLength(1);
  });

  it("boshlangan dars mukofoti keyingi qoida o'zgarishidan ta'sirlanmaydi", () => {
    startLesson(db, ids.childId);
    setRewardRule(db, ids.familyId, lesson.id, 9_000);
    solveAll(db, ids.childId);
    expect(completeLesson(db, ids.childId).entitlement?.amount).toBe(DEMO_REWARD);
    expect(getBalances(db, ids.familyId, ids.childId).child).toBe(DEMO_REWARD);
  });

  it("noto'g'ri variant va topshiriq rad etiladi; dars boshlanmasdan javob yo'q", () => {
    expect(codeOf(() => recordAttempt(db, ids.childId, lesson.tasks[0].id, lesson.tasks[0].correctOptionId))).toBe("LESSON_NOT_STARTED");
    startLesson(db, ids.childId);
    expect(codeOf(() => recordAttempt(db, ids.childId, "nope", "x"))).toBe("INVALID_TASK");
    expect(codeOf(() => recordAttempt(db, ids.childId, lesson.tasks[0].id, "nope"))).toBe("INVALID_OPTION");
  });
});

describe("fond yetishmasligi", () => {
  it("dars saqlanadi, mukofot pending; top-updan keyin ota-ona bir marta to'laydi", () => {
    const db = openDb(":memory:");
    seedDemo(db);
    const { familyId, childId } = emptyFamily(db);

    expect(startLesson(db, childId).fundSufficient).toBe(false); // oldindan ko'rsatiladi
    solveAll(db, childId);
    const done = completeLesson(db, childId);
    expect(done.entitlement?.status).toBe("pending");
    expect(getBalances(db, familyId, childId)).toEqual({ fund: 0, child: 0 });

    const entId = done.entitlement!.id;
    expect(codeOf(() => settleReward(db, familyId, entId))).toBe("INSUFFICIENT_FUND");

    topUp(db, familyId, 5_000, "k1");
    const paid = settleReward(db, familyId, entId);
    expect(paid.status).toBe("paid");
    settleReward(db, familyId, entId); // takroriy bosish
    expect(getBalances(db, familyId, childId)).toEqual({ fund: 3_000, child: 2_000 });
    expect(listLedger(db, familyId).filter((t) => t.type === "REWARD")).toHaveLength(1);
    expect(verifyLedger(db, familyId).ok).toBe(true);
  });

  it("boshqa oila huquqini to'lab bo'lmaydi", () => {
    const db = openDb(":memory:");
    const demo = seedDemo(db);
    const other = emptyFamily(db);
    startLesson(db, other.childId);
    solveAll(db, other.childId);
    const ent = completeLesson(db, other.childId).entitlement!;
    expect(codeOf(() => settleReward(db, demo.familyId, ent.id))).toBe("NOT_FOUND");
  });
});

describe("hisob izchilligi", () => {
  let db: Db;
  let ids: DemoIds;
  beforeEach(() => {
    db = openDb(":memory:");
    ids = seedDemo(db);
  });

  it("nol, manfiy, kasr, NaN, juda katta va satr summalar rad etiladi", () => {
    for (const bad of [0, -5, 1.5, Number.NaN, Infinity, 10_000_001, "100" as unknown as number]) {
      expect(codeOf(() => topUp(db, ids.familyId, bad, `bad-${String(bad)}`))).toBe("INVALID_AMOUNT");
    }
    expect(listLedger(db, ids.familyId)).toHaveLength(1);
  });

  it("bir xil kalit + bir xil mazmun: bitta yozuv; boshqa mazmun: konflikt", () => {
    const a = topUp(db, ids.familyId, 1_000, "same");
    const b = topUp(db, ids.familyId, 1_000, "same");
    expect(b.replayed).toBe(true);
    expect(b.id).toBe(a.id);
    expect(getBalances(db, ids.familyId, ids.childId).fund).toBe(DEMO_TOPUP + 1_000);
    expect(codeOf(() => topUp(db, ids.familyId, 2_000, "same"))).toBe("IDEMPOTENCY_CONFLICT");
    expect(getBalances(db, ids.familyId, ids.childId).fund).toBe(DEMO_TOPUP + 1_000);
  });

  it("fond manfiyga tushmaydi", () => {
    const code = codeOf(() =>
      immediate(db, () =>
        transferInTx(db, {
          familyId: ids.familyId,
          type: "REWARD",
          source: "fund",
          dest: `child:${ids.childId}`,
          amount: DEMO_TOPUP + 1,
          key: "overdraw",
        }),
      ),
    );
    expect(code).toBe("INSUFFICIENT_FUND");
    expect(getBalances(db, ids.familyId, ids.childId).fund).toBe(DEMO_TOPUP);
  });

  it("tranzaksiya xatoda to'liq orqaga qaytariladi (rollback)", () => {
    expect(() =>
      immediate(db, () => {
        transferInTx(db, { familyId: ids.familyId, type: "TOPUP", source: "external", dest: "fund", amount: 500, key: "rb" });
        throw new Error("o'rtada xato");
      }),
    ).toThrow("o'rtada xato");
    expect(listLedger(db, ids.familyId)).toHaveLength(1);
    expect(getBalances(db, ids.familyId, ids.childId).fund).toBe(DEMO_TOPUP);
  });
});

describe("parallel so'rovlar (ikki alohida ulanish, bitta fayl)", () => {
  let dir: string;
  let a: Db;
  let b: Db;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "edufin-"));
  });
  afterEach(() => {
    a?.close();
    b?.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("ikki ulanishdan bir vaqtdagi tugatish bitta mukofot beradi", () => {
    const path = join(dir, "t.db");
    a = openDb(path);
    const ids = seedDemo(a);
    b = openDb(path);
    startLesson(a, ids.childId);
    solveAll(a, ids.childId);

    const r1 = completeLesson(a, ids.childId);
    const r2 = completeLesson(b, ids.childId);
    expect(r1.entitlement?.id).toBe(r2.entitlement?.id);
    expect(getBalances(b, ids.familyId, ids.childId)).toEqual({ fund: 98_000, child: 2_000 });
    expect(listLedger(a, ids.familyId).filter((t) => t.type === "REWARD")).toHaveLength(1);
    expect(verifyLedger(b, ids.familyId).ok).toBe(true);
  });

  it("ikki ulanishdan bir xil top-up kaliti bitta yozuv yaratadi", () => {
    const path = join(dir, "t2.db");
    a = openDb(path);
    const ids = seedDemo(a);
    b = openDb(path);
    topUp(a, ids.familyId, 700, "dup");
    topUp(b, ids.familyId, 700, "dup");
    expect(getBalances(a, ids.familyId, ids.childId).fund).toBe(DEMO_TOPUP + 700);
  });
});
