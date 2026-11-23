export const passwordManagerMigration = {
  id: '004-password-manager',
  up: `
    CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      username TEXT NOT NULL DEFAULT '',
      password_ciphertext TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_passwords_title ON passwords(title COLLATE NOCASE);
  `,
} as const
