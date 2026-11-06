"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { ChoiceCard, type ChoiceState } from "@/components/ui/ChoiceCard";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { Progress } from "@/components/ui/Progress";
import { api, errorText } from "@/lib/api";
import { demoMoney } from "@/lib/money";
import { useVoice } from "@/lib/useVoice";
import s from "./child.module.css";

interface Task {
  id: string;
  order: number;
  situation: string;
  help: string;
  options: { id: string; label: string; image: string; alt: string }[];
  voice: { situation: string; correct: string; wrong: string; help: string };
}

interface View {
  child: { name: string; avatar: string; age: number };
  lesson: {
    title: string;
    hero: { name: string; image: string; alt: string };
    intro: { voiceId: string; text: string };
    outro: { voiceId: string; text: string };
    tasks: Task[];
  };
  started: boolean;
  completed: boolean;
  completedTasks: string[];
  rewardAmount: number;
  balance: number;
  fundSufficient: boolean;
}

type Step = { kind: "home" } | { kind: "intro" } | { kind: "task"; index: number } | { kind: "done" };
interface Attempt {
  optionId: string;
  correct: boolean;
  feedback: string;
}
interface Outcome {
  alreadyCompleted: boolean;
  reward: { status: "pending" | "paid"; amount: number } | null;
  balance: number;
}

function SpeakerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function LessonFlow() {
  const [view, setView] = useState<View | null>(null);
  const [step, setStep] = useState<Step>({ kind: "home" });
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [helpFor, setHelpFor] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [fundOk, setFundOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voice = useVoice();

  const load = useCallback(async () => {
    setError(null);
    try {
      const v = await api<View>("/api/child/lesson");
      setView(v);
      setFundOk(v.fundSufficient);
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sahifa ochilganda boshlang'ich ma'lumotni yuklash
    void load();
  }, [load]);

  const tasks = useMemo(() => view?.lesson.tasks ?? [], [view]);
  const doneIds = view?.completedTasks ?? [];
  const firstUnfinished = Math.max(0, tasks.findIndex((t) => !doneIds.includes(t.id)));

  const goTask = useCallback(
    (index: number) => {
      setAttempt(null);
      setWrongIds([]);
      setHelpFor(null);
      setStep({ kind: "task", index });
      const t = tasks[index];
      if (t) voice.play(t.voice.situation);
    },
    [tasks, voice],
  );

  async function start() {
    if (!view) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ fundSufficient: boolean }>("/api/child/lesson/start", { method: "POST" });
      setFundOk(r.fundSufficient);
      if (view.started) {
        goTask(view.completed ? 0 : firstUnfinished);
      } else {
        setStep({ kind: "intro" });
        voice.play(view.lesson.intro.voiceId);
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function choose(task: Task, optionId: string) {
    if (busy || attempt?.correct) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ correct: boolean; feedback: string; completedTasks: string[] }>("/api/child/attempts", {
        method: "POST",
        body: { taskId: task.id, optionId },
      });
      setAttempt({ optionId, correct: r.correct, feedback: r.feedback });
      setView((v) => (v ? { ...v, started: true, completedTasks: r.completedTasks } : v));
      if (!r.correct) setWrongIds((w) => [...w, optionId]);
      voice.play(r.correct ? task.voice.correct : task.voice.wrong);
    } catch (e) {
      setError(errorText(e)); // javob qayd etilmagan bo'lsa, qayta urinish mumkin
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<Outcome>("/api/child/lesson/complete", { method: "POST" });
      setOutcome(r);
      setStep({ kind: "done" });
      if (view) voice.play(view.lesson.outro.voiceId);
      void load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (!view) {
    return error ? (
      <div className={s.wrap}>
        <Notice tone="error">{error}</Notice>
        <Button size="child" onClick={() => void load()}>
          Qayta urinish
        </Button>
      </div>
    ) : (
      <div className={s.wrap} aria-busy="true">
        <div className={s.skeleton} />
      </div>
    );
  }

  const { lesson } = view;

  if (step.kind === "home") {
    const label = view.completed ? "Qayta mashq qilish" : view.started ? "Darsni davom ettirish" : "Darsni boshlash";
    return (
      <div className={s.wrap}>
        <section className={`${s.card} ${s.center}`}>
          <Avatar id={view.child.avatar} size={140} alt={lesson.hero.alt} />
          <h1>Salom, {view.child.name}!</h1>
          <p className={s.situation}>Bugungi dars: {lesson.title}</p>
          <span className={s.balance}>Balansim: {demoMoney(view.balance)}</span>
          {view.completed && <Notice tone="success">Bu darsni tugatgansan. Mashq uchun qayta o‘ynashing mumkin, mukofot bir marta beriladi.</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          <Button size="child" loading={busy} onClick={start}>
            {label}
          </Button>
        </section>
      </div>
    );
  }

  if (step.kind === "intro") {
    return (
      <div className={s.wrap}>
        <section className={s.card}>
          <div className={s.hero}>
            <Avatar id={view.child.avatar} size={120} alt={lesson.hero.alt} />
            <div className={s.bubble}>{lesson.intro.text}</div>
          </div>
          {!fundOk && (
            <Notice tone="warning">
              Hozir mukofot fondida mablag‘ yetarli emas. Dars baribir saqlanadi, mukofot ota-onang fondni to‘ldirgach beriladi.
            </Notice>
          )}
          <div className={s.actions}>
            <Button variant="secondary" size="child" onClick={() => voice.play(lesson.intro.voiceId)}>
              🔊 Ovozni eshitish
            </Button>
            <Button size="child" onClick={() => goTask(firstUnfinished)}>
              Boshlaymiz
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (step.kind === "task") {
    const task = tasks[step.index];
    const last = step.index === tasks.length - 1;
    const solved = attempt?.correct === true;
    const stateOf = (id: string): ChoiceState => {
      if (attempt?.correct && attempt.optionId === id) return "correct";
      if (wrongIds.includes(id)) return "wrong";
      return "idle";
    };
    return (
      <div className={s.wrap}>
        <section className={s.card}>
          <div className={s.topRow}>
            <Progress current={step.index} total={tasks.length} done={doneIds.length} />
            <IconButton label="Savolni qayta eshitish" onClick={() => voice.play(task.voice.situation)} aria-pressed={voice.playing === task.voice.situation}>
              <SpeakerIcon />
            </IconButton>
          </div>
          <p className={s.situation}>{task.situation}</p>
          <div className={s.grid}>
            {task.options.map((o) => (
              <ChoiceCard
                key={o.id}
                image={o.image}
                alt={o.alt}
                label={o.label}
                state={stateOf(o.id)}
                disabled={busy || solved || wrongIds.includes(o.id)}
                onChoose={() => choose(task, o.id)}
              />
            ))}
          </div>
          {voice.failed && <Notice tone="info">Ovoz hozir ishlamadi. Savolni o‘zing o‘qib ko‘r yoki dinamik tugmasini bos.</Notice>}
          {attempt && (
            <Notice tone={attempt.correct ? "success" : "warning"}>
              <p>{attempt.feedback}</p>
            </Notice>
          )}
          {helpFor === task.id && <div className={s.help}>💡 {task.help}</div>}
          {error && <Notice tone="error">{error}</Notice>}
          <div className={s.actions}>
            {!solved && (
              <Button
                variant="accent"
                size="child"
                disabled={busy}
                onClick={() => {
                  setHelpFor(task.id);
                  voice.play(task.voice.help);
                }}
              >
                Tushuntirib ber
              </Button>
            )}
            {solved && !last && (
              <Button size="child" onClick={() => goTask(step.index + 1)}>
                Keyingi savol
              </Button>
            )}
            {solved && last && (
              <Button size="child" loading={busy} onClick={finish}>
                Darsni tugatish
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }

  const o = outcome;
  return (
    <div className={s.wrap}>
      <section className={`${s.card} ${s.center}`}>
        <Avatar id={view.child.avatar} size={140} alt={lesson.hero.alt} />
        <h1>Barakalla, {view.child.name}!</h1>
        <p className={s.situation}>{lesson.outro.text}</p>
        {o?.reward?.status === "paid" && !o.alreadyCompleted && (
          <Notice tone="success">Mukofot: {demoMoney(o.reward.amount)} balansingga tushdi.</Notice>
        )}
        {o?.reward?.status === "pending" && (
          <Notice tone="warning">Mukofot ota-onangni kutmoqda. Fond to‘ldirilgach ota-onang uni beradi.</Notice>
        )}
        {o?.alreadyCompleted && o.reward?.status === "paid" && (
          <Notice tone="info">Bu dars uchun mukofot bir marta beriladi va allaqachon berilgan. Mashq uchun rahmat!</Notice>
        )}
        <span className={s.balance}>Balansim: {demoMoney(o?.balance ?? view.balance)}</span>
        <div className={s.actions}>
          <Button variant="secondary" size="child" onClick={() => voice.play(lesson.outro.voiceId)}>
            🔊 Ovozni eshitish
          </Button>
          <Button size="child" onClick={() => setStep({ kind: "home" })}>
            Bosh sahifa
          </Button>
        </div>
      </section>
    </div>
  );
}
