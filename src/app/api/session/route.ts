import { route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Joriy sessiya holati (sahifa yangilangandan keyin rejimni tiklash uchun). */
export const GET = route({ role: "any" }, ({ db, session }) => {
  const child = db.prepare("SELECT name, avatar, age FROM child_profiles WHERE id = ?").get(session!.childId);
  return { mode: session!.mode, demo: true, child };
});
