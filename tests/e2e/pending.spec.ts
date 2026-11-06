import { expect, test } from "@playwright/test";
import { balances, beginLesson, goChild, noHorizontalOverflow, parentLogin, playLesson, startChild } from "./helpers";

test("fond yetishmasa: dars saqlanadi, mukofot kutiladi; top-updan keyin ota-ona bir marta to'laydi", async ({ page }) => {
  await startChild(page);
  await parentLogin(page);
  // mukofotni fonddan katta qilib qo'yamiz (fond 100 000, mukofot 500 000)
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toBeVisible();
  expect((await balances(page)).fund).toBe(100_000);
  await page.getByLabel("Miqdor (demo so‘m)").nth(1).fill("500000");
  await page.getByRole("button", { name: "Saqlash" }).first().click();
  await expect(page.getByText("Mukofot miqdori saqlandi.")).toBeVisible();

  await goChild(page);
  await beginLesson(page);
  await expect(page.getByText(/mukofot fondida mablag‘ yetarli emas/)).toBeVisible(); // oldindan ko'rsatiladi
  await playLesson(page, { intro: true });
  await expect(page.getByText(/Mukofot ota-onangni kutmoqda/)).toBeVisible();
  await expect(page.getByText(/Balansim: 0 demo so‘m/)).toBeVisible();

  // sahifa yangilanganda holat tiklanadi, mukofot berilgan deb ko'rsatilmaydi
  await page.reload();
  await expect(page.getByRole("button", { name: "Qayta mashq qilish" })).toBeVisible();

  await parentLogin(page);
  await expect(page.getByText(/Mukofot kutilmoqda: 500 000 demo so‘m/)).toBeVisible();
  expect(await balances(page)).toEqual({ fund: 100_000, child: 0 }); // manfiy balans yo'q
  await expect(page.getByRole("button", { name: "Mukofotni berish" })).toBeDisabled();
  await expect(page.getByText("⏳ Mablag‘ kutilmoqda")).toBeVisible();

  await page.getByLabel("Miqdor (demo so‘m)").first().fill("500000");
  await page.getByRole("button", { name: "To‘ldirish" }).click();
  await page.getByRole("button", { name: "Tasdiqlash" }).click();
  await expect(page.getByText(/Fond to‘ldirildi/)).toBeVisible();

  const settle = page.getByRole("button", { name: "Mukofotni berish" });
  await expect(settle).toBeEnabled();
  await settle.click();
  await expect(page.getByText("Mukofot berildi.")).toBeVisible();
  expect(await balances(page)).toEqual({ fund: 100_000, child: 500_000 });
  await expect(page.getByRole("button", { name: "Mukofotni berish" })).toHaveCount(0);
  await expect(page.getByText("✓ To‘langan")).toBeVisible();

  // planshet ko'rinishi
  await page.setViewportSize({ width: 768, height: 1024 });
  await noHorizontalOverflow(page);
  await page.screenshot({ path: "docs/screenshots/tablet-ota-ona-panel.png", fullPage: true });
  await goChild(page);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: "docs/screenshots/tablet-bola.png" });
});
