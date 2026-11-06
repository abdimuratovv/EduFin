import { z } from "zod";
import { audit } from "@/server/auth/sessions";
import { route } from "@/server/http";
import { getBalances, topUp } from "@/server/rewards/ledger";

export const dynamic = "force-dynamic";

const schema = z.object({ amount: z.number(), key: z.string().min(8).max(100) });

/** Demo fondni to'ldirish. Haqiqiy pul olinmaydi. Takroriy kalit ikkinchi yozuv yaratmaydi. */
export const POST = route({ role: "parent", schema }, ({ db, session, body }) => {
  const r = topUp(db, session!.familyId, body.amount, body.key);
  if (!r.replayed) audit(db, session!.familyId, "fund_topup", String(body.amount));
  return { replayed: r.replayed, balances: getBalances(db, session!.familyId, session!.childId!) };
});
