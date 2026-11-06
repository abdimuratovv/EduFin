"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Dashboard } from "@/components/parent/Dashboard";
import { UnlockDialog } from "@/components/parent/UnlockDialog";
import { Notice } from "@/components/ui/Notice";
import { useSession } from "@/lib/useSession";

export default function ParentPage() {
  const router = useRouter();
  const { state, refresh } = useSession();

  useEffect(() => {
    if (state.status === "none") router.replace("/");
  }, [state, router]);

  if (state.status === "error") return <Notice tone="error">{state.message}</Notice>;
  if (state.status !== "ready") return <p aria-busy="true">Yuklanmoqda…</p>;
  if (state.mode === "child") {
    return <UnlockDialog onUnlocked={() => void refresh()} onCancel={() => router.push("/child")} />;
  }
  return <Dashboard />;
}
