import type { ButtonHTMLAttributes } from "react";
import s from "./ui.module.css";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, children, ...rest }: Props) {
  return (
    <button {...rest} className={s.iconButton} aria-label={label} title={label}>
      {children}
    </button>
  );
}
