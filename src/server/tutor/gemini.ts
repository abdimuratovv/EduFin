import type { TutorProvider } from "./types";

/** Gemini generateContent (REST). Kalit faqat serverda, header orqali yuboriladi. */
export function geminiProvider(apiKey: string, model: string): TutorProvider {
  return {
    async generate({ system, user }, signal) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.6, thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal,
      });
      if (!res.ok) throw new Error(`gemini HTTP ${res.status}`);
      const json = (await res.json()) as {
        candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      };
      const candidate = json.candidates?.[0];
      // Kesilgan javob (masalan MAX_TOKENS: fikrlash tokenlari limitni yeb qo'ygan) bolaga ko'rsatilmaydi.
      if (candidate?.finishReason !== "STOP") throw new Error(`gemini finish=${candidate?.finishReason ?? "yo'q"}`);
      const parts = candidate.content?.parts ?? [];
      return parts
        .filter((p) => !p.thought)
        .map((p) => p.text ?? "")
        .join("")
        .trim();
    },
  };
}
