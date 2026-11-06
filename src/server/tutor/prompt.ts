import type { Lesson, LessonTask } from "../../content/lesson";

export const SYSTEM_PROMPT = [
  "You are Bilimcha, a gentle tutor for a 5-year-old child in Uzbekistan.",
  "Reply ONLY in very simple Uzbek (Latin script), at most 2 short sentences, warm and encouraging.",
  "Help the child think again about the CURRENT question by giving a small hint or asking a guiding question.",
  "Never shame the child and never say the child is wrong in a harsh way.",
  "Do not simply state the final answer; guide the child to find it.",
  "Never mention money, amounts, balances, rewards, funds or any financial operation.",
  "No lists, no markdown, no emojis, no quotation marks.",
].join(" ");

/**
 * AIga faqat: yosh, tasdiqlangan dars mazmuni, joriy savol, variantlar, bolaning tanlovi va urinish holati.
 * Ism, ota-ona, fond, balans yoki boshqa oila ma'lumoti HECH QACHON kiritilmaydi.
 */
export function buildUserPrompt(p: {
  age: number;
  lesson: Pick<Lesson, "summary">;
  task: LessonTask;
  chosenOptionId: string | null;
  wrongAttempts: number;
}): string {
  const chosen = p.task.options.find((o) => o.id === p.chosenOptionId)?.label ?? "hali tanlamagan";
  return [
    `Child age: ${p.age}`,
    `Lesson summary: ${p.lesson.summary}`,
    `Current question: ${p.task.situation}`,
    `Options: ${p.task.options.map((o) => o.label).join(" / ")}`,
    `Child's last choice: ${chosen}`,
    `Wrong attempts on this question so far: ${p.wrongAttempts}`,
    "Write the hint now.",
  ].join("\n");
}
