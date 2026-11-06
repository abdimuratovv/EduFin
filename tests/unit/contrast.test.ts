import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");
const token = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token topilmadi: ${name}`);
  return m[1];
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [oldingi fon, matn, nom]: oddiy matn uchun WCAG AA ≥ 4.5
const PAIRS: [string, string, string][] = [
  ["color-bg", "color-text", "asosiy matn / fon"],
  ["color-surface", "color-text", "matn / karta"],
  ["color-surface", "color-text-soft", "ikkinchi darajali matn / karta"],
  ["color-bg", "color-text-soft", "ikkinchi darajali matn / fon"],
  ["color-primary", "color-surface", "oq matn / asosiy tugma"],
  ["color-accent", "color-text", "matn / sariq aksent"],
  ["color-primary-soft", "color-primary-dark", "binafsha matn / yumshoq fon"],
  ["color-surface", "color-primary-dark", "binafsha sarlavha / karta"],
  ["color-success-bg", "color-success", "muvaffaqiyat xabari"],
  ["color-warn-bg", "color-warn", "ogohlantirish xabari"],
  ["color-error-bg", "color-error", "xato xabari"],
  ["color-info-bg", "color-primary-dark", "ma'lumot xabari"],
];

describe("ranglar kontrasti (WCAG AA, oddiy matn 4.5:1)", () => {
  for (const [bg, fg, name] of PAIRS) {
    it(name, () => {
      expect(ratio(token(bg), token(fg))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
