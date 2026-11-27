export const syncMetadataMigration = {
  id: '007-sync-metadata',
  up: `
    ALTER TABLE areas ADD COLUMN sync_id TEXT;
    ALTER TABLE people ADD COLUMN sync_id TEXT;
    ALTER TABLE equipment ADD COLUMN sync_id TEXT;
    ALTER TABLE components ADD COLUMN sync_id TEXT;
    ALTER TABLE pending_notes ADD COLUMN sync_id TEXT;

    ALTER TABLE areas ADD COLUMN sync_updated_at TEXT;
    ALTER TABLE people ADD COLUMN sync_updated_at TEXT;
    ALTER TABLE equipment ADD COLUMN sync_updated_at TEXT;
    ALTER TABLE components ADD COLUMN sync_updated_at TEXT;
    ALTER TABLE pending_notes ADD COLUMN sync_updated_at TEXT;

    ALTER TABLE areas ADD COLUMN sync_deleted INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE people ADD COLUMN sync_deleted INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE equipment ADD COLUMN sync_deleted INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE components ADD COLUMN sync_deleted INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE pending_notes ADD COLUMN sync_deleted INTEGER NOT NULL DEFAULT 0;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_sync_id ON areas(sync_id) WHERE sync_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_people_sync_id ON people(sync_id) WHERE sync_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_sync_id ON equipment(sync_id) WHERE sync_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_components_sync_id ON components(sync_id) WHERE sync_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_notes_sync_id ON pending_notes(sync_id) WHERE sync_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      sync_id TEXT,
      operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
      queued_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
} as const
