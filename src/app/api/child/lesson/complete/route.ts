import { audit } from "@/server/auth/sessions";
import { route } from "@/server/http";
import { completeLesson } from "@/server/learning/progress";
import { getBalances } from "@/server/rewards/ledger";

export const dynamic = "force-dynamic";

/** Darsni tugatish: bir martalik mukofot. Takroriy so'rov qo'shimcha mukofot bermaydi. */
export const POST = route({ role: "child" }, ({ db, session }) => {
  const { familyId, childId } = session!;
  const r = completeLesson(db, childId!);
  if (r.entitlement?.status === "paid" && !r.alreadyCompleted) audit(db, familyId, "reward_paid", String(r.entitlement.amount));
  return {
    alreadyCompleted: r.alreadyCompleted,
    reward: r.entitlement ? { status: r.entitlement.status, amount: r.entitlement.amount } : null,
    balance: getBalances(db, familyId, childId!).child,
  };
});
