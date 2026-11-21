export const initialSchemaMigration = {
  id: '001-initial-schema',
  up: `
    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_tag TEXT NOT NULL COLLATE NOCASE UNIQUE,
      person_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      processor TEXT NOT NULL DEFAULT '',
      memory_gb INTEGER CHECK (memory_gb IS NULL OR memory_gb >= 0),
      status TEXT NOT NULL DEFAULT 'Operativo' CHECK (status IN ('Operativo', 'Mantenimiento', 'Baja')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_person_unique ON equipment(person_id) WHERE person_id IS NOT NULL;
    CREATE TABLE IF NOT EXISTS components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      serial_number TEXT NOT NULL DEFAULT '',
      equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_people_name ON people(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_equipment_asset_tag ON equipment(asset_tag COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_components_name ON components(name COLLATE NOCASE);
  `,
} as const
