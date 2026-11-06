import "server-only";
import { getEnv } from "../env";
import { openDb, type Db } from "./connection";
import { seedDemo } from "./seed";

const globalForDb = globalThis as unknown as { __edufinDb?: Db };

/** Ilova uchun yagona baza ulanishi (dev rejimida qayta yuklanishga chidamli). */
export function getDb(): Db {
  if (!globalForDb.__edufinDb) {
    const db = openDb(getEnv().DATABASE_PATH);
    seedDemo(db);
    globalForDb.__edufinDb = db;
  }
  return globalForDb.__edufinDb;
}
