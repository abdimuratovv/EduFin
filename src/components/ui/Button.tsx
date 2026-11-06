import type { ButtonHTMLAttributes } from "react";
import s from "./ui.module.css";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "md" | "child";
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, disabled, children, className, ...rest }: Props) {
  const cls = [s.button, s[variant], size === "child" ? s.child : "", className ?? ""].join(" ");
  return (
    <button {...rest} className={cls} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading && <span className={s.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
