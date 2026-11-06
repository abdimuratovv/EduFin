import { parentDashboard } from "@/server/reports/views";
import { route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route({ role: "parent" }, ({ db, session }) => parentDashboard(db, session!.familyId, session!.childId!));
