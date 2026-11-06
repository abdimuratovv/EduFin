import s from "./ui.module.css";

export type ChoiceState = "idle" | "selected" | "correct" | "wrong";

const BADGE: Record<ChoiceState, string> = {
  idle: "",
  selected: "Tanlandi",
  correct: "✓ To‘g‘ri",
  wrong: "↻ Yana o‘ylab ko‘r",
};

/** Rasmli javob. Holat rang, belgi va matn bilan birga ko'rsatiladi. */
export function ChoiceCard(props: {
  image: string;
  alt: string;
  label: string;
  state: ChoiceState;
  disabled?: boolean;
  onChoose: () => void;
}) {
  return (
    <button type="button" className={s.choice} data-state={props.state} disabled={props.disabled} onClick={props.onChoose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.image} alt={props.alt} width={140} height={140} />
      <span>{props.label}</span>
      <span className={s.badge} aria-live="polite">
        {BADGE[props.state]}
      </span>
    </button>
  );
}
