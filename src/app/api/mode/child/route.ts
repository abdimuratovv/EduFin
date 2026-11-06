import { toChildMode } from "@/server/auth/sessions";
import { DomainError } from "@/server/errors";
import { route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Ota-ona vakolatini yopib, bola rejimiga o'tadi. Qaytish PIN talab qiladi. */
export const POST = route({ role: "any" }, ({ db, session, setSession }) => {
  if (!session) throw new DomainError("UNAUTHENTICATED", "Avval demoni boshlang.");
  const { token, maxAgeSeconds } = toChildMode(db, session);
  setSession(token, maxAgeSeconds);
  return { mode: "child" };
});
