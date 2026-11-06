"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Notice } from "@/components/ui/Notice";
import { api, errorText } from "@/lib/api";
import s from "./parent.module.css";

/** Ota-ona rejimiga kirish kodi. Tekshiruv va urinishlar cheklovi serverda. */
export function UnlockDialog({ onUnlocked, onCancel }: { onUnlocked: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/parent/unlock", { method: "POST", body: { pin } });
      setPin("");
      onUnlocked();
    } catch (err) {
      setError(errorText(err));
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open title="Ota-ona kodi" onClose={onCancel}>
      <form className={s.form} onSubmit={submit}>
        <p className={s.hint}>Ota-ona bo‘limiga kirish uchun kodni kiriting.</p>
        <label className={s.field}>
          Kod
          <input
            className={s.input}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            maxLength={32}
            onChange={(e) => setPin(e.target.value)}
          />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className={s.row}>
          <Button type="submit" loading={busy} disabled={pin.length === 0}>
            Kirish
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Bola rejimiga qaytish
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
