export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    id: 1,
    name: "initial",
    sql: `
CREATE TABLE families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE parents (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  display_name TEXT NOT NULL,
  pin_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE child_profiles (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age BETWEEN 3 AND 12),
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  child_id TEXT REFERENCES child_profiles(id),
  mode TEXT NOT NULL CHECK (mode IN ('parent', 'child')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE lesson_progress (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES child_profiles(id),
  lesson_id TEXT NOT NULL,
  lesson_version INTEGER NOT NULL,
  reward_amount INTEGER NOT NULL CHECK (reward_amount >= 0),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE (child_id, lesson_id, lesson_version)
);

CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  progress_id TEXT NOT NULL REFERENCES lesson_progress(id),
  task_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_attempts_progress ON attempts(progress_id, task_id);

CREATE TABLE reward_rules (
  family_id TEXT NOT NULL REFERENCES families(id),
  lesson_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 1000000),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (family_id, lesson_id)
);

CREATE TABLE reward_entitlements (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  child_id TEXT NOT NULL REFERENCES child_profiles(id),
  lesson_id TEXT NOT NULL,
  lesson_version INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid')),
  ledger_tx_id TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  UNIQUE (child_id, lesson_id, lesson_version)
);

-- Balanslar faqat shu jadvaldan hisoblanadi (alohida balans yozuvi yo'q).
-- Hisoblar: 'external' (demo tashqi manba), 'fund' (oila fondi), 'child:<id>' (bola balansi).
CREATE TABLE ledger_transactions (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  type TEXT NOT NULL CHECK (type IN ('TOPUP', 'REWARD')),
  source_account TEXT NOT NULL,
  dest_account TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'DEMO_UZS',
  entitlement_id TEXT REFERENCES reward_entitlements(id),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (family_id, idempotency_key)
);
CREATE INDEX idx_ledger_family ON ledger_transactions(family_id, created_at);
`,
  },
  {
    id: 2,
    name: "auth",
    sql: `
-- PIN urinishlari serverda saqlanadi: sahifani yangilash hisoblagichni o'chirmaydi.
CREATE TABLE pin_attempts (
  family_id TEXT PRIMARY KEY REFERENCES families(id),
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

-- Muhim amallar yozuvi. PIN va sessiya tokenlari bu yerga yozilmaydi.
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  event TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_family ON audit_log(family_id, created_at);
`,
  },
  {
    id: 3,
    name: "tutor_requests",
    sql: `
-- AI ustoz so'rovlari: faqat holat va vaqt. Prompt, javob matni, bola ismi saqlanmaydi.
CREATE TABLE tutor_requests (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  child_id TEXT NOT NULL REFERENCES child_profiles(id),
  task_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ai', 'fallback_limit', 'fallback_not_configured', 'fallback_ai_error', 'fallback_audio_error', 'fallback_invalid', 'fallback_timeout')),
  latency_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_tutor_child_task ON tutor_requests(child_id, task_id, status);
`,
  },
];
