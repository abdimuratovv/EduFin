import { randomUUID } from "node:crypto";
import { lesson as defaultLesson, type Lesson } from "../../content/lesson";
import { DomainError } from "../errors";
import type { Db } from "../db/connection";
import { getProgress } from "../learning/progress";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import type { HelpResult, Providers } from "./types";
import { validateTutorText } from "./validate";

export const MAX_FRESH_AI_PER_TASK = 3;
export const DEADLINE_MS = 10_000;

type FallbackStatus =
  | "fallback_limit"
  | "fallback_not_configured"
  | "fallback_ai_error"
  | "fallback_audio_error"
  | "fallback_invalid"
  | "fallback_timeout";

/** Bir bola + topshiriq uchun bir vaqtda faqat bitta so'rov (qayta bosishni serverda ham bloklaydi). */
const inFlight = new Set<string>();

function record(db: Db, familyId: string, childId: string, taskId: string, status: "ai" | FallbackStatus, started: number) {
  db.prepare("INSERT INTO tutor_requests (id, family_id, child_id, task_id, status, latency_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    randomUUID(),
    familyId,
    childId,
    taskId,
    status,
    Date.now() - started,
    new Date().toISOString(),
  );
  // Texnik log: ai / fallback / audio_error holatlari ajratiladi; mazmun va kalitlar yozilmaydi.
  console.info(`[tutor] status=${status} ms=${Date.now() - started}`);
}

function freshAiCount(db: Db, childId: string, taskId: string): number {
  return (db.prepare("SELECT COUNT(*) AS c FROM tutor_requests WHERE child_id = ? AND task_id = ? AND status = 'ai'").get(childId, taskId) as { c: number }).c;
}

/** Umumiy 10 soniyalik chegara: provayder signalni hurmat qilmasa ham kutish tugaydi. */
function withDeadline<T>(p: Promise<T>, controller: AbortController, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new DOMException("deadline", "TimeoutError"));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * "Tushuntirib ber". Haqiqiy AI + ovoz; xato, noto'g'ri format, limit yoki 10 soniyadan keyin
 * tayyor ovozli yordam. Bola yordamsiz qolmaydi.
 */
export async function requestHelp(
  db: Db,
  ctx: { familyId: string; childId: string },
  taskId: string,
  providers: Providers | null,
  opts: { deadlineMs?: number; lesson?: Lesson } = {},
): Promise<HelpResult> {
  const l = opts.lesson ?? defaultLesson;
  const task = l.tasks.find((t) => t.id === taskId);
  if (!task) throw new DomainError("INVALID_TASK", "Topshiriq topilmadi.");
  const progress = getProgress(db, ctx.childId, l);
  if (!progress) throw new DomainError("LESSON_NOT_STARTED", "Dars hali boshlanmagan.");

  const key = `${ctx.childId}:${taskId}`;
  if (inFlight.has(key)) throw new DomainError("BUSY", "Yordam tayyorlanmoqda, biroz kuting.");
  inFlight.add(key);
  const started = Date.now();

  const fallback = (status: FallbackStatus): HelpResult => {
    record(db, ctx.familyId, ctx.childId, taskId, status, started);
    return {
      source: "fallback",
      text: task.help,
      audio: { kind: "ready", voiceId: `${task.id}-help` },
      remainingAi: Math.max(0, MAX_FRESH_AI_PER_TASK - freshAiCount(db, ctx.childId, taskId)),
    };
  };

  try {
    const used = freshAiCount(db, ctx.childId, taskId);
    if (used >= MAX_FRESH_AI_PER_TASK) return fallback("fallback_limit");
    if (!providers) return fallback("fallback_not_configured");

    // Bolaning tanlovi va urinish holati mijozdan emas, bazadan olinadi.
    const last = db
      .prepare("SELECT option_id AS o FROM attempts WHERE progress_id = ? AND task_id = ? ORDER BY rowid DESC LIMIT 1")
      .get(progress.id, taskId) as { o: string } | undefined;
    const wrong = (db.prepare("SELECT COUNT(*) AS c FROM attempts WHERE progress_id = ? AND task_id = ? AND correct = 0").get(progress.id, taskId) as { c: number }).c;
    const age = (db.prepare("SELECT age FROM child_profiles WHERE id = ?").get(ctx.childId) as { age: number }).age;

    const controller = new AbortController();
    const state = { phase: "text" as "text" | "audio" };
    try {
      const result = await withDeadline(
        (async () => {
          const raw = await providers.tutor.generate(
            { system: SYSTEM_PROMPT, user: buildUserPrompt({ age, lesson: l, task, chosenOptionId: last?.o ?? null, wrongAttempts: wrong }) },
            controller.signal,
          );
          const text = validateTutorText(raw);
          if (!text) return { invalid: true as const };
          state.phase = "audio";
          const audio = await providers.speech.synthesize(text, controller.signal);
          return { invalid: false as const, text, audio };
        })(),
        controller,
        opts.deadlineMs ?? DEADLINE_MS,
      );
      if (result.invalid) return fallback("fallback_invalid");
      record(db, ctx.familyId, ctx.childId, taskId, "ai", started);
      return {
        source: "ai",
        text: result.text,
        audio: { kind: "generated", base64: result.audio.toString("base64"), mime: "audio/mpeg" },
        remainingAi: MAX_FRESH_AI_PER_TASK - used - 1,
      };
    } catch (e) {
      if (e instanceof DOMException && e.name === "TimeoutError") return fallback("fallback_timeout");
      return fallback(state.phase === "audio" ? "fallback_audio_error" : "fallback_ai_error");
    }
  } finally {
    inFlight.delete(key);
  }
}
