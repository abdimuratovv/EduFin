import { expect, test, type Page } from "@playwright/test";
import { balances, beginLesson, goChild, noHorizontalOverflow, parentLogin, playLesson, startChild, TASKS } from "./helpers";

/** Ko'rinib turgan barcha tugma va kirish maydonlari kamida 48 px; asosiy bola tugmalari 56 px. */
async function tapTargets(page: Page, min = 48) {
  const small = await page.evaluate((m) => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("button, input, a")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || el.closest("[hidden]") || (el as HTMLInputElement).type === "radio") continue;
      if (r.height + 0.5 < m || r.width + 0.5 < m) out.push(`${el.tagName}:${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  }, min);
  expect(small, `kichik bosish maydonlari: ${small.join(", ")}`).toEqual([]);
}

test("360 px telefon: bola oqimi, toshishsiz, bosish maydonlari, tayyor yordam (kalitsiz)", async ({ page }) => {
  await page.goto("/");
  await noHorizontalOverflow(page);
  await page.screenshot({ path: "docs/screenshots/mobile-1-kirish.png" });
  await startChild(page);
  await noHorizontalOverflow(page);
  await tapTargets(page);
  await page.screenshot({ path: "docs/screenshots/mobile-2-bola-bosh.png" });

  await beginLesson(page);
  await noHorizontalOverflow(page);
  await page.getByRole("button", { name: "Boshlaymiz" }).click();
  await noHorizontalOverflow(page);
  await tapTargets(page);
  // bola tugmalari 56 px
  for (const name of ["Tushuntirib ber"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(55.5);
  }
  await page.screenshot({ path: "docs/screenshots/mobile-3-topshiriq.png" });

  // kalitlar yo'q → tayyor ovozli yordam darhol chiqadi
  await page.getByRole("button", { name: "Tushuntirib ber" }).click();
  await expect(page.getByText("💡")).toBeVisible();
  await expect(page.getByText("Tushlik vaqtida nima yeymiz?")).toBeVisible();

  // xato javob muloyim, qayta urinish mumkin
  await page.getByRole("button", { name: TASKS[0].wrong }).click();
  await expect(page.getByText("Yaxshi urinish!")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/mobile-4-xato-javob.png" });

  // harakatni kamaytirish: to'g'ri javob animatsiyasi deyarli o'chadi
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: TASKS[0].correct }).click();
  const dur = await page.locator('button[data-state="correct"]').evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
  expect(dur).toBeLessThan(0.01);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Keyingi savol" }).click();
  for (let i = 1; i < TASKS.length; i++) {
    await page.getByRole("button", { name: TASKS[i].correct }).click();
    await expect(page.getByText("✓ To‘g‘ri")).toBeVisible();
    if (i < TASKS.length - 1) await page.getByRole("button", { name: "Keyingi savol" }).click();
  }
  await page.getByRole("button", { name: "Darsni tugatish" }).click();
  await expect(page.getByRole("heading", { name: /Barakalla/ })).toBeVisible();
  await expect(page.getByText(/Mukofot: 2 000 demo so‘m/)).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: "docs/screenshots/mobile-5-yakun.png" });
});

test("360 px telefon: ota-ona paneli toshishsiz va qiymatlar to'g'ri", async ({ page }) => {
  await startChild(page);
  await parentLogin(page);
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toBeVisible();
  await noHorizontalOverflow(page);
  await tapTargets(page);
  await page.screenshot({ path: "docs/screenshots/mobile-6-ota-ona.png", fullPage: true });
  expect((await balances(page)).fund).toBeGreaterThan(0);
  await goChild(page);
});

void playLesson;
