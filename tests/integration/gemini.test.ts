import { afterEach, describe, expect, it, vi } from "vitest";
import { geminiProvider } from "../../src/server/tutor/gemini";

const input = { system: "s", user: "u" };
const signal = new AbortController().signal;

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, status, json: async () => body })));
}

afterEach(() => vi.unstubAllGlobals());

describe("Gemini adapteri", () => {
  it("to'liq (STOP) javobni qaytaradi, fikrlash qismini tashlaydi", async () => {
    mockFetch({
      candidates: [{ finishReason: "STOP", content: { parts: [{ text: "o'ylayapman", thought: true }, { text: "Yaxshi urinish! " }, { text: "Yana o‘yla." }] } }],
    });
    expect(await geminiProvider("k", "m").generate(input, signal)).toBe("Yaxshi urinish! Yana o‘yla.");
  });

  it("kesilgan (MAX_TOKENS) javobni rad etadi", async () => {
    mockFetch({ candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "Tushlikda qornimiz ochganda mazali yem" }] } }] });
    await expect(geminiProvider("k", "m").generate(input, signal)).rejects.toThrow(/MAX_TOKENS/);
  });

  it("HTTP xato va bo'sh nomzodlarni rad etadi", async () => {
    mockFetch({}, false, 429);
    await expect(geminiProvider("k", "m").generate(input, signal)).rejects.toThrow(/429/);
    mockFetch({ candidates: [] });
    await expect(geminiProvider("k", "m").generate(input, signal)).rejects.toThrow();
  });
});
