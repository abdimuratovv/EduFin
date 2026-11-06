const FILTER: Record<string, string> = {
  bilimcha: "none",
  "bilimcha-sariq": "hue-rotate(170deg)",
  "bilimcha-yashil": "hue-rotate(-110deg)",
};

export const AVATAR_OPTIONS = [
  { id: "bilimcha", label: "Binafsha" },
  { id: "bilimcha-sariq", label: "Sariq" },
  { id: "bilimcha-yashil", label: "Yashil" },
] as const;

export function Avatar({ id, size = 96, alt = "" }: { id: string; size?: number; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/assets/images/bilimcha.svg" alt={alt} width={size} height={size} style={{ filter: FILTER[id] ?? "none" }} />
  );
}
