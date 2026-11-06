import "server-only";
import type { ZodType } from "zod";
import { getSession, type Session } from "./auth/sessions";
import { getDb } from "./db";
import type { Db } from "./db/connection";
import { DomainError, type ErrorCode } from "./errors";

export const COOKIE_NAME = "edufin_session";

const STATUS: Record<ErrorCode, number> = {
  INVALID_AMOUNT: 400,
  INSUFFICIENT_FUND: 409,
  IDEMPOTENCY_CONFLICT: 409,
  NOT_FOUND: 404,
  LESSON_NOT_STARTED: 409,
  LESSON_INCOMPLETE: 409,
  INVALID_TASK: 400,
  INVALID_OPTION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  WRONG_PIN: 401,
  LOCKED: 429,
  BAD_ORIGIN: 403,
  BAD_REQUEST: 400,
};

type Role = "none" | "any" | "parent" | "child";

export interface Ctx<B> {
  db: Db;
  req: Request;
  session: Session | null;
  body: B;
  params: Record<string, string>;
  /** Sessiya cookie'sini o'rnatish (token) yoki o'chirish (null). */
  setSession(token: string | null, maxAgeSeconds?: number): void;
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return Response.json({ ok: true, data }, init);
}

function fail(code: ErrorCode, message: string): Response {
  return Response.json({ ok: false, error: { code, message } }, { status: STATUS[code] });
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

export function cookieHeader(req: Request, token: string | null, maxAgeSeconds = 0): string {
  const https = new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const attrs = ["Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${token ? maxAgeSeconds : 0}`];
  if (https) attrs.push("Secure");
  return `${COOKIE_NAME}=${token ?? ""}; ${attrs.join("; ")}`;
}

/** Yozuvchi so'rovlar faqat shu ilovaning o'z kelib chiqishidan (Origin = Host) qabul qilinadi. */
export function originAllowed(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Barcha API route'lar uchun yagona o'ram: Origin tekshiruvi, sessiya, rol, so'rov shakli (Zod),
 * va xatolarni bir xil formatda qaytarish. Rol server tomonida sessiya rejimidan olinadi.
 */
export function route<B = undefined>(
  opts: { role: Role; schema?: ZodType<B> },
  fn: (ctx: Ctx<B>) => Promise<unknown> | unknown,
) {
  return async (req: Request, rc?: { params?: Promise<Record<string, string>> }): Promise<Response> => {
    try {
      if (!originAllowed(req)) return fail("BAD_ORIGIN", "So‘rov manzili ruxsat etilmagan.");
      const db = getDb();
      const session = getSession(db, readCookie(req.headers.get("cookie"), COOKIE_NAME));

      if (opts.role !== "none") {
        if (!session) return fail("UNAUTHENTICATED", "Avval demoni boshlang.");
        if (opts.role === "parent" && session.mode !== "parent") return fail("FORBIDDEN", "Bu amal faqat ota-ona rejimida mumkin.");
        if (opts.role === "child" && session.mode !== "child") return fail("FORBIDDEN", "Bu amal faqat bola rejimida mumkin.");
      }

      let body = undefined as B;
      if (opts.schema) {
        const raw: unknown = await req.json().catch(() => undefined);
        const parsed = opts.schema.safeParse(raw);
        if (!parsed.success) return fail("BAD_REQUEST", "So‘rov noto‘g‘ri.");
        body = parsed.data;
      }

      const cookies: string[] = [];
      const result = await fn({
        db,
        req,
        session,
        body,
        params: (await rc?.params) ?? {},
        setSession: (token, maxAge) => cookies.push(cookieHeader(req, token, maxAge)),
      });
      const res = json(result);
      for (const c of cookies) res.headers.append("Set-Cookie", c);
      return res;
    } catch (e) {
      if (e instanceof DomainError) return fail(e.code, e.message);
      console.error("API xatosi:", e instanceof Error ? e.name : "noma'lum"); // so'rov mazmuni va maxfiy qiymatlar yozilmaydi
      return Response.json({ ok: false, error: { code: "INTERNAL", message: "Ichki xatolik. Qayta urinib ko‘ring." } }, { status: 500 });
    }
  };
}
