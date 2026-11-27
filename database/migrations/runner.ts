import { initialSchemaMigration } from './001-initial-schema'
import { equipmentSpecificationsMigration } from './002-equipment-specifications'
import { equipmentMaintenanceMigration } from './003-equipment-maintenance'
import { passwordManagerMigration } from './004-password-manager'
import { pendingNotesMigration } from './005-pending-notes'
import { equipmentDeviceTypesMigration } from './006-equipment-device-types'

export interface Migration {
  id: string
  up: string
}

interface MigrationDatabase {
  exec(sql: string): void
  prepare<T>(sql: string): { all(...params: unknown[]): T[] }
}

const migrations: Migration[] = [initialSchemaMigration, equipmentSpecificationsMigration, equipmentMaintenanceMigration, passwordManagerMigration, pendingNotesMigration, equipmentDeviceTypesMigration]

export function runMigrations(database: MigrationDatabase): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(database.prepare<{ id: string }>('SELECT id FROM schema_migrations').all().map(({ id }) => id))
  const seen = new Set<string>()
  let previousId = ''

  for (const migration of migrations) {
    if (seen.has(migration.id) || migration.id <= previousId) {
      throw new Error(`El orden de migraciones no es válido: ${migration.id}`)
    }
    seen.add(migration.id)
    previousId = migration.id

    if (applied.has(migration.id)) continue
    if (migration.id === '006-equipment-device-types') database.exec('PRAGMA foreign_keys = OFF')
    database.exec(`
      BEGIN IMMEDIATE;
      ${migration.up}
      INSERT INTO schema_migrations (id) VALUES ('${migration.id}');
      COMMIT;
    `)
    if (migration.id === '006-equipment-device-types') database.exec('PRAGMA foreign_keys = ON')
  }
}
