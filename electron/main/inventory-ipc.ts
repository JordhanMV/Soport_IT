import type { SqliteInventoryRepository } from '../../database/repository/sqlite-inventory-repository'

interface IpcHandlerRegistrar {
  handle(channel: string, listener: (...args: any[]) => unknown): void
}

export function registerInventoryHandlers(ipc: IpcHandlerRegistrar, repository: SqliteInventoryRepository): void {
  ipc.handle('dashboard:summary', () => repository.dashboard())
  ipc.handle('people:list', (_event, search: string) => repository.listPeople(search))
  ipc.handle('people:save', (_event, input, id?: number) => repository.savePerson(input, id))
  ipc.handle('people:delete', (_event, id: number) => repository.deletePerson(id))
  ipc.handle('equipment:list', (_event, search: string) => repository.listEquipment(search))
  ipc.handle('equipment:save', (_event, input, id?: number) => repository.saveEquipment(input, id))
  ipc.handle('equipment:delete', (_event, id: number) => repository.deleteEquipment(id))
  ipc.handle('components:list', (_event, search: string) => repository.listComponents(search))
  ipc.handle('components:save', (_event, input, id?: number) => repository.saveComponent(input, id))
  ipc.handle('components:delete', (_event, id: number) => repository.deleteComponent(id))
  ipc.handle('areas:list', () => repository.listAreas())
  ipc.handle('areas:save', (_event, name: string, id?: number) => repository.saveArea(name, id))
  ipc.handle('areas:delete', (_event, id: number) => repository.deleteArea(id))
}
