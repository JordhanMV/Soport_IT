export const equipmentDeviceTypesMigration = {
  id: '006-equipment-device-types',
  up: `
    DROP INDEX IF EXISTS idx_equipment_person_unique;
    CREATE TABLE equipment_device_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_tag TEXT NOT NULL COLLATE NOCASE UNIQUE,
      person_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      processor TEXT NOT NULL DEFAULT '',
      memory_gb INTEGER CHECK (memory_gb IS NULL OR memory_gb >= 0),
      status TEXT NOT NULL DEFAULT 'Operativo' CHECK (status IN ('Operativo', 'Mantenimiento', 'Baja')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      device_type TEXT NOT NULL DEFAULT 'Escritorio'
        CHECK (device_type IN ('Laptop', 'Escritorio', 'Impresora', 'Monitor')),
      laptop_brand TEXT NOT NULL DEFAULT '',
      graphics_card TEXT NOT NULL DEFAULT '',
      disk_capacity_gb INTEGER CHECK (disk_capacity_gb IS NULL OR disk_capacity_gb >= 0),
      disk_type TEXT CHECK (disk_type IS NULL OR disk_type IN ('SSD', 'HDD')),
      operating_system TEXT CHECK (operating_system IS NULL OR operating_system IN ('Windows 10', 'Windows 11')),
      maintenance_done INTEGER NOT NULL DEFAULT 0 CHECK (maintenance_done IN (0, 1)),
      last_maintenance_date TEXT
    );
    INSERT INTO equipment_device_types
      (id, asset_tag, person_id, processor, memory_gb, status, notes, created_at, device_type,
       laptop_brand, graphics_card, disk_capacity_gb, disk_type, operating_system, maintenance_done, last_maintenance_date)
    SELECT id, asset_tag, person_id, processor, memory_gb, status, notes, created_at, device_type,
      laptop_brand, graphics_card, disk_capacity_gb, disk_type, operating_system, maintenance_done, last_maintenance_date
    FROM equipment;
    DROP TABLE equipment;
    ALTER TABLE equipment_device_types RENAME TO equipment;
    CREATE INDEX idx_equipment_asset_tag ON equipment(asset_tag COLLATE NOCASE);
  `,
} as const
