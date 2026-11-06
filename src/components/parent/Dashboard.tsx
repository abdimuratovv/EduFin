"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AVATAR_OPTIONS } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { api, errorText } from "@/lib/api";
import { demoMoney, shortDate } from "@/lib/money";
import s from "./parent.module.css";

interface Dash {
  child: { name: string; avatar: string; age: number };
  balances: { fund: number; child: number };
  lesson: { title: string; totalTasks: number; started: boolean; completedTasks: number; completedAt: string | null; attempts: number; wrongAttempts: number };
  rewardRule: { amount: number | null; lockedForStartedLesson: boolean };
  entitlements: { id: string; amount: number; status: "pending" | "paid"; createdAt: string }[];
  ledger: { id: string; type: "TOPUP" | "REWARD"; amount: number; createdAt: string }[];
}

type Msg = { tone: "success" | "error" | "info" | "warning"; text: string } | null;

function parseAmount(v: string): number | null {
  const n = Number(v.replace(/[\s ]/g, ""));
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function Dashboard() {
  const [d, setD] = useState<Dash | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [topup, setTopup] = useState("50000");
  const [confirmTopup, setConfirmTopup] = useState(false);
  const topupKey = useRef<string>("");
  const [reward, setReward] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("bilimcha");

  const load = useCallback(async () => {
    try {
      const v = await api<Dash>("/api/parent/dashboard");
      setD(v);
      setReward(String(v.rewardRule.amount ?? ""));
      setName(v.child.name);
      setAvatar(v.child.avatar);
      setLoadError(null);
    } catch (e) {
      setLoadError(errorText(e));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sahifa ochilganda boshlang'ich ma'lumotni yuklash
    void load();
  }, [load]);

  async function run(label: string, fn: () => Promise<string>) {
    setBusy(label);
    setMsg(null);
    try {
      const text = await fn();
      setMsg({ tone: "success", text });
      await load();
    } catch (e) {
      setMsg({ tone: "error", text: errorText(e) });
    } finally {
      setBusy(null);
    }
  }

  if (!d) {
    return loadError ? (
      <div className={s.wrap}>
        <Notice tone="error">{loadError}</Notice>
        <Button onClick={() => void load()}>Qayta urinish</Button>
      </div>
    ) : (
      <p aria-busy="true">Yuklanmoqda…</p>
    );
  }

  const topupAmount = parseAmount(topup);
  const rewardAmount = parseAmount(reward);
  const pending = d.entitlements.filter((e) => e.status === "pending");

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <Avatar id={d.child.avatar} size={72} />
        <div>
          <h1>Oila paneli</h1>
          <p className={s.muted}>
            {d.child.name}, {d.child.age} yosh · barcha summalar demo, haqiqiy pul emas
          </p>
        </div>
      </div>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {pending.map((p) => (
        <Notice key={p.id} tone="warning">
          <p>
            <strong>Mukofot kutilmoqda: {demoMoney(p.amount)}.</strong>{" "}
            {d.balances.fund >= p.amount ? "Fond yetarli, mukofotni bering." : "Avval fondni to‘ldiring."}
          </p>
          <Button
            variant="accent"
            disabled={d.balances.fund < p.amount}
            loading={busy === "settle"}
            onClick={() =>
              run("settle", async () => {
                await api(`/api/parent/rewards/${p.id}/settle`, { method: "POST" });
                return "Mukofot berildi.";
              })
            }
          >
            Mukofotni berish
          </Button>
        </Notice>
      ))}

      <div className={s.grid}>
        <section className={`${s.card} ${s.wide}`}>
          <h2>Balans</h2>
          <div className={s.numbers}>
            <div className={s.num}>
              <span>Ota-ona fondi</span>
              <strong>{demoMoney(d.balances.fund)}</strong>
            </div>
            <div className={s.num}>
              <span>Bola balansi</span>
              <strong>{demoMoney(d.balances.child)}</strong>
            </div>
          </div>
        </section>

        <section className={s.card}>
          <h2>Demo fondni to‘ldirish</h2>
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (topupAmount) setConfirmTopup(true);
            }}
          >
            <label className={s.field}>
              Miqdor (demo so‘m)
              <input
                className={s.input}
                inputMode="numeric"
                value={topup}
                onChange={(e) => {
                  setTopup(e.target.value);
                  setConfirmTopup(false);
                }}
              />
            </label>
            <div className={s.row}>
              {[20000, 50000, 100000].map((v) => (
                <Button key={v} type="button" variant="secondary" onClick={() => { setTopup(String(v)); setConfirmTopup(false); }}>
                  {demoMoney(v)}
                </Button>
              ))}
            </div>
            {!confirmTopup ? (
              <Button type="submit" disabled={!topupAmount || (topupAmount ?? 0) > 10_000_000}>
                To‘ldirish
              </Button>
            ) : (
              <>
                <Notice tone="info">Fondga {demoMoney(topupAmount ?? 0)} qo‘shiladi. Bu demo, haqiqiy pul olinmaydi.</Notice>
                <div className={s.row}>
                  <Button
                    type="button"
                    loading={busy === "topup"}
                    onClick={() =>
                      run("topup", async () => {
                        topupKey.current ||= crypto.randomUUID(); // tarmoq xatosida bir xil kalit bilan qayta urinish
                        await api("/api/parent/fund/topups", { method: "POST", body: { amount: topupAmount, key: topupKey.current } });
                        topupKey.current = "";
                        setConfirmTopup(false);
                        return `Fond to‘ldirildi: ${demoMoney(topupAmount ?? 0)}.`;
                      })
                    }
                  >
                    Tasdiqlash
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmTopup(false)}>
                    Bekor qilish
                  </Button>
                </div>
              </>
            )}
          </form>
        </section>

        <section className={s.card}>
          <h2>Dars mukofoti</h2>
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (!rewardAmount) return;
              void run("rule", async () => {
                await api("/api/parent/reward-rule", { method: "PATCH", body: { amount: rewardAmount } });
                return "Mukofot miqdori saqlandi.";
              });
            }}
          >
            <p className={s.hint}>“{d.lesson.title}” darsi tugagach bir marta beriladi. Xato va yordam mukofotni kamaytirmaydi.</p>
            <label className={s.field}>
              Miqdor (demo so‘m)
              <input className={s.input} inputMode="numeric" value={reward} onChange={(e) => setReward(e.target.value)} />
            </label>
            {d.rewardRule.lockedForStartedLesson && (
              <Notice tone="info">Dars boshlangan: bu o‘zgarish faqat keyingi boshlanadigan darsga ta’sir qiladi.</Notice>
            )}
            <Button type="submit" loading={busy === "rule"} disabled={!rewardAmount}>
              Saqlash
            </Button>
          </form>
        </section>

        <section className={s.card}>
          <h2>Bola profili</h2>
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              void run("child", async () => {
                await api("/api/parent/child", { method: "PATCH", body: { name, avatar } });
                return "Profil saqlandi.";
              });
            }}
          >
            <label className={s.field}>
              Ism
              <input className={s.input} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
            </label>
            <fieldset className={s.avatars}>
              <legend>Qahramon rangi</legend>
              {AVATAR_OPTIONS.map((a) => (
                <label key={a.id} className={s.avatarOpt}>
                  <input type="radio" name="avatar" value={a.id} checked={avatar === a.id} onChange={() => setAvatar(a.id)} />
                  <Avatar id={a.id} size={56} />
                  {a.label}
                </label>
              ))}
            </fieldset>
            <p className={s.hint}>Yosh: {d.child.age} (bu demoda o‘zgarmaydi).</p>
            <Button type="submit" loading={busy === "child"} disabled={name.trim().length === 0}>
              Saqlash
            </Button>
          </form>
        </section>

        <section className={s.card}>
          <h2>Hisobot</h2>
          <ul className={s.list}>
            <li className={s.item}>
              <span>Dars</span>
              <strong>{d.lesson.title}</strong>
            </li>
            <li className={s.item}>
              <span>Bajarilgan topshiriqlar</span>
              <strong>
                {d.lesson.completedTasks} / {d.lesson.totalTasks}
              </strong>
            </li>
            <li className={s.item}>
              <span>Urinishlar (xato)</span>
              <strong>
                {d.lesson.attempts} ({d.lesson.wrongAttempts})
              </strong>
            </li>
            <li className={s.item}>
              <span>Dars holati</span>
              <strong>{d.lesson.completedAt ? `Tugatilgan · ${shortDate(d.lesson.completedAt)}` : d.lesson.started ? "Jarayonda" : "Boshlanmagan"}</strong>
            </li>
            <li className={s.item}>
              <span>Mukofot</span>
              <span>
                {d.entitlements.length === 0 && <span className={s.muted}>Hali yo‘q</span>}
                {d.entitlements.map((e) => (
                  <span key={e.id} className={`${s.pill} ${e.status === "paid" ? s.paid : s.pending}`}>
                    {e.status === "paid" ? "✓ To‘langan" : "⏳ Mablag‘ kutilmoqda"}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </section>

        <section className={`${s.card} ${s.wide}`}>
          <h2>Operatsiyalar tarixi</h2>
          {d.ledger.length === 0 ? (
            <p className={s.muted}>Hozircha operatsiya yo‘q.</p>
          ) : (
            <ul className={s.list}>
              {d.ledger.map((t) => (
                <li key={t.id} className={s.item}>
                  <span>
                    {t.type === "TOPUP" ? "Demo fond to‘ldirildi" : "Dars mukofoti berildi"}
                    <small>{shortDate(t.createdAt)}</small>
                  </span>
                  <span className={t.type === "TOPUP" ? s.plus : s.minus}>
                    {t.type === "TOPUP" ? "+" : "−"} {demoMoney(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
