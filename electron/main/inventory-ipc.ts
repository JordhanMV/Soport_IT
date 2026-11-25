import type { SqliteInventoryRepository } from '../../database/repository/sqlite-inventory-repository'

interface IpcHandlerRegistrar {
  handle(channel: string, listener: (...args: any[]) => unknown): void
}

export interface PasswordStorageCrypto {
  isEncryptionAvailable(): boolean
  encryptString(value: string): Buffer
  decryptString(value: Buffer): string
}

export function registerInventoryHandlers(ipc: IpcHandlerRegistrar, repository: SqliteInventoryRepository, crypto?: PasswordStorageCrypto): void {
  const encrypt = (value: string): string => {
    if (!crypto) return Buffer.from(value, 'utf8').toString('base64')
    if (!crypto.isEncryptionAvailable()) throw new Error('El cifrado seguro no está disponible en este equipo.')
    return crypto.encryptString(value).toString('base64')
  }
  const decrypt = (value: string): string => {
    if (!crypto) return Buffer.from(value, 'base64').toString('utf8')
    if (!crypto.isEncryptionAvailable()) throw new Error('El cifrado seguro no está disponible en este equipo.')
    return crypto.decryptString(Buffer.from(value, 'base64'))
  }
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
  ipc.handle('passwords:list', (_event, search: string) => repository.listPasswords(search, decrypt))
  ipc.handle('passwords:save', (_event, input, id?: number) => repository.savePassword(input, id, encrypt))
  ipc.handle('passwords:delete', (_event, id: number) => repository.deletePassword(id))
  ipc.handle('pendingNotes:list', (_event, search: string) => repository.listPendingNotes(search))
  ipc.handle('pendingNotes:save', (_event, input, id?: number) => repository.savePendingNote(input, id))
  ipc.handle('pendingNotes:delete', (_event, id: number) => repository.deletePendingNote(id))
}
