"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { api, errorText } from "@/lib/api";
import s from "@/app/page.module.css";

export function StartDemo() {
  const router = useRouter();
  const [busy, setBusy] = useState<"child" | "parent" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(target: "child" | "parent") {
    setBusy(target);
    setError(null);
    try {
      await api("/api/demo/session", { method: "POST" });
      router.push(`/${target}`);
    } catch (e) {
      setError(errorText(e));
      setBusy(null);
    }
  }

  return (
    <div className={s.actions}>
      {error && <Notice tone="error">{error}</Notice>}
      <Button size="child" loading={busy === "child"} disabled={busy !== null} onClick={() => start("child")}>
        Bola sifatida boshlash
      </Button>
      <Button size="child" variant="secondary" loading={busy === "parent"} disabled={busy !== null} onClick={() => start("parent")}>
        Ota-ona sifatida kirish
      </Button>
    </div>
  );
}
