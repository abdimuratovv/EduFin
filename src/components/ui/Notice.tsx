import s from "./ui.module.css";

const ICON = { info: "ℹ", success: "✓", warning: "⚠", error: "✕" } as const;

export function Notice({ tone = "info", children }: { tone?: keyof typeof ICON; children: React.ReactNode }) {
  return (
    <div className={`${s.notice} ${s[tone]}`} role={tone === "error" ? "alert" : "status"}>
      <span className={s.noticeIcon} aria-hidden="true">
        {ICON[tone]}
      </span>
      <div>{children}</div>
    </div>
  );
}
