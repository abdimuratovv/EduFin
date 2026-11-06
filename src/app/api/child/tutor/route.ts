import { z } from "zod";
import { route } from "@/server/http";
import { getProviders } from "@/server/tutor/providers";
import { requestHelp } from "@/server/tutor/service";

export const dynamic = "force-dynamic";

const schema = z.object({ taskId: z.string().min(1).max(50) });

/**
 * "Tushuntirib ber": joriy topshiriq uchun cheklangan yordam. AI hisobga yozish vakolatiga ega emas;
 * bolaning tanlovi va urinishlari mijozdan emas, serverdagi yozuvlardan olinadi.
 */
export const POST = route({ role: "child", schema }, ({ db, session, body }) =>
  requestHelp(db, { familyId: session!.familyId, childId: session!.childId! }, body.taskId, getProviders()),
);
