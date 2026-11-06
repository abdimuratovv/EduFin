import type { SpeechProvider } from "./types";

/** ElevenLabs TTS (o'zbekcha: model eleven_v4). Kalit faqat serverda. */
export function elevenLabsProvider(apiKey: string, voiceId: string, model: string): SpeechProvider {
  return {
    async synthesize(text, signal) {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_64`, {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: model, language_code: "uz" }),
        signal,
      });
      if (!res.ok) throw new Error(`elevenlabs HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) throw new Error("elevenlabs: bo'sh audio");
      return buf;
    },
  };
}
