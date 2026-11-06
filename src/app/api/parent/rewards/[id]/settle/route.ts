import { audit } from "@/server/auth/sessions";
import { route } from "@/server/http";
import { getEntitlement, settleReward } from "@/server/rewards/rewards";

export const dynamic = "force-dynamic";

export const POST = route({ role: "parent" }, ({ db, session, params }) => {
  const before = getEntitlement(db, params.id);
  const e = settleReward(db, session!.familyId, params.id);
  if (before?.status === "pending" && e.status === "paid") audit(db, session!.familyId, "reward_settled", params.id);
  return { id: e.id, status: e.status, amount: e.amount };
});
