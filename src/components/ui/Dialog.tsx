"use client";
import { useEffect, useRef } from "react";
import s from "./ui.module.css";

/** Standart <dialog>: fokus tuzoqqa tushadi, Esc bilan yopiladi. */
export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 id="dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
