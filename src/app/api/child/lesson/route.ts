import { route } from "@/server/http";
import { childLessonView } from "@/server/reports/views";

export const dynamic = "force-dynamic";

export const GET = route({ role: "child" }, ({ db, session }) => childLessonView(db, session!.familyId, session!.childId!));
