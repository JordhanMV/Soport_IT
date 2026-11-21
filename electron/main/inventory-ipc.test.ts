import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { SqliteInventoryRepository } from '../../database/repository/sqlite-inventory-repository'
import { registerInventoryHandlers } from './inventory-ipc'

type Handler = (...args: any[]) => unknown
const temporaryFolders: string[] = []

afterEach(() => {
  for (const folder of temporaryFolders.splice(0)) rmSync(folder, { recursive: true, force: true })
})

describe('Inventory IPC handlers against the local SQLite repository', () => {
  it('registers and exercises every channel with persisted CRUD, search, validation, and foreign-key behavior', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'inventory-ipc-test-'))
    temporaryFolders.push(folder)
    const databasePath = join(folder, 'inventory.sqlite')
    const repository = await SqliteInventoryRepository.open(databasePath)
    const handlers = new Map<string, Handler>()
    registerInventoryHandlers({
      handle: (channel, listener) => { handlers.set(channel, listener) },
    }, repository)
    const invoke = async (channel: string, ...args: unknown[]) => {
      const handler = handlers.get(channel)
      if (!handler) throw new Error(`IPC no registrado: ${channel}`)
      return handler({}, ...args)
    }

    expect([...handlers.keys()].sort()).toEqual([
      'areas:delete', 'areas:list', 'areas:save',
      'components:delete', 'components:list', 'components:save',
      'dashboard:summary',
      'equipment:delete', 'equipment:list', 'equipment:save',
      'people:delete', 'people:list', 'people:save',
    ])
    expect(await invoke('dashboard:summary')).toMatchObject({
      peopleCount: 0, equipmentCount: 0, componentCount: 0, unassignedEquipment: 0,
    })

    const area = await invoke('areas:save', 'Operaciones') as { id: number; name: string }
    await invoke('areas:save', 'Operaciones y soporte', area.id)
    expect(await invoke('areas:list')).toMatchObject([{ id: area.id, name: 'Operaciones y soporte' }])

    const person = await invoke('people:save', {
      name: 'Lucía Torres', email: 'lucia@example.test', phone: '5550101', areaId: area.id, status: 'Activo',
    }) as { id: number }
    await invoke('people:save', {
      name: 'Lucía Torres', email: 'lucia@example.test', phone: '5550102', areaId: area.id, status: 'Activo',
    }, person.id)
    expect(await invoke('people:list', 'Lucía')).toMatchObject([{ id: person.id, phone: '5550102', areaName: 'Operaciones y soporte' }])
    await expect(invoke('people:save', { name: '  ', email: '', phone: '', areaId: null, status: 'Activo' })).rejects.toThrow()

    const equipment = await invoke('equipment:save', {
      assetTag: 'OPS-001', personId: person.id, deviceType: 'Escritorio', laptopBrand: '',
      processor: 'CPU inicial', memoryGb: 8, graphicsCard: '', diskCapacityGb: null, diskType: null,
      status: 'Operativo', notes: '',
    }) as { id: number }
    await invoke('equipment:save', {
      assetTag: 'OPS-001', personId: person.id, deviceType: 'Escritorio', laptopBrand: '',
      processor: 'CPU actualizado', memoryGb: 16, graphicsCard: '', diskCapacityGb: null, diskType: null,
      status: 'Operativo', notes: '',
    }, equipment.id)
    expect(await invoke('equipment:list', 'CPU actualizado')).toMatchObject([
      { id: equipment.id, personName: 'Lucía Torres', memoryGb: 16 },
    ])

    const component = await invoke('components:save', {
      name: 'Memoria', category: 'RAM', brand: 'Marca', model: '16 GB', serialNumber: 'SERIE-A', equipmentId: equipment.id,
    }) as { id: number }
    await invoke('components:save', {
      name: 'Memoria', category: 'RAM', brand: 'Marca nueva', model: '32 GB', serialNumber: 'SERIE-B', equipmentId: equipment.id,
    }, component.id)
    expect(await invoke('components:list', 'SERIE-B')).toMatchObject([
      { id: component.id, brand: 'Marca nueva', assetTag: 'OPS-001' },
    ])
    expect(await invoke('dashboard:summary')).toMatchObject({
      peopleCount: 1, equipmentCount: 1, componentCount: 1, unassignedEquipment: 0,
    })

    await invoke('areas:delete', area.id)
    expect(await invoke('people:list')).toMatchObject([{ id: person.id, areaId: null, areaName: null }])
    await invoke('people:delete', person.id)
    expect(await invoke('equipment:list')).toMatchObject([{ id: equipment.id, personId: null, personName: null }])
    await invoke('equipment:delete', equipment.id)
    expect(await invoke('components:list')).toMatchObject([{ id: component.id, equipmentId: null, assetTag: null }])
    await invoke('components:delete', component.id)
    expect(await invoke('areas:list')).toEqual([])
    expect(await invoke('people:list')).toEqual([])
    expect(await invoke('equipment:list')).toEqual([])
    expect(await invoke('components:list')).toEqual([])
    expect(await invoke('dashboard:summary')).toMatchObject({
      peopleCount: 0, equipmentCount: 0, componentCount: 0, unassignedEquipment: 0,
    })

    repository.close()
    const reopened = await SqliteInventoryRepository.open(databasePath)
    expect(reopened.dashboard()).toMatchObject({
      peopleCount: 0, equipmentCount: 0, componentCount: 0, unassignedEquipment: 0,
    })
    reopened.close()
  })
})
