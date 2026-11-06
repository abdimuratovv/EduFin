import { beforeEach, describe, expect, it } from "vitest";
import { hashPin, verifyPin } from "../../src/server/auth/pin";
import {
  LOCK_MS,
  MAX_FAILED_PINS,
  SESSION_TTL_MS,
  createSession,
  getSession,
  toChildMode,
  unlockParentOrThrow,
} from "../../src/server/auth/sessions";
import { openDb, type Db } from "../../src/server/db/connection";
import { seedDemo, type DemoIds } from "../../src/server/db/seed";
import { DomainError } from "../../src/server/errors";

const PIN = "4821";

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : `OTHER:${String(e)}`;
  }
  return undefined;
}

describe("PIN xeshi", () => {
  it("xeshlanadi, to'g'ri PIN o'tadi, noto'g'ri va bo'sh rad etiladi", () => {
    const h = hashPin(PIN);
    expect(h).not.toContain(PIN);
    expect(verifyPin(PIN, h)).toBe(true);
    expect(verifyPin("0000", h)).toBe(false);
    expect(verifyPin(PIN, null)).toBe(false);
    expect(verifyPin(PIN, "plain")).toBe(false);
    expect(hashPin(PIN)).not.toBe(h); // har safar boshqa tuz
  });
});

describe("sessiya va ota-ona rejimi", () => {
  let db: Db;
  let ids: DemoIds;
  beforeEach(() => {
    db = openDb(":memory:");
    ids = seedDemo(db, PIN);
  });

  it("xom token bazada saqlanmaydi; muddati tugagach sessiya yo'qoladi", () => {
    const { token } = createSession(db, ids.familyId, ids.childId, "child", 1_000);
    const rows = db.prepare("SELECT id FROM sessions").all() as { id: string }[];
    expect(rows.map((r) => r.id)).not.toContain(token);
    expect(getSession(db, token, 1_000 + 10)?.mode).toBe("child");
    expect(getSession(db, token, 1_000 + SESSION_TTL_MS + 1)).toBeNull();
    expect(getSession(db, "uydirma-token")).toBeNull();
    expect(getSession(db, undefined)).toBeNull();
  });

  it("to'g'ri PIN ota-ona rejimini ochadi va eski token bekor bo'ladi", () => {
    const { token } = createSession(db, ids.familyId, ids.childId, "child");
    const session = getSession(db, token)!;
    const unlocked = unlockParentOrThrow(db, session, PIN);
    expect(getSession(db, token)).toBeNull(); // eski token yaroqsiz
    expect(getSession(db, unlocked.token)?.mode).toBe("parent");
  });

  it("bola rejimiga o'tish ota-ona vakolatini yopadi; qaytish PIN talab qiladi", () => {
    const parent = getSession(db, unlockParentOrThrow(db, getSession(db, createSession(db, ids.familyId, ids.childId, "child").token)!, PIN).token)!;
    const child = toChildMode(db, parent);
    expect(getSession(db, child.token)?.mode).toBe("child");
    expect(getSession(db, "x")).toBeNull();
    const again = getSession(db, child.token)!;
    expect(codeOf(() => unlockParentOrThrow(db, again, "0000"))).toBe("WRONG_PIN");
    expect(getSession(db, child.token)?.mode).toBe("child");
  });

  it("noto'g'ri urinishlar sanaladi, limitdan keyin qulf, qulf yangi ulanishda ham saqlanadi", () => {
    const t0 = 5_000_000;
    const session = getSession(db, createSession(db, ids.familyId, ids.childId, "child", t0).token, t0)!;
    for (let i = 1; i < MAX_FAILED_PINS; i++) {
      expect(codeOf(() => unlockParentOrThrow(db, session, "0000", t0))).toBe("WRONG_PIN");
    }
    expect(codeOf(() => unlockParentOrThrow(db, session, "0000", t0))).toBe("LOCKED");
    // qulf paytida to'g'ri PIN ham o'tmaydi
    expect(codeOf(() => unlockParentOrThrow(db, session, PIN, t0 + 1000))).toBe("LOCKED");
    // qulfdan keyin to'g'ri PIN o'tadi
    expect(codeOf(() => unlockParentOrThrow(db, session, PIN, t0 + LOCK_MS + 1))).toBeUndefined();
  });

  it("muvaffaqiyatli kirish urinishlar hisoblagichini tiklaydi; hodisalar audit'ga yoziladi, PIN yozilmaydi", () => {
    const s = () => getSession(db, createSession(db, ids.familyId, ids.childId, "child").token)!;
    for (let i = 0; i < MAX_FAILED_PINS - 1; i++) codeOf(() => unlockParentOrThrow(db, s(), "0000"));
    unlockParentOrThrow(db, s(), PIN);
    expect(db.prepare("SELECT * FROM pin_attempts").all()).toHaveLength(0);
    const log = db.prepare("SELECT event, detail FROM audit_log").all() as { event: string; detail: string | null }[];
    expect(log.map((l) => l.event)).toContain("parent_unlock");
    expect(JSON.stringify(log)).not.toContain(PIN);
  });
});
