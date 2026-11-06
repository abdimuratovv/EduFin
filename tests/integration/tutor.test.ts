import { beforeEach, describe, expect, it } from "vitest";
import { lesson } from "../../src/content/lesson";
import { openDb, type Db } from "../../src/server/db/connection";
import { seedDemo, type DemoIds } from "../../src/server/db/seed";
import { DomainError } from "../../src/server/errors";
import { recordAttempt, startLesson } from "../../src/server/learning/progress";
import { buildUserPrompt, SYSTEM_PROMPT } from "../../src/server/tutor/prompt";
import { MAX_FRESH_AI_PER_TASK, requestHelp } from "../../src/server/tutor/service";
import type { Providers } from "../../src/server/tutor/types";
import { validateTutorText } from "../../src/server/tutor/validate";

const GOOD = "Tushlikda nima yeymiz, o‘ylab ko‘rchi? Ovqat bizga kuch beradi.";
const MP3 = Buffer.alloc(4000, 1);

function fake(over: Partial<{ text: () => Promise<string>; audio: () => Promise<Buffer>; seen: string[] }> = {}): Providers {
  return {
    tutor: {
      generate: async (input) => {
        over.seen?.push(`${input.system}\n${input.user}`);
        return (over.text ?? (async () => GOOD))();
      },
    },
    speech: { synthesize: async () => (over.audio ?? (async () => MP3))() },
  };
}

const statuses = (db: Db) => (db.prepare("SELECT status FROM tutor_requests ORDER BY rowid").all() as { status: string }[]).map((r) => r.status);

describe("AI javobini tekshirish", () => {
  it("sodda o'zbekcha ikki gap o'tadi", () => {
    expect(validateTutorText(GOOD)).toBe(GOOD);
    expect(validateTutorText("  Yaxshi urinish!  Yana o‘ylab ko‘ramizmi?  ")).toBe("Yaxshi urinish! Yana o‘ylab ko‘ramizmi?");
  });

  it("bo'sh, uzun, 3 gap, markup, raqam, moliyaviy so'z va kirill rad etiladi", () => {
    const bad = [
      "",
      null,
      undefined,
      "Ha.",
      "a".repeat(300),
      "Bir. Ikki. Uch gap bor.",
      "**Olma** kerak, o‘ylab ko‘r.",
      "Ro‘yxat:\n- olma\n- soyabon uchun",
      "Senga 2000 ta ball beraman, o‘yla.",
      "Mukofot olish uchun yana o‘ylab ko‘r.",
      "Balansingni ko‘ramiz, o‘ylab ko‘r.",
      "Ovqat kerak, 100 so‘m emas.",
      "Привет, давай подумаем вместе.",
      "Bu havola: https://example.com",
    ];
    for (const b of bad) expect(validateTutorText(b as string)).toBeNull();
  });
});

describe("AIga yuboriladigan ma'lumot", () => {
  it("faqat yosh, dars mazmuni, savol, variantlar, tanlov va urinish holati", () => {
    const task = lesson.tasks[0];
    const p = buildUserPrompt({ age: 5, lesson, task, chosenOptionId: task.options[1].id, wrongAttempts: 1 });
    expect(p).toContain("Child age: 5");
    expect(p).toContain(task.situation);
    expect(p).toContain(task.options[1].label);
    expect(p).toContain("Wrong attempts on this question so far: 1");
    expect(SYSTEM_PROMPT).toMatch(/Never mention money/);
  });
});

describe("requestHelp: haqiqiy AI, zaxira va limitlar", () => {
  let db: Db;
  let ids: DemoIds;
  const ctx = () => ({ familyId: ids.familyId, childId: ids.childId });
  const t1 = lesson.tasks[0];

  beforeEach(() => {
    db = openDb(":memory:");
    ids = seedDemo(db);
    startLesson(db, ids.childId);
  });

  it("AI va ovoz ishlasa: AI matni + yaratilgan audio", async () => {
    const r = await requestHelp(db, ctx(), t1.id, fake());
    expect(r.source).toBe("ai");
    expect(r.text).toBe(GOOD);
    expect(r.audio.kind).toBe("generated");
    expect(r.remainingAi).toBe(MAX_FRESH_AI_PER_TASK - 1);
    expect(statuses(db)).toEqual(["ai"]);
  });

  it("prompt bola ismi, fond va balansni o'z ichiga olmaydi; tanlov va xatolar bazadan olinadi", async () => {
    recordAttempt(db, ids.childId, t1.id, t1.options.find((o) => o.id !== t1.correctOptionId)!.id);
    const seen: string[] = [];
    await requestHelp(db, ctx(), t1.id, fake({ seen }));
    const sent = seen.join("\n");
    expect(sent).not.toContain("Madina");
    expect(sent).not.toMatch(/100000|100 000|98000|2000/);
    expect(sent).not.toMatch(/fond|balans/i);
    expect(sent).toContain("Wrong attempts on this question so far: 1");
    expect(sent).toContain(t1.options.find((o) => o.id !== t1.correctOptionId)!.label);
  });

  it("bir topshiriqda ko'pi bilan 3 ta yangi AI, keyin tayyor ovoz", async () => {
    for (let i = 0; i < MAX_FRESH_AI_PER_TASK; i++) expect((await requestHelp(db, ctx(), t1.id, fake())).source).toBe("ai");
    const r = await requestHelp(db, ctx(), t1.id, fake());
    expect(r.source).toBe("fallback");
    expect(r.audio).toEqual({ kind: "ready", voiceId: `${t1.id}-help` });
    expect(r.text).toBe(t1.help);
    expect(r.remainingAi).toBe(0);
    // boshqa topshiriq o'z limitiga ega
    expect((await requestHelp(db, ctx(), lesson.tasks[1].id, fake())).source).toBe("ai");
  });

  it("AI xatosi, bo'sh va noto'g'ri formatli javob, TTS xatosi: tayyor yordam va aniq holat", async () => {
    const cases: [Providers, string][] = [
      [fake({ text: async () => { throw new Error("503"); } }), "fallback_ai_error"],
      [fake({ text: async () => "" }), "fallback_invalid"],
      [fake({ text: async () => "Bir. Ikki. Uch." }), "fallback_invalid"],
      [fake({ audio: async () => { throw new Error("tts down"); } }), "fallback_audio_error"],
    ];
    for (const [providers, status] of cases) {
      const r = await requestHelp(db, ctx(), t1.id, providers);
      expect(r.source).toBe("fallback");
      expect(r.audio.kind).toBe("ready");
      expect(statuses(db).at(-1)).toBe(status);
    }
    // xatolar yangi AI limitini sarflamaydi
    expect((await requestHelp(db, ctx(), t1.id, fake())).remainingAi).toBe(MAX_FRESH_AI_PER_TASK - 1);
  });

  it("javob kelmasa belgilangan muddatdan keyin tayyor yordam (signalni hurmat qilmasa ham)", async () => {
    const hang = fake({ text: () => new Promise<string>(() => undefined) });
    const t0 = Date.now();
    const r = await requestHelp(db, ctx(), t1.id, hang, { deadlineMs: 60 });
    expect(r.source).toBe("fallback");
    expect(Date.now() - t0).toBeLessThan(1500);
    expect(statuses(db).at(-1)).toBe("fallback_timeout");
  });

  it("so'rov paytida qayta bosish bloklanadi, tugagach yana mumkin", async () => {
    let release!: () => void;
    const slow = fake({ text: () => new Promise<string>((res) => { release = () => res(GOOD); }) });
    const first = requestHelp(db, ctx(), t1.id, slow);
    await new Promise((r) => setTimeout(r, 10));
    await expect(requestHelp(db, ctx(), t1.id, fake())).rejects.toMatchObject({ code: "BUSY" });
    release();
    expect((await first).source).toBe("ai");
    expect((await requestHelp(db, ctx(), t1.id, fake())).source).toBe("ai");
  });

  it("provayder sozlanmagan bo'lsa tayyor yordam va 'not_configured' holati", async () => {
    const r = await requestHelp(db, ctx(), t1.id, null);
    expect(r.source).toBe("fallback");
    expect(statuses(db)).toEqual(["fallback_not_configured"]);
  });

  it("dars boshlanmagan yoki topshiriq noma'lum bo'lsa rad etiladi", async () => {
    const other = openDb(":memory:");
    const o = seedDemo(other);
    await expect(requestHelp(other, { familyId: o.familyId, childId: o.childId }, t1.id, fake())).rejects.toBeInstanceOf(DomainError);
    await expect(requestHelp(db, ctx(), "nope", fake())).rejects.toMatchObject({ code: "INVALID_TASK" });
  });
});
