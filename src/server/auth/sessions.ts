import { createHash, randomBytes, randomUUID } from "node:crypto";
import { DomainError } from "../errors";
import { immediate, type Db } from "../db/connection";
import { hashPin, verifyPin } from "./pin";

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const MAX_FAILED_PINS = 5;
export const LOCK_MS = 5 * 60 * 1000;

export type Mode = "parent" | "child";

export interface Session {
  /** Tokenning SHA-256 xeshi (bazadagi kalit). Xom token faqat cookie'da. */
  id: string;
  familyId: string;
  childId: string | null;
  mode: Mode;
  expiresAt: string;
}

const sha = (token: string) => createHash("sha256").update(token).digest("hex");

export function audit(db: Db, familyId: string, event: string, detail?: string): void {
  db.prepare("INSERT INTO audit_log (id, family_id, event, detail, created_at) VALUES (?, ?, ?, ?, ?)").run(
    randomUUID(),
    familyId,
    event,
    detail ?? null,
    new Date().toISOString(),
  );
}

/** Yangi sessiya; xom tokenni qaytaradi (faqat bir marta). */
export function createSession(db: Db, familyId: string, childId: string, mode: Mode, now = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date(now).toISOString());
  db.prepare("INSERT INTO sessions (id, family_id, child_id, mode, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    sha(token),
    familyId,
    childId,
    mode,
    new Date(now).toISOString(),
    new Date(now + SESSION_TTL_MS).toISOString(),
  );
  return { token, maxAgeSeconds: SESSION_TTL_MS / 1000 };
}

export function getSession(db: Db, token: string | undefined, now = Date.now()): Session | null {
  if (!token || token.length > 200) return null;
  const row = db
    .prepare("SELECT id, family_id AS familyId, child_id AS childId, mode, expires_at AS expiresAt FROM sessions WHERE id = ?")
    .get(sha(token)) as Session | undefined;
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() <= now) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(row.id);
    return null;
  }
  return row;
}

export function deleteSession(db: Db, sessionId: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

/** Rejim o'zgarganda eski token bekor qilinadi, yangi token beriladi (sessiyani qotirish hujumiga qarshi). */
export function switchMode(db: Db, session: Session, mode: Mode, now = Date.now()) {
  if (!session.childId) throw new DomainError("BAD_REQUEST", "Sessiyada bola profili yo‘q.");
  return immediate(db, () => {
    deleteSession(db, session.id);
    return createSession(db, session.familyId, session.childId!, mode, now);
  });
}

export function toChildMode(db: Db, session: Session, now = Date.now()) {
  const result = switchMode(db, session, "child", now);
  audit(db, session.familyId, "mode_child");
  return result;
}

/** Ota-ona rejimini PIN bilan ochish. Urinishlar serverda sanaladi va cheklanadi. */
export function unlockParent(db: Db, session: Session, pin: string, now = Date.now()) {
  return immediate(db, () => {
    const attempts = db
      .prepare("SELECT failed_count AS failed, locked_until AS lockedUntil FROM pin_attempts WHERE family_id = ?")
      .get(session.familyId) as { failed: number; lockedUntil: string | null } | undefined;

    if (attempts?.lockedUntil && new Date(attempts.lockedUntil).getTime() > now) {
      const secs = Math.ceil((new Date(attempts.lockedUntil).getTime() - now) / 1000);
      throw new DomainError("LOCKED", `Juda ko‘p noto‘g‘ri urinish. ${Math.ceil(secs / 60)} daqiqadan keyin qayta urinib ko‘ring.`);
    }

    const parent = db.prepare("SELECT pin_hash AS h FROM parents WHERE family_id = ?").get(session.familyId) as
      | { h: string | null }
      | undefined;
    const ok = verifyPin(pin, parent?.h ?? null);
    const iso = new Date(now).toISOString();

    if (!ok) {
      const failed = (attempts?.failed ?? 0) + 1;
      const locked = failed >= MAX_FAILED_PINS;
      db.prepare(
        `INSERT INTO pin_attempts (family_id, failed_count, locked_until, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (family_id) DO UPDATE SET failed_count = excluded.failed_count, locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
      ).run(session.familyId, locked ? 0 : failed, locked ? new Date(now + LOCK_MS).toISOString() : null, iso);
      audit(db, session.familyId, locked ? "parent_unlock_locked" : "parent_unlock_failed");
      // Xato javob tranzaksiyani bekor qilmasligi uchun natija qaytariladi, xato tashqarida otiladi.
      return { ok: false as const, remaining: Math.max(0, MAX_FAILED_PINS - failed), locked };
    }

    db.prepare("DELETE FROM pin_attempts WHERE family_id = ?").run(session.familyId);
    deleteSession(db, session.id);
    const created = createSession(db, session.familyId, session.childId!, "parent", now);
    audit(db, session.familyId, "parent_unlock");
    return { ok: true as const, ...created };
  });
}

/** unlockParent natijasini xatoga aylantiradi. */
export function unlockParentOrThrow(db: Db, session: Session, pin: string, now = Date.now()) {
  const r = unlockParent(db, session, pin, now);
  if (r.ok) return r;
  if (r.locked) throw new DomainError("LOCKED", "Juda ko‘p noto‘g‘ri urinish. 5 daqiqadan keyin qayta urinib ko‘ring.");
  throw new DomainError("WRONG_PIN", `Kod noto‘g‘ri. Yana ${r.remaining} ta urinish qoldi.`);
}

/** Demo ota-onaning PIN xeshini muhitdagi PIN bilan moslaydi. */
export function ensureParentPin(db: Db, familyId: string, pin: string): void {
  const row = db.prepare("SELECT pin_hash AS h FROM parents WHERE family_id = ?").get(familyId) as { h: string | null } | undefined;
  if (row && !verifyPin(pin, row.h)) {
    db.prepare("UPDATE parents SET pin_hash = ? WHERE family_id = ?").run(hashPin(pin), familyId);
  }
}
