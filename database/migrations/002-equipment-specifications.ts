export const equipmentSpecificationsMigration = {
  id: '002-equipment-specifications',
  up: `
    ALTER TABLE equipment ADD COLUMN device_type TEXT NOT NULL DEFAULT 'Escritorio'
      CHECK (device_type IN ('Laptop', 'Escritorio'));
    ALTER TABLE equipment ADD COLUMN laptop_brand TEXT NOT NULL DEFAULT '';
    ALTER TABLE equipment ADD COLUMN graphics_card TEXT NOT NULL DEFAULT '';
    ALTER TABLE equipment ADD COLUMN disk_capacity_gb INTEGER
      CHECK (disk_capacity_gb IS NULL OR disk_capacity_gb >= 0);
    ALTER TABLE equipment ADD COLUMN disk_type TEXT
      CHECK (disk_type IS NULL OR disk_type IN ('SSD', 'HDD'));
  `,
} as const
