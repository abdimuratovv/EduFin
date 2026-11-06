/** 100000 → "100 000 demo so‘m". Barcha pul ko'rsatkichlari demo ekanini bildiradi. */
export function demoMoney(n: number): string {
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} demo so‘m`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}
