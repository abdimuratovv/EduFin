import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>EduFin</h1>
      <p>O‘rgan. Qaror qil. Natijasini his qil.</p>
      <span className={styles.badge}>Demo — haqiqiy pul ishlatilmaydi</span>
    </main>
  );
}
