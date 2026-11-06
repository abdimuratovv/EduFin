import "server-only";
import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optional = () => z.preprocess(emptyToUndefined, z.string().optional());

const schema = z.object({
  PARENT_DEMO_PIN: z.preprocess(emptyToUndefined, z.string().min(4, "kamida 4 belgi")),
  DATABASE_PATH: z.preprocess(emptyToUndefined, z.string().default("./data/edufin.db")),
  GEMINI_API_KEY: optional(),
  GEMINI_MODEL: optional(),
  ELEVENLABS_API_KEY: optional(),
  ELEVENLABS_VOICE_ID: optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Muhit o'zgaruvchilarini tekshiradi. Faqat serverda ishlaydi (brauzer bundle'iga kirmaydi). */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Muhit sozlamasi noto'g'ri: ${fields}. .env.example ga qarang.`);
  }
  cached = parsed.data;
  return cached;
}

/** Haqiqiy AI/ovoz sozlanganmi (kalit qiymatini qaytarmaydi). */
export function integrationStatus() {
  const env = getEnv();
  return {
    ai: Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL),
    speech: Boolean(env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID),
  };
}
