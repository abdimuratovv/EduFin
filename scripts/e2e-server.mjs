// E2E uchun alohida port va alohida bazada production serverni ishga tushiradi.
// Ishlatish: node scripts/e2e-server.mjs <port> <dbName> <ai: fake|none>
// "fake": noto'g'ri kalitlar (AI haqiqiy so'rovda xato beradi → zaxira yordam); "none": kalitlar yo'q.
import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const [port, name, ai = "none"] = process.argv.slice(2);
const db = join(process.cwd(), "data", `e2e-${name}.db`);
mkdirSync(join(process.cwd(), "data"), { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) rmSync(db + suffix, { force: true });

const env = {
  ...process.env,
  DATABASE_PATH: db,
  PARENT_DEMO_PIN: "4821",
  GEMINI_API_KEY: ai === "fake" ? "e2e-invalid-key" : "",
  GEMINI_MODEL: ai === "fake" ? "gemini-3.5-flash" : "",
  ELEVENLABS_API_KEY: ai === "fake" ? "e2e-invalid-key" : "",
  ELEVENLABS_VOICE_ID: ai === "fake" ? "e2e-invalid-voice" : "",
};

const child = spawn(process.execPath, [join("node_modules", "next", "dist", "bin", "next"), "start", "-p", port], {
  env,
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill());
process.on("SIGINT", () => child.kill());
