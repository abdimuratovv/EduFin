import { createSession } from "@/server/auth/sessions";
import { seedDemo } from "@/server/db/seed";
import { route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Demo sessiyani boshlaydi. Yangi sessiya doim bola rejimida: ota-ona vakolati faqat PIN bilan ochiladi. */
export const POST = route({ role: "none" }, ({ db, setSession }) => {
  const { familyId, childId } = seedDemo(db);
  const { token, maxAgeSeconds } = createSession(db, familyId, childId, "child");
  setSession(token, maxAgeSeconds);
  const child = db.prepare("SELECT name, avatar, age FROM child_profiles WHERE id = ?").get(childId);
  return { mode: "child", demo: true, child };
});
