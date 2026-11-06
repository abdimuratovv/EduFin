import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PIN = "4821";
const ORIGIN = "http://localhost:3000";
let dir: string;
let demo: (r: Request) => Promise<Response>;
let unlock: (r: Request) => Promise<Response>;
let toChild: (r: Request) => Promise<Response>;
let dashboard: (r: Request) => Promise<Response>;
let sessionGet: (r: Request) => Promise<Response>;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "edufin-http-"));
  process.env.DATABASE_PATH = join(dir, "http.db");
  process.env.PARENT_DEMO_PIN = PIN;
  demo = (await import("../../src/app/api/demo/session/route")).POST;
  unlock = (await import("../../src/app/api/parent/unlock/route")).POST;
  toChild = (await import("../../src/app/api/mode/child/route")).POST;
  dashboard = (await import("../../src/app/api/parent/dashboard/route")).GET;
  sessionGet = (await import("../../src/app/api/session/route")).GET;
});

afterAll(() => {
  const g = globalThis as unknown as { __edufinDb?: { close(): void } };
  g.__edufinDb?.close();
  rmSync(dir, { recursive: true, force: true });
});

const post = (path: string, body?: unknown, cookie?: string, origin: string | null = ORIGIN) =>
  new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      host: "localhost:3000",
      "content-type": "application/json",
      ...(origin ? { origin } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const get = (path: string, cookie?: string) =>
  new Request(`${ORIGIN}${path}`, { headers: { host: "localhost:3000", ...(cookie ? { cookie } : {}) } });

function cookieOf(res: Response): { header: string; pair: string } {
  const header = res.headers.get("set-cookie")!;
  return { header, pair: header.split(";")[0] };
}

async function startDemo() {
  const res = await demo(post("/api/demo/session"));
  expect(res.status).toBe(200);
  return cookieOf(res);
}

describe("sessiya cookie va rejimlar", () => {
  it("demo sessiya bola rejimida boshlanadi, cookie HttpOnly va SameSite", async () => {
    const c = await startDemo();
    expect(c.header).toContain("HttpOnly");
    expect(c.header).toContain("SameSite=Lax");
    expect(c.header).not.toContain("Secure"); // http://localhost
    const me = await (await sessionGet(get("/api/session", c.pair))).json();
    expect(me.data.mode).toBe("child");
  });

  it("sessiyasiz so'rov 401, bola sessiyasi ota-ona API'sida 403 (UI tugmasiga bog'liq emas)", async () => {
    expect((await dashboard(get("/api/parent/dashboard"))).status).toBe(401);
    const c = await startDemo();
    const res = await dashboard(get("/api/parent/dashboard", c.pair));
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN");
  });

  it("noto'g'ri PIN 401; to'g'ri PIN ota-ona rejimini ochadi; bola rejimiga o'tgach yana 403", async () => {
    const c = await startDemo();
    const bad = await unlock(post("/api/parent/unlock", { pin: "0000" }, c.pair));
    expect(bad.status).toBe(401);
    expect(bad.headers.get("set-cookie")).toBeNull();

    const ok = await unlock(post("/api/parent/unlock", { pin: PIN }, c.pair));
    expect(ok.status).toBe(200);
    const parent = cookieOf(ok);
    expect(parent.pair).not.toBe(c.pair); // token almashtirilgan

    const dash = await dashboard(get("/api/parent/dashboard", parent.pair));
    expect(dash.status).toBe(200);
    expect((await dash.json()).data.balances).toEqual({ fund: 100000, child: 0 });
    // eski bola tokeni ota-ona vakolatini olmagan
    expect((await dashboard(get("/api/parent/dashboard", c.pair))).status).toBe(401);

    const back = await toChild(post("/api/mode/child", undefined, parent.pair));
    expect(back.status).toBe(200);
    const child = cookieOf(back);
    expect((await dashboard(get("/api/parent/dashboard", child.pair))).status).toBe(403);
    expect((await dashboard(get("/api/parent/dashboard", parent.pair))).status).toBe(401); // eski ota-ona tokeni bekor
  });
});

describe("kirish chegaralari", () => {
  it("boshqa kelib chiqish yoki Origin'siz yozuvchi so'rov rad etiladi", async () => {
    const c = await startDemo();
    for (const origin of ["http://evil.example", null, "nonsense"]) {
      const res = await unlock(post("/api/parent/unlock", { pin: PIN }, c.pair, origin));
      expect(res.status).toBe(403);
      expect((await res.json()).error.code).toBe("BAD_ORIGIN");
    }
    expect((await demo(post("/api/demo/session", undefined, undefined, "http://evil.example"))).status).toBe(403);
  });

  it("noto'g'ri shakldagi so'rov 400; javobda PIN yoki xom xato matni yo'q", async () => {
    const c = await startDemo();
    const res = await unlock(post("/api/parent/unlock", { pin: 1234 }, c.pair));
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).not.toContain("ZodError");
    expect(text).not.toContain(PIN);
    const bad = await unlock(
      new Request(`${ORIGIN}/api/parent/unlock`, {
        method: "POST",
        headers: { host: "localhost:3000", origin: ORIGIN, cookie: c.pair },
        body: "{buzuq",
      }),
    );
    expect(bad.status).toBe(400);
  });
});
