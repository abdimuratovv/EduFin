// Tayyor ovozlarni ElevenLabs orqali yaratadi. Chiqish: public/assets/audio/<id>.mp3
// Ishlatish: npm run audio:generate [-- --force] [-- --only=t1-help,intro]
// .env.local: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID (majburiy); ELEVENLABS_MODEL (ixtiyoriy, standart eleven_v4)
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadVoiceLines } from "./voice-lines.mjs";

const force = process.argv.includes("--force");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");

function loadEnvLocal() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

const key = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
const model = process.env.ELEVENLABS_MODEL || "eleven_v4";
if (!key || !voiceId) {
  console.error("ELEVENLABS_API_KEY va ELEVENLABS_VOICE_ID .env.local da to'ldirilmagan. README dagi yo'riqnomaga qarang.");
  process.exit(1);
}

async function synth(text) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_64`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: model, language_code: "uz" }),
        signal: AbortSignal.timeout(60_000),
      },
    ).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const detail = (await res.text()).slice(0, 200).replace(key, "***");
    lastErr = new Error(`HTTP ${res.status} ${detail}`);
    if (res.status === 401 || res.status === 400 || res.status === 422 || res.status === 404) break; // qayta urinish befoyda
    await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
  throw lastErr;
}

const outDir = join(process.cwd(), "public", "assets", "audio");
mkdirSync(outDir, { recursive: true });
const { lines } = loadVoiceLines();
let made = 0, failed = 0;
for (const v of lines) {
  if (only && !only.includes(v.id)) continue;
  const file = join(outDir, `${v.id}.mp3`);
  if (existsSync(file) && !force) continue;
  try {
    writeFileSync(file, await synth(v.text));
    made++;
    console.log("yaratildi:", v.id);
  } catch (e) {
    failed++;
    console.error("XATO:", v.id, e.message);
    if (/HTTP (400|401|404|422)/.test(e.message)) break;
  }
}
console.log(`Model: ${model}. Tayyor: ${made} yaratildi, ${failed} xato.`);
process.exit(failed ? 1 : 0);
