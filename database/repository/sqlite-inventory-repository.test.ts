import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import initSqlJs from 'sql.js'
import { afterEach, describe, expect, it } from 'vitest'
import { SqliteInventoryRepository } from './sqlite-inventory-repository'

const temporaryFolders: string[] = []

afterEach(() => {
  for (const folder of temporaryFolders.splice(0)) rmSync(folder, { recursive: true, force: true })
})

describe('SQLite local repository', () => {
  it('applies the ordered schema migration once and leaves a new database empty', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'inventory-migration-test-'))
    temporaryFolders.push(folder)
    const path = join(folder, 'inventory.sqlite')

    let repository = await SqliteInventoryRepository.open(path)
    expect(repository.dashboard()).toMatchObject({
      peopleCount: 0, equipmentCount: 0, componentCount: 0, unassignedEquipment: 0,
    })
    repository.close()

    const SQL = await initSqlJs({ locateFile: (file) => join(dirname(require.resolve('sql.js')), file) })
    let database = new SQL.Database(readFileSync(path))
    expect(database.exec('SELECT id FROM schema_migrations')).toEqual([{
      columns: ['id'],
      values: [['001-initial-schema'], ['002-equipment-specifications'], ['003-equipment-maintenance']],
    }])
    expect(database.exec(`
      SELECT
        (SELECT COUNT(*) FROM areas) AS areas,
        (SELECT COUNT(*) FROM people) AS people,
        (SELECT COUNT(*) FROM equipment) AS equipment,
        (SELECT COUNT(*) FROM components) AS components
    `)[0].values).toEqual([[0, 0, 0, 0]])
    database.close()

    repository = await SqliteInventoryRepository.open(path)
    repository.close()
    database = new SQL.Database(readFileSync(path))
    expect(database.exec('SELECT id FROM schema_migrations')).toEqual([{
      columns: ['id'],
      values: [['001-initial-schema'], ['002-equipment-specifications'], ['003-equipment-maintenance']],
    }])
    database.close()
  })

  it('persists people, equipment, components and summary data without seeded records', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'inventory-test-'))
    temporaryFolders.push(folder)
    const path = join(folder, 'inventory.sqlite')
    let repository = await SqliteInventoryRepository.open(path)

    expect(repository.dashboard()).toMatchObject({ peopleCount: 0, equipmentCount: 0, componentCount: 0, unassignedEquipment: 0 })
    const area = repository.saveArea('Finanzas')
    const person = repository.savePerson({ name: 'Mariana López', email: 'mariana@example.test', phone: '', areaId: area.id, status: 'Activo' })
    const device = repository.saveEquipment({
      assetTag: 'FIN-042', personId: person.id, deviceType: 'Laptop', laptopBrand: 'Lenovo',
      processor: 'Intel Core i5', memoryGb: 16, graphicsCard: 'Intel Iris Xe',
      diskCapacityGb: 512, diskType: 'SSD', status: 'Operativo', notes: '',
      operatingSystem: 'Windows 11', maintenanceDone: true, lastMaintenanceDate: '2026-11-20',
    })
    repository.saveComponent({ name: 'Memoria', category: 'RAM', brand: 'Kingston', model: '16 GB', serialNumber: 'SN-1', equipmentId: device.id })

    expect(repository.listPeople('mariana')[0]).toMatchObject({ name: 'Mariana López', areaName: 'Finanzas', assetTag: 'FIN-042' })
    expect(repository.listComponents('SN-1')[0]).toMatchObject({ name: 'Memoria', assetTag: 'FIN-042' })
    expect(repository.dashboard()).toMatchObject({ peopleCount: 1, equipmentCount: 1, componentCount: 1, unassignedEquipment: 0 })
    repository.close()

    repository = await SqliteInventoryRepository.open(path)
    expect(repository.listEquipment()[0]).toMatchObject({
      assetTag: 'FIN-042', personName: 'Mariana López', componentCount: 1,
      deviceType: 'Laptop', laptopBrand: 'Lenovo', graphicsCard: 'Intel Iris Xe', diskCapacityGb: 512, diskType: 'SSD',
      operatingSystem: 'Windows 11', maintenanceDone: true, lastMaintenanceDate: '2026-11-20',
    })
    repository.close()
  })

  it('rejects duplicate equipment identifiers and keeps one active device per person', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'inventory-test-'))
    temporaryFolders.push(folder)
    const repository = await SqliteInventoryRepository.open(join(folder, 'inventory.sqlite'))
    const person = repository.savePerson({ name: 'Carlos Herrera', email: '', phone: '', areaId: null, status: 'Activo' })
    const equipmentInput = {
      personId: person.id, deviceType: 'Escritorio' as const, laptopBrand: '', processor: '', memoryGb: null,
      graphicsCard: '', diskCapacityGb: null, diskType: null, status: 'Operativo' as const, notes: '',
      operatingSystem: null, maintenanceDone: false, lastMaintenanceDate: null,
    }
    const device = repository.saveEquipment({ ...equipmentInput, assetTag: 'SIS-011' })
    expect(() => repository.saveEquipment({ ...equipmentInput, assetTag: 'SIS-014', deviceType: 'Laptop', laptopBrand: '' })).toThrow('La marca de la laptop es obligatoria.')
    expect(() => repository.saveEquipment({ ...equipmentInput, assetTag: 'SIS-012' })).toThrow()
    expect(() => repository.saveEquipment({ ...equipmentInput, assetTag: device.assetTag, personId: null })).toThrow()
    expect(() => repository.saveEquipment({ ...equipmentInput, assetTag: 'SIS-013', diskCapacityGb: -1 })).toThrow('La capacidad del disco debe ser un número entero igual o mayor que cero.')
    repository.close()
  })
})
