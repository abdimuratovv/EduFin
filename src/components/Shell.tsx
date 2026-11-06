"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import s from "./Shell.module.css";

/** Umumiy ramka: "Demo" belgisi va pastdagi Bola / Ota-ona almashtirgichi. */
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function goChild() {
    if (path.startsWith("/child") || busy) return;
    setBusy(true);
    try {
      // Ota-ona vakolatini serverda yopadi; xato bo'lsa ham bola sahifasi o'zi tekshiradi.
      await api("/api/mode/child", { method: "POST" }).catch(() => undefined);
    } finally {
      setBusy(false);
      router.push("/child");
    }
  }

  return (
    <>
      <header className={s.top}>
        <span className={s.logo}>EduFin</span>
        <span className={s.demo}>Demo — haqiqiy pul yo‘q</span>
      </header>
      <main className={s.main}>{children}</main>
      <nav className={s.nav} aria-label="Rejim">
        <button className={s.tab} aria-current={path.startsWith("/child") ? "page" : undefined} onClick={goChild} disabled={busy}>
          Bola
        </button>
        <button className={s.tab} aria-current={path.startsWith("/parent") ? "page" : undefined} onClick={() => router.push("/parent")}>
          Ota-ona
        </button>
      </nav>
    </>
  );
}
