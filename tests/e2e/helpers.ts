import { expect, type Page } from "@playwright/test";

export const PIN = "4821";

/** Har bir topshiriq: to'g'ri va xato variant nomlari (UI matni). */
export const TASKS = [
  { correct: /Olma/, wrong: /Yangi o‘yinchoq/ },
  { correct: /Soyabon/, wrong: /Rangli sharlar/ },
  { correct: /Bo‘yoqlar/, wrong: /Katta ayiqcha/ },
] as const;

export async function startChild(page: Page) {
  await page.goto("/");
  await expect(page.getByText(/haqiqiy pul ishlatilmaydi/)).toBeVisible();
  await page.getByRole("button", { name: "Bola sifatida boshlash" }).click();
  await expect(page).toHaveURL(/\/child$/);
}

export async function unlockParent(page: Page, pin = PIN) {
  await page.getByRole("button", { name: "Ota-ona", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ota-ona kodi" })).toBeVisible();
  await page.getByRole("textbox", { name: "Kod", exact: true }).fill(pin);
  await page.getByRole("button", { name: "Kirish" }).click();
}

export async function parentLogin(page: Page) {
  await unlockParent(page);
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toBeVisible();
}

export async function goChild(page: Page) {
  await page.getByRole("button", { name: "Bola", exact: true }).click();
  await expect(page).toHaveURL(/\/child$/);
}

/** Darsni boshlaydi va intro ekranigacha boradi. */
export async function beginLesson(page: Page, label = "Darsni boshlash") {
  await page.getByRole("button", { name: label }).click();
}

/**
 * Uchta topshiriqni bajaradi. `wrongFirst`: birinchi topshiriqda avval xato javob; `help`: shu topshiriqda yordam so'raydi.
 * Oxirida "Darsni tugatish" bosiladi.
 */
export async function playLesson(page: Page, opts: { intro?: boolean; wrongFirst?: boolean; help?: boolean } = {}) {
  if (opts.intro) await page.getByRole("button", { name: "Boshlaymiz" }).click();
  for (let i = 0; i < TASKS.length; i++) {
    const t = TASKS[i];
    if (i === 0 && opts.wrongFirst) {
      await page.getByRole("button", { name: t.wrong }).click();
      await expect(page.getByText("Yaxshi urinish!")).toBeVisible();
      await expect(page.getByText("↻ Yana o‘ylab ko‘r")).toBeVisible();
    }
    if (i === 0 && opts.help) {
      await page.getByRole("button", { name: "Tushuntirib ber" }).click();
      // AI ishlamasa ham 10 soniyadan keyin bola yordamsiz qolmaydi.
      await expect(page.getByText("💡")).toBeVisible();
      await expect(page.getByText("Bilimcha o‘ylayapti…")).toHaveCount(0, { timeout: 20_000 });
    }
    await page.getByRole("button", { name: t.correct }).click();
    await expect(page.getByText("✓ To‘g‘ri")).toBeVisible();
    if (i < TASKS.length - 1) await page.getByRole("button", { name: "Keyingi savol" }).click();
  }
  await page.getByRole("button", { name: "Darsni tugatish" }).click();
  await expect(page.getByRole("heading", { name: /Barakalla/ })).toBeVisible();
}

/** Ota-ona panelidagi "Ota-ona fondi" va "Bola balansi" qiymatlari (raqam). */
export async function balances(page: Page) {
  const read = async (label: string) => {
    const text = await page.locator(`div:has(> span:text-is("${label}")) > strong`).innerText();
    return Number(text.replace(/\D/g, ""));
  };
  return { fund: await read("Ota-ona fondi"), child: await read("Bola balansi") };
}

export async function noHorizontalOverflow(page: Page) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(o.sw, `gorizontal toshish: ${o.sw} > ${o.cw}`).toBeLessThanOrEqual(o.cw);
}
