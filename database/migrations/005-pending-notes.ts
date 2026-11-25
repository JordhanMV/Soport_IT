export const pendingNotesMigration = {
  id: '005-pending-notes',
  up: `
    CREATE TABLE IF NOT EXISTS pending_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_pending_notes_title ON pending_notes(title COLLATE NOCASE);
  `,
} as const
