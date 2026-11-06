import { z } from "zod";
import { route } from "@/server/http";
import { recordAttempt } from "@/server/learning/progress";

export const dynamic = "force-dynamic";

const schema = z.object({ taskId: z.string().min(1).max(50), optionId: z.string().min(1).max(50) });

/** Javobni server baholaydi; mijoz to'g'ri javobni oldindan bilmaydi. */
export const POST = route({ role: "child", schema }, ({ db, session, body }) =>
  recordAttempt(db, session!.childId!, body.taskId, body.optionId),
);
