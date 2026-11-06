import { route } from "@/server/http";
import { startLesson } from "@/server/learning/progress";

export const dynamic = "force-dynamic";

export const POST = route({ role: "child" }, ({ db, session }) => {
  const r = startLesson(db, session!.childId!);
  return { completedTasks: r.completedTasks, fundSufficient: r.fundSufficient, rewardAmount: r.progress.rewardAmount };
});
