import { z } from "zod";
import { route } from "@/server/http";
import { AVATARS } from "@/server/reports/views";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(30),
  avatar: z.enum(AVATARS),
});

export const PATCH = route({ role: "parent", schema }, ({ db, session, body }) => {
  db.prepare("UPDATE child_profiles SET name = ?, avatar = ? WHERE id = ? AND family_id = ?").run(
    body.name,
    body.avatar,
    session!.childId,
    session!.familyId,
  );
  return { name: body.name, avatar: body.avatar };
});
