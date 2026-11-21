import { beforeEach, describe, expect, it, vi } from 'vitest'
import { inventoryApi } from './index'

const ipc = {
  dashboard: vi.fn(),
  people: vi.fn(),
  savePerson: vi.fn(),
  deletePerson: vi.fn(),
  equipment: vi.fn(),
  saveEquipment: vi.fn(),
  deleteEquipment: vi.fn(),
  components: vi.fn(),
  saveComponent: vi.fn(),
  deleteComponent: vi.fn(),
  areas: vi.fn(),
  saveArea: vi.fn(),
  deleteArea: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { inventory: ipc } })
})

describe('inventory API seam', () => {
  it('sends person search and mutations through the isolated IPC bridge', async () => {
    ipc.people.mockResolvedValue([])
    ipc.savePerson.mockResolvedValue({ id: 8 })
    await expect(inventoryApi.people('Mariana')).resolves.toEqual([])
    await inventoryApi.savePerson({ name: 'Mariana', email: '', phone: '', areaId: null, status: 'Activo' }, 8)
    expect(ipc.people).toHaveBeenCalledWith('Mariana')
    expect(ipc.savePerson).toHaveBeenCalledWith({ name: 'Mariana', email: '', phone: '', areaId: null, status: 'Activo' }, 8)
  })

  it('uses the same replaceable seam for equipment and component records', async () => {
    ipc.equipment.mockResolvedValue([])
    ipc.components.mockResolvedValue([])
    await inventoryApi.equipment('FIN-042')
    await inventoryApi.components('serial-1')
    expect(ipc.equipment).toHaveBeenCalledWith('FIN-042')
    expect(ipc.components).toHaveBeenCalledWith('serial-1')
  })
})
