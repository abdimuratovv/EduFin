import { z } from "zod";
import { lesson } from "@/content/lesson";
import { audit } from "@/server/auth/sessions";
import { route } from "@/server/http";
import { getProgress } from "@/server/learning/progress";
import { setRewardRule } from "@/server/rewards/rewards";

export const dynamic = "force-dynamic";

const schema = z.object({ amount: z.number() });

/** Mukofot miqdori. Boshlangan darsga ta'sir qilmaydi (dars boshida snapshot qilingan). */
export const PATCH = route({ role: "parent", schema }, ({ db, session, body }) => {
  setRewardRule(db, session!.familyId, lesson.id, body.amount);
  audit(db, session!.familyId, "reward_rule_set", String(body.amount));
  return { amount: body.amount, lockedForStartedLesson: Boolean(getProgress(db, session!.childId!, lesson)) };
});
