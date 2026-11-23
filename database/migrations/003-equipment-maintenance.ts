export const equipmentMaintenanceMigration = {
  id: '003-equipment-maintenance',
  up: `
    ALTER TABLE equipment ADD COLUMN operating_system TEXT
      CHECK (operating_system IS NULL OR operating_system IN ('Windows 10', 'Windows 11'));
    ALTER TABLE equipment ADD COLUMN maintenance_done INTEGER NOT NULL DEFAULT 0
      CHECK (maintenance_done IN (0, 1));
    ALTER TABLE equipment ADD COLUMN last_maintenance_date TEXT;
  `,
} as const
