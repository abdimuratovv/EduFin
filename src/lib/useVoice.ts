"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Tayyor ovozni qo'yadi. Avtomatik boshlanmasa yoki fayl bo'lmasa `failed` bo'ladi va tugma orqali qayta urinish mumkin. */
export function useVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  }, []);

  const play = useCallback(
    (id: string, src?: string) => {
      stop();
      const audio = new Audio(src ?? `/assets/audio/${id}.mp3`);
      audioRef.current = audio;
      setFailed(false);
      audio.onended = () => setPlaying((p) => (p === id ? null : p));
      audio.onerror = () => {
        setFailed(true);
        setPlaying(null);
      };
      setPlaying(id);
      audio.play().catch(() => {
        setFailed(true);
        setPlaying(null);
      });
    },
    [stop],
  );

  useEffect(() => stop, [stop]);
  return { play, stop, playing, failed };
}
