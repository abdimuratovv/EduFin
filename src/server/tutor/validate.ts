const FORBIDDEN = /so[‘'’`ʻ]?m\b|balans|mukofot|fond|o[‘'’`ʻ]tkaz|hisob|pul\b|\bsum\b|\d/i;
const MARKUP = /[*#_`>\[\]{}<]|https?:|www\./;

/**
 * Model natijasini tekshiradi: bo'sh emas, qisqa, ko'pi bilan 2 gap, lotin yozuvi,
 * markup va moliyaviy so'zlarsiz. Bu mazmunni to'liq kafolatlamaydi (sifat sinovi alohida).
 * Yaroqli matnni qaytaradi, aks holda null.
 */
export function validateTutorText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (/(^|\n)\s*[-•*–]\s/.test(raw)) return null; // ro'yxat belgilari
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length < 8 || text.length > 240) return null;
  if (MARKUP.test(text) || FORBIDDEN.test(text)) return null;
  const sentences = text.split(/[.!?…]+/).map((x) => x.trim()).filter(Boolean);
  if (sentences.length < 1 || sentences.length > 2) return null;
  const letters = text.match(/\p{L}/gu) ?? [];
  const latin = text.match(/[A-Za-zʻʼ]/g) ?? [];
  if (letters.length === 0 || latin.length / letters.length < 0.9) return null; // kirill va boshqa yozuvlar rad
  return text;
}
