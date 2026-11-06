import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { migrations } from "./migrations";

export type Db = Database.Database;

export function openDb(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  if (path !== ":memory:") db.pragma("journal_mode = WAL");
  migrate(db);
  return db;
}

export function migrate(db: Db): void {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)");
  const applied = new Set(
    (db.prepare("SELECT id FROM schema_migrations").all() as { id: number }[]).map((r) => r.id),
  );
  for (const m of migrations) {
    if (applied.has(m.id)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      db.prepare("INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)").run(
        m.id,
        m.name,
        new Date().toISOString(),
      );
    })();
  }
}

/** BEGIN IMMEDIATE tranzaksiya; baza band bo'lsa cheklangan qayta urinish. */
export function immediate<T>(db: Db, fn: () => T, retries = 3): T {
  for (let attempt = 0; ; attempt++) {
    try {
      return db.transaction(fn).immediate();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if ((code === "SQLITE_BUSY" || code === "SQLITE_BUSY_SNAPSHOT") && attempt < retries) continue;
      throw e;
    }
  }
}
