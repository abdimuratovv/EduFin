import s from "./ui.module.css";

/** Topshiriq nuqtalari + matnli "2 / 3" (rangga bog'liq emas). */
export function Progress({ current, total, done }: { current: number; total: number; done: number }) {
  return (
    <div className={s.progress} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Dars bosqichi">
      <div className={s.dots} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`${s.dot} ${i < done ? s.dotDone : ""} ${i === current ? s.dotNow : ""}`} />
        ))}
      </div>
      <strong>
        {Math.min(current + 1, total)} / {total}
      </strong>
    </div>
  );
}
