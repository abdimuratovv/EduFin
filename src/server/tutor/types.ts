/** AI va ovoz provayderlari alohida interfeyslar orqali ulanadi (almashtirish oson). */
export interface TutorProvider {
  generate(input: { system: string; user: string }, signal: AbortSignal): Promise<string>;
}

export interface SpeechProvider {
  /** Matnni ovozga aylantiradi, MP3 bayt qaytaradi. */
  synthesize(text: string, signal: AbortSignal): Promise<Buffer>;
}

export interface Providers {
  tutor: TutorProvider;
  speech: SpeechProvider;
}

export type HelpSource = "ai" | "fallback";

export interface HelpResult {
  source: HelpSource;
  text: string;
  /** "ready": tayyor fayl (voiceId); "generated": ovoz shu javobning o'zida (base64 mp3). */
  audio: { kind: "ready"; voiceId: string } | { kind: "generated"; base64: string; mime: "audio/mpeg" };
  /** Qolgan yangi AI tushuntirishlari soni shu topshiriq uchun. */
  remainingAi: number;
}
