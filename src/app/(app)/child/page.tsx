"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LessonFlow } from "@/components/child/LessonFlow";
import { Notice } from "@/components/ui/Notice";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";

export default function ChildPage() {
  const router = useRouter();
  const { state, refresh } = useSession();

  useEffect(() => {
    if (state.status === "none") router.replace("/");
    // Ota-ona rejimidan bola sahifasiga kirilsa, vakolat serverda yopiladi.
    if (state.status === "ready" && state.mode === "parent") {
      api("/api/mode/child", { method: "POST" }).then(() => refresh(), () => undefined);
    }
  }, [state, router, refresh]);

  if (state.status === "error") return <Notice tone="error">{state.message}</Notice>;
  if (state.status !== "ready" || state.mode !== "child") return <p aria-busy="true">Yuklanmoqda…</p>;
  return <LessonFlow />;
}
