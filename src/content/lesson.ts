import data from "./lesson.json";

export interface LessonOption {
  id: string;
  label: string;
  image: string;
  alt: string;
}

export interface LessonTask {
  id: string;
  order: number;
  situation: string;
  options: LessonOption[];
  /** Faqat serverda ishlatiladi; mijozga yuborilmaydi (6-bosqich). */
  correctOptionId: string;
  correct: string;
  wrong: string;
  /** Tayyor (zaxira) yordam matni. */
  help: string;
}

export interface VoiceLine {
  voiceId: string;
  text: string;
}

export interface Lesson {
  id: string;
  version: number;
  title: string;
  hero: { name: string; image: string; alt: string };
  intro: VoiceLine;
  outro: VoiceLine;
  tasks: LessonTask[];
}

export const lesson: Lesson = data;

export interface VoiceEntry {
  id: string;
  text: string;
  file: string;
}

/** Darsdagi barcha tayyor ovoz qatorlari: id -> fayl yo'li. */
export function voiceManifest(l: Lesson = lesson): VoiceEntry[] {
  const entry = (id: string, text: string): VoiceEntry => ({
    id,
    text,
    file: `/assets/audio/${id}.mp3`,
  });
  const out: VoiceEntry[] = [
    entry(l.intro.voiceId, l.intro.text),
    entry(l.outro.voiceId, l.outro.text),
  ];
  for (const t of l.tasks) {
    out.push(
      entry(`${t.id}-situation`, t.situation),
      entry(`${t.id}-correct`, t.correct),
      entry(`${t.id}-wrong`, t.wrong),
      entry(`${t.id}-help`, t.help),
    );
  }
  return out;
}
