import { lesson } from "../../content/lesson";
import type { Db } from "../db/connection";
import { completedTaskIds, getProgress } from "../learning/progress";
import { getBalances, listLedger } from "../rewards/ledger";
import { getRewardRule, listEntitlements } from "../rewards/rewards";

export const AVATARS = ["bilimcha", "bilimcha-sariq", "bilimcha-yashil"] as const;

function childRow(db: Db, childId: string) {
  return db.prepare("SELECT id, name, avatar, age FROM child_profiles WHERE id = ?").get(childId) as {
    id: string;
    name: string;
    avatar: string;
    age: number;
  };
}

/** Bola ko'radigan dars: to'g'ri javob kaliti YO'Q. */
export function childLessonView(db: Db, familyId: string, childId: string) {
  const progress = getProgress(db, childId, lesson);
  const completedTasks = progress ? completedTaskIds(db, progress.id) : [];
  const balances = getBalances(db, familyId, childId);
  const rule = getRewardRule(db, familyId, lesson.id) ?? 0;
  return {
    child: childRow(db, childId),
    lesson: {
      id: lesson.id,
      title: lesson.title,
      hero: lesson.hero,
      intro: lesson.intro,
      outro: lesson.outro,
      tasks: lesson.tasks.map((t) => ({
        id: t.id,
        order: t.order,
        situation: t.situation,
        options: t.options,
        help: t.help,
        voice: { situation: `${t.id}-situation`, correct: `${t.id}-correct`, wrong: `${t.id}-wrong`, help: `${t.id}-help` },
      })),
    },
    started: Boolean(progress),
    completed: Boolean(progress?.completedAt),
    completedTasks,
    rewardAmount: progress ? progress.rewardAmount : rule,
    balance: balances.child,
    fundSufficient: balances.fund >= (progress ? progress.rewardAmount : rule),
  };
}

export function parentDashboard(db: Db, familyId: string, childId: string) {
  const progress = getProgress(db, childId, lesson);
  const attempts = progress
    ? (db
        .prepare("SELECT COUNT(*) AS total, COALESCE(SUM(1 - correct), 0) AS wrong FROM attempts WHERE progress_id = ?")
        .get(progress.id) as { total: number; wrong: number })
    : { total: 0, wrong: 0 };
  const help = db
    .prepare("SELECT COALESCE(SUM(status = 'ai'), 0) AS ai, COUNT(*) AS total FROM tutor_requests WHERE child_id = ?")
    .get(childId) as { ai: number; total: number };
  return {
    demo: true,
    child: childRow(db, childId),
    help: { total: help.total, ai: help.ai, fallback: help.total - help.ai },
    balances: getBalances(db, familyId, childId),
    lesson: {
      id: lesson.id,
      title: lesson.title,
      totalTasks: lesson.tasks.length,
      started: Boolean(progress),
      completedTasks: progress ? completedTaskIds(db, progress.id).length : 0,
      completedAt: progress?.completedAt ?? null,
      attempts: attempts.total,
      wrongAttempts: attempts.wrong,
    },
    rewardRule: { lessonId: lesson.id, amount: getRewardRule(db, familyId, lesson.id), lockedForStartedLesson: Boolean(progress) },
    entitlements: listEntitlements(db, familyId),
    ledger: listLedger(db, familyId),
  };
}
