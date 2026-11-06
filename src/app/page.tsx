import { StartDemo } from "@/components/StartDemo";
import s from "./page.module.css";

export default function Home() {
  return (
    <main className={s.main}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/images/bilimcha.svg" alt="Qahramon Bilimcha" width={180} height={180} />
      <h1>EduFin</h1>
      <p className={s.lead}>O‘rgan. Qaror qil. Natijasini his qil.</p>
      <span className={s.badge}>Demo — barcha pul miqdorlari sun’iy, haqiqiy pul ishlatilmaydi</span>
      <StartDemo />
      <p className={s.small}>Ota-ona rejimi kod bilan himoyalangan.</p>
    </main>
  );
}
