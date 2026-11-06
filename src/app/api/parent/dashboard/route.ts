import { lesson } from "@/content/lesson";
import { getBalances, listLedger } from "@/server/rewards/ledger";
import { getRewardRule, listEntitlements } from "@/server/rewards/rewards";
import { route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Ota-ona paneli: faqat ota-ona rejimida. (6-bosqichda kengaytiriladi.) */
export const GET = route({ role: "parent" }, ({ db, session }) => {
  const { familyId, childId } = session!;
  return {
    demo: true,
    currency: "demo so‘m",
    balances: getBalances(db, familyId, childId!),
    rewardRule: { lessonId: lesson.id, amount: getRewardRule(db, familyId, lesson.id) },
    entitlements: listEntitlements(db, familyId),
    ledger: listLedger(db, familyId),
  };
});
