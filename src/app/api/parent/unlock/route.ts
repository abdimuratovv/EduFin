import { z } from "zod";
import { unlockParentOrThrow } from "@/server/auth/sessions";
import { DomainError } from "@/server/errors";
import { route } from "@/server/http";

export const dynamic = "force-dynamic";

const schema = z.object({ pin: z.string().min(1).max(32) });

export const POST = route({ role: "any", schema }, ({ db, session, body, setSession }) => {
  if (!session) throw new DomainError("UNAUTHENTICATED", "Avval demoni boshlang.");
  const { token, maxAgeSeconds } = unlockParentOrThrow(db, session, body.pin);
  setSession(token, maxAgeSeconds);
  return { mode: "parent" };
});
