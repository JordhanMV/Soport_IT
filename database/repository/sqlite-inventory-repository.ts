import initSqlJs, { Database as SqlDatabase, SqlValue } from 'sql.js'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { runMigrations } from '../migrations/runner'
import type { ComponentInput, DashboardSummary, Equipment, EquipmentInput, InventoryComponent, Person, PersonInput, Area } from '../../src/shared/types'

interface Db {
  pragma(value: string): void
  exec(sql: string): void
  prepare<T>(sql: string): {
    get(...params: unknown[]): T | undefined
    all(...params: unknown[]): T[]
    run(...params: unknown[]): { changes: number; lastInsertRowid: number }
  }
  close(): void
}

class PersistedSqlJsDatabase implements Db {
  constructor(private readonly database: SqlDatabase, private readonly filePath: string) {}

  pragma(value: string): void { this.database.exec(`PRAGMA ${value}`) }
  exec(sql: string): void { this.database.exec(sql); this.persist() }

  prepare<T>(sql: string) {
    return {
      get: (...params: unknown[]) => {
        const statement = this.database.prepare(sql)
        try {
          statement.bind(params as SqlValue[])
          return statement.step() ? statement.getAsObject() as T : undefined
        } finally { statement.free() }
      },
      all: (...params: unknown[]) => {
        const statement = this.database.prepare(sql)
        const rows: T[] = []
        try {
          statement.bind(params as SqlValue[])
          while (statement.step()) rows.push(statement.getAsObject() as T)
          return rows
        } finally { statement.free() }
      },
      run: (...params: unknown[]) => {
        this.database.run(sql, params as SqlValue[])
        const changes = this.database.getRowsModified()
        const idResult = this.database.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0]
        this.persist()
        return { changes, lastInsertRowid: Number(idResult ?? 0) }
      },
    }
  }

  close(): void { this.persist(); this.database.close() }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true })
    const temporaryPath = `${this.filePath}.tmp`
    writeFileSync(temporaryPath, Buffer.from(this.database.export()))
    renameSync(temporaryPath, this.filePath)
  }
}

const equipmentSelect = `
  SELECT e.id, e.asset_tag AS assetTag, e.person_id AS personId, p.name AS personName,
    a.name AS areaName, e.device_type AS deviceType, e.laptop_brand AS laptopBrand,
    e.processor, e.memory_gb AS memoryGb, e.graphics_card AS graphicsCard,
    e.disk_capacity_gb AS diskCapacityGb, e.disk_type AS diskType,
    e.operating_system AS operatingSystem, e.maintenance_done AS maintenanceDone,
    e.last_maintenance_date AS lastMaintenanceDate, e.status, e.notes,
    (SELECT COUNT(*) FROM components c WHERE c.equipment_id = e.id) AS componentCount,
    e.created_at AS createdAt
  FROM equipment e
  LEFT JOIN people p ON p.id = e.person_id
  LEFT JOIN areas a ON a.id = p.area_id
`

export class SqliteInventoryRepository {
  constructor(private readonly db: Db) {}

  static async open(filePath: string): Promise<SqliteInventoryRepository> {
    const SQL = await initSqlJs({ useOldExtensionFunctions: false, locateFile: (file) => join(dirname(require.resolve('sql.js')), file) })
    const database = existsSync(filePath) ? new SQL.Database(readFileSync(filePath)) : new SQL.Database()
    const db = new PersistedSqlJsDatabase(database, filePath)
    db.pragma('foreign_keys = ON')
    runMigrations(db)
    return new SqliteInventoryRepository(db)
  }

  close(): void {
    this.db.close()
  }

  dashboard(): DashboardSummary {
    const counts = this.db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM people WHERE status = 'Activo') AS peopleCount,
        (SELECT COUNT(*) FROM equipment) AS equipmentCount,
        (SELECT COUNT(*) FROM components) AS componentCount,
        (SELECT COUNT(*) FROM equipment WHERE person_id IS NULL) AS unassignedEquipment
    `).get() as Omit<DashboardSummary, 'recentEquipment'>
    return { ...counts, recentEquipment: this.listEquipment('').slice(0, 5) }
  }

  listPeople(search = ''): Person[] {
    const term = `%${search.trim()}%`
    return this.db.prepare(`
      SELECT p.id, p.name, p.email, p.phone, p.area_id AS areaId, a.name AS areaName,
        e.id AS equipmentId, e.asset_tag AS assetTag, p.status, p.created_at AS createdAt
      FROM people p
      LEFT JOIN areas a ON a.id = p.area_id
      LEFT JOIN equipment e ON e.person_id = p.id
      WHERE p.name LIKE ? OR p.email LIKE ? OR a.name LIKE ? OR e.asset_tag LIKE ?
      ORDER BY p.name COLLATE NOCASE
    `).all(term, term, term, term) as Person[]
  }

  savePerson(input: PersonInput, id?: number): Person {
    const name = required(input.name, 'El nombre de la persona es obligatorio.')
    const areaId = input.areaId || null
    if (areaId && !this.db.prepare('SELECT id FROM areas WHERE id = ?').get(areaId)) throw new Error('El área seleccionada ya no existe.')
    if (id) {
      const result = this.db.prepare('UPDATE people SET name = ?, email = ?, phone = ?, area_id = ?, status = ? WHERE id = ?')
        .run(name, clean(input.email), clean(input.phone), areaId, input.status, id)
      if (!result.changes) throw new Error('No se encontró la persona.')
      return this.listPeople('').find((person) => person.id === id)!
    }
    const result = this.db.prepare('INSERT INTO people (name, email, phone, area_id, status) VALUES (?, ?, ?, ?, ?)')
      .run(name, clean(input.email), clean(input.phone), areaId, input.status)
    return this.listPeople('').find((person) => person.id === Number(result.lastInsertRowid))!
  }

  deletePerson(id: number): void {
    const result = this.db.prepare('DELETE FROM people WHERE id = ?').run(id)
    if (!result.changes) throw new Error('No se encontró la persona.')
  }

  listEquipment(search = ''): Equipment[] {
    const term = `%${search.trim()}%`
    const rows = this.db.prepare(`${equipmentSelect}
      WHERE e.asset_tag LIKE ? OR p.name LIKE ? OR e.processor LIKE ? OR e.operating_system LIKE ?
      ORDER BY e.created_at DESC, e.asset_tag COLLATE NOCASE
    `).all(term, term, term, term) as (Omit<Equipment, 'maintenanceDone'> & { maintenanceDone: number })[]
    return rows.map((row) => ({ ...row, maintenanceDone: Boolean(row.maintenanceDone) }))
  }

  saveEquipment(input: EquipmentInput, id?: number): Equipment {
    const assetTag = required(input.assetTag, 'El identificador del equipo es obligatorio.')
    const laptopBrand = input.deviceType === 'Laptop' ? required(input.laptopBrand, 'La marca de la laptop es obligatoria.') : ''
    const memoryGb = input.memoryGb === null ? null : Number(input.memoryGb)
    if (memoryGb !== null && (!Number.isInteger(memoryGb) || memoryGb < 0)) throw new Error('La memoria debe ser un número entero igual o mayor que cero.')
    const diskCapacityGb = input.diskCapacityGb === null ? null : Number(input.diskCapacityGb)
    if (diskCapacityGb !== null && (!Number.isInteger(diskCapacityGb) || diskCapacityGb < 0)) throw new Error('La capacidad del disco debe ser un número entero igual o mayor que cero.')
    if (input.operatingSystem && !['Windows 10', 'Windows 11'].includes(input.operatingSystem)) throw new Error('El sistema operativo seleccionado no es válido.')
    const lastMaintenanceDate = input.maintenanceDone ? clean(input.lastMaintenanceDate) || null : null
    if (lastMaintenanceDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastMaintenanceDate)) throw new Error('La fecha del último mantenimiento no es válida.')
    if (input.personId && !this.db.prepare("SELECT id FROM people WHERE id = ? AND status = 'Activo'").get(input.personId)) {
      throw new Error('La persona seleccionada no existe o está inactiva.')
    }
    if (id) {
      const result = this.db.prepare(`UPDATE equipment SET asset_tag = ?, person_id = ?, device_type = ?, laptop_brand = ?,
        processor = ?, memory_gb = ?, graphics_card = ?, disk_capacity_gb = ?, disk_type = ?,
        operating_system = ?, maintenance_done = ?, last_maintenance_date = ?, status = ?, notes = ? WHERE id = ?`)
        .run(assetTag, input.personId || null, input.deviceType, laptopBrand, clean(input.processor), memoryGb,
          clean(input.graphicsCard), diskCapacityGb, input.diskType || null, input.operatingSystem || null,
          input.maintenanceDone ? 1 : 0, lastMaintenanceDate, input.status, clean(input.notes), id)
      if (!result.changes) throw new Error('No se encontró el equipo.')
      return this.listEquipment('').find((equipment) => equipment.id === id)!
    }
    const result = this.db.prepare(`INSERT INTO equipment
      (asset_tag, person_id, device_type, laptop_brand, processor, memory_gb, graphics_card, disk_capacity_gb, disk_type,
       operating_system, maintenance_done, last_maintenance_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(assetTag, input.personId || null, input.deviceType, laptopBrand, clean(input.processor), memoryGb,
        clean(input.graphicsCard), diskCapacityGb, input.diskType || null, input.operatingSystem || null,
        input.maintenanceDone ? 1 : 0, lastMaintenanceDate, input.status, clean(input.notes))
    return this.listEquipment('').find((equipment) => equipment.id === Number(result.lastInsertRowid))!
  }

  deleteEquipment(id: number): void {
    const result = this.db.prepare('DELETE FROM equipment WHERE id = ?').run(id)
    if (!result.changes) throw new Error('No se encontró el equipo.')
  }

  listComponents(search = ''): InventoryComponent[] {
    const term = `%${search.trim()}%`
    return this.db.prepare(`
      SELECT c.id, c.name, c.category, c.brand, c.model, c.serial_number AS serialNumber,
        c.equipment_id AS equipmentId, e.asset_tag AS assetTag, c.created_at AS createdAt
      FROM components c LEFT JOIN equipment e ON e.id = c.equipment_id
      WHERE c.name LIKE ? OR c.category LIKE ? OR c.serial_number LIKE ? OR e.asset_tag LIKE ?
      ORDER BY c.name COLLATE NOCASE
    `).all(term, term, term, term) as InventoryComponent[]
  }

  saveComponent(input: ComponentInput, id?: number): InventoryComponent {
    const name = required(input.name, 'El nombre del componente es obligatorio.')
    const category = required(input.category, 'La categoría es obligatoria.')
    if (input.equipmentId && !this.db.prepare('SELECT id FROM equipment WHERE id = ?').get(input.equipmentId)) throw new Error('El equipo seleccionado ya no existe.')
    if (id) {
      const result = this.db.prepare('UPDATE components SET name = ?, category = ?, brand = ?, model = ?, serial_number = ?, equipment_id = ? WHERE id = ?')
        .run(name, category, clean(input.brand), clean(input.model), clean(input.serialNumber), input.equipmentId || null, id)
      if (!result.changes) throw new Error('No se encontró el componente.')
    } else {
      this.db.prepare('INSERT INTO components (name, category, brand, model, serial_number, equipment_id) VALUES (?, ?, ?, ?, ?, ?)')
        .run(name, category, clean(input.brand), clean(input.model), clean(input.serialNumber), input.equipmentId || null)
    }
    const component = this.listComponents('').find((item) => item.id === (id ?? Number(this.db.prepare<{ id: number }>('SELECT last_insert_rowid() AS id').get()?.id)))
    if (!component) throw new Error('No se pudo recuperar el componente guardado.')
    return component
  }

  deleteComponent(id: number): void {
    const result = this.db.prepare('DELETE FROM components WHERE id = ?').run(id)
    if (!result.changes) throw new Error('No se encontró el componente.')
  }

  listAreas(): Area[] {
    return this.db.prepare('SELECT id, name, created_at AS createdAt FROM areas ORDER BY name COLLATE NOCASE').all() as Area[]
  }

  saveArea(value: string, id?: number): Area {
    const name = required(value, 'El nombre del área es obligatorio.')
    if (id) {
      const result = this.db.prepare('UPDATE areas SET name = ? WHERE id = ?').run(name, id)
      if (!result.changes) throw new Error('No se encontró el área.')
    } else {
      this.db.prepare('INSERT INTO areas (name) VALUES (?)').run(name)
    }
    const area = this.listAreas().find((item) => item.id === (id ?? Number(this.db.prepare<{ id: number }>('SELECT last_insert_rowid() AS id').get()?.id)))
    if (!area) throw new Error('No se pudo recuperar el área guardada.')
    return area
  }

  deleteArea(id: number): void {
    const result = this.db.prepare('DELETE FROM areas WHERE id = ?').run(id)
    if (!result.changes) throw new Error('No se encontró el área.')
  }
}

function clean(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function required(value: string, message: string): string {
  const result = clean(value)
  if (!result) throw new Error(message)
  return result
}
