// Media manifest tekshiruvi: rasmlar majburiy, ovozlar yetishmasa ochiq hisobot beriladi.
// Ishlatish: npm run check:media [-- --strict]  (--strict: ovoz yo'q bo'lsa ham xato)
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadVoiceLines } from "./voice-lines.mjs";

const strict = process.argv.includes("--strict");
const pub = (p) => join(process.cwd(), "public", p);
const { lesson, lines } = loadVoiceLines();

const images = [lesson.hero.image, ...lesson.tasks.flatMap((t) => t.options.map((o) => o.image))];
const missingImages = [...new Set(images)].filter((p) => !existsSync(pub(p)));
const missingAudio = lines.filter((v) => !existsSync(pub(`/assets/audio/${v.id}.mp3`)));

for (const t of lesson.tasks) {
  if (t.options.length !== 2) missingImages.push(`${t.id}: 2 ta variant bo'lishi kerak`);
  if (!t.options.some((o) => o.id === t.correctOptionId)) missingImages.push(`${t.id}: to'g'ri javob variantlar orasida yo'q`);
}

console.log(`Rasmlar: ${images.length - missingImages.length}/${images.length} mavjud`);
console.log(`Ovozlar: ${lines.length - missingAudio.length}/${lines.length} mavjud`);
missingImages.forEach((p) => console.error("  YETISHMAYDI (rasm/qoida):", p));
missingAudio.forEach((v) => console.warn("  yetishmaydi (ovoz):", v.id));

if (missingImages.length || (strict && missingAudio.length)) process.exit(1);
if (missingAudio.length) console.warn("OGOHLANTIRISH: tayyor ovoz yo'q — brauzer ovozi uning teng o'rnini bosmaydi (npm run audio:generate).");
