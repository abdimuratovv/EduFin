import "server-only";
import { getEnv } from "../env";
import { elevenLabsProvider } from "./elevenlabs";
import { geminiProvider } from "./gemini";
import type { Providers } from "./types";

/** Ikkala xizmat ham sozlangan bo'lsa provayderlar, aks holda null (tayyor yordam ishlatiladi). */
export function getProviders(): Providers | null {
  const env = getEnv();
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL || !env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) return null;
  return {
    tutor: geminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL),
    speech: elevenLabsProvider(env.ELEVENLABS_API_KEY, env.ELEVENLABS_VOICE_ID, env.ELEVENLABS_MODEL ?? "eleven_v4"),
  };
}
