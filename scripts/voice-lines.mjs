import { readFileSync } from "node:fs";

/** src/content/lesson.ts dagi voiceManifest() bilan bir xil qoida. */
export function loadVoiceLines() {
  const l = JSON.parse(readFileSync(new URL("../src/content/lesson.json", import.meta.url), "utf8"));
  const lines = [
    { id: l.intro.voiceId, text: l.intro.text },
    { id: l.outro.voiceId, text: l.outro.text },
  ];
  for (const t of l.tasks) {
    lines.push(
      { id: `${t.id}-situation`, text: t.situation },
      { id: `${t.id}-correct`, text: t.correct },
      { id: `${t.id}-wrong`, text: t.wrong },
      { id: `${t.id}-help`, text: t.help },
    );
  }
  return { lesson: l, lines };
}
