import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { balances, goChild, parentLogin, playLesson, startChild, unlockParent, PIN } from "./helpers";

// Holatli senariy: har test oldingisining natijasiga tayanadi (bitta demo oila, bitta baza).
test.describe.configure({ mode: "serial" });

let ctx: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  ctx = await browser.newContext({ baseURL: "http://localhost:3101", viewport: { width: 1280, height: 800 } });
  page = await ctx.newPage();
});
test.afterAll(async () => ctx.close());

test("1. demo kirish, ota-ona kodi, demo fond 100 000 va mukofot 2 000", async () => {
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/desktop-1-kirish.png" });
  await page.getByRole("button", { name: "Ota-ona sifatida kirish" }).click();

  // noto'g'ri kod: tushunarli xabar, kirish yo'q
  await page.getByRole("textbox", { name: "Kod", exact: true }).fill("0000");
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page.getByText(/Kod noto‘g‘ri\. Yana 4 ta urinish qoldi/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toHaveCount(0);

  await page.getByRole("textbox", { name: "Kod", exact: true }).fill(PIN);
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toBeVisible();

  expect(await balances(page)).toEqual({ fund: 100_000, child: 0 });
  await expect(page.getByLabel("Miqdor (demo so‘m)").nth(1)).toHaveValue("2000");
  // barcha pul ko'rsatkichlari demo ekanini bildiradi
  const money = await page.locator("main").innerText();
  for (const m of money.matchAll(/\d[\d  ]*\s?so‘m/g)) expect(m[0]).toContain("demo");
  await page.screenshot({ path: "docs/screenshots/desktop-2-ota-ona-panel.png", fullPage: true });
});

test("2. bola: xato javob, yordam (AI xatosida tayyor yordam), uchta topshiriq, mukofot", async () => {
  await goChild(page);
  await expect(page.getByRole("heading", { name: /Salom, Madina/ })).toBeVisible();
  await page.getByRole("button", { name: "Darsni boshlash" }).click();
  await expect(page.getByText(/Bilimchaman/)).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/desktop-3-bola-kirish.png" });
  await page.getByRole("button", { name: "Boshlaymiz" }).click();
  await page.screenshot({ path: "docs/screenshots/desktop-4-bola-topshiriq.png" });

  await playLesson(page, { wrongFirst: true, help: true });
  await expect(page.getByText(/Mukofot: 2 000 demo so‘m balansingga tushdi/)).toBeVisible();
  await expect(page.getByText(/Balansim: 2 000 demo so‘m/)).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/desktop-5-bola-yakun.png" });
});

test("3. ota-ona: fond 98 000, bola 2 000, hisobot, tarix; yordam holati qayd etilgan", async () => {
  await unlockParent(page); // bola rejimidan qaytish kod talab qiladi
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toBeVisible();
  expect(await balances(page)).toEqual({ fund: 98_000, child: 2_000 });
  await expect(page.getByText("3 / 3")).toBeVisible();
  await expect(page.getByText(/Urinishlar \(xato\)/)).toBeVisible();
  await expect(page.getByText("✓ To‘langan")).toBeVisible();
  await expect(page.getByText("Dars mukofoti berildi")).toBeVisible();
  // yordam so'raldi; AI kalitlari yaroqsiz → tayyor yordam hisoblangan
  await expect(page.getByText(/1 marta \(AI: 0, tayyor: 1\)/)).toBeVisible();
});

test("4. top-up va sahifani yangilash: qiymat va tarix saqlanadi", async () => {
  await page.getByLabel("Miqdor (demo so‘m)").first().fill("20000");
  await page.getByRole("button", { name: "To‘ldirish" }).click();
  await expect(page.getByText(/Fondga 20 000 demo so‘m qo‘shiladi/)).toBeVisible();
  await page.getByRole("button", { name: "Tasdiqlash" }).click();
  await expect(page.getByText(/Fond to‘ldirildi/)).toBeVisible();
  expect((await balances(page)).fund).toBe(118_000);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toBeVisible();
  expect(await balances(page)).toEqual({ fund: 118_000, child: 2_000 });
  await expect(page.getByText("Demo fond to‘ldirildi").first()).toBeVisible();
});

test("5. darsni takrorlash qo'shimcha mukofot bermaydi", async () => {
  await goChild(page);
  await page.getByRole("button", { name: "Qayta mashq qilish" }).click();
  await playLesson(page);
  await expect(page.getByText(/allaqachon berilgan/)).toBeVisible();
  await expect(page.getByText(/Mukofot: \d/)).toHaveCount(0);
  await expect(page.getByText(/Balansim: 2 000 demo so‘m/)).toBeVisible();

  await unlockParent(page);
  expect(await balances(page)).toEqual({ fund: 118_000, child: 2_000 });
  await expect(page.getByText("Dars mukofoti berildi")).toHaveCount(1);
});

test("6. bola sessiyasi ota-ona API'larini o'zgartira olmaydi (server rad etadi)", async () => {
  await goChild(page);
  await page.getByRole("button", { name: "Ota-ona", exact: true }).click(); // faqat kod dialogi, panel emas
  await expect(page.getByRole("heading", { name: "Ota-ona kodi" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toHaveCount(0);

  const calls = await page.evaluate(async () => {
    const h = { "Content-Type": "application/json" };
    const r = async (url: string, method: string, body?: unknown) => (await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined })).status;
    return {
      dashboard: await r("/api/parent/dashboard", "GET"),
      topup: await r("/api/parent/fund/topups", "POST", { amount: 999999, key: "hack-attempt-1" }),
      rule: await r("/api/parent/reward-rule", "PATCH", { amount: 500000 }),
      profile: await r("/api/parent/child", "PATCH", { name: "X", avatar: "bilimcha" }),
      settle: await r("/api/parent/rewards/any/settle", "POST"),
    };
  });
  expect(calls).toEqual({ dashboard: 403, topup: 403, rule: 403, profile: 403, settle: 403 });

  // sessiyasiz va boshqa kelib chiqishdan
  const anon = await page.context().browser()!.newContext({ baseURL: "http://localhost:3101" });
  expect((await anon.request.get("/api/parent/dashboard")).status()).toBe(401);
  const evil = await page.request.post("/api/parent/unlock", { data: { pin: PIN }, headers: { origin: "http://evil.example" } });
  expect(evil.status()).toBe(403);
  await anon.close();

  // hech narsa o'zgarmagan (kod dialogi allaqachon ochiq)
  await page.getByRole("textbox", { name: "Kod", exact: true }).fill(PIN);
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toBeVisible();
  expect(await balances(page)).toEqual({ fund: 118_000, child: 2_000 });
});

test("7. ota-ona sozlamalari: mukofot qoidasi va profil saqlanadi", async () => {
  await page.getByLabel("Ism").fill("Dilnoza");
  await page.getByText("Sariq", { exact: true }).click();
  await page.getByRole("button", { name: "Saqlash" }).last().click();
  await expect(page.getByText("Profil saqlandi.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Ism")).toHaveValue("Dilnoza");
  await goChild(page);
  await expect(page.getByRole("heading", { name: /Salom, Dilnoza/ })).toBeVisible();
});

test("8. noto'g'ri kod urinishlari serverda cheklanadi va yangilashdan keyin ham saqlanadi", async () => {
  await page.getByRole("button", { name: "Ota-ona", exact: true }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("textbox", { name: "Kod", exact: true }).fill("0000");
    await expect(page.getByRole("button", { name: "Kirish" })).toBeEnabled();
    await page.getByRole("button", { name: "Kirish" }).click();
    await expect(page.getByText(`Yana ${4 - i} ta urinish qoldi`)).toBeVisible();
  }
  await page.getByRole("textbox", { name: "Kod", exact: true }).fill("0000");
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page.getByText(/Juda ko‘p noto‘g‘ri urinish/)).toBeVisible();
  // qulf paytida to'g'ri kod ham o'tmaydi; sahifani yangilash hisoblagichni o'chirmaydi
  await page.reload();
  await page.getByRole("textbox", { name: "Kod", exact: true }).fill(PIN);
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page.getByText(/Juda ko‘p noto‘g‘ri urinish/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Oila paneli" })).toHaveCount(0);
});

void parentLogin;
void startChild;
