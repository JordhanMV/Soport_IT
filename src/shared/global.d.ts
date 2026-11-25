import type { ComponentInput, DashboardSummary, Equipment, EquipmentInput, InventoryComponent, PasswordEntry, PasswordInput, Person, PersonInput, Area, PendingNote, PendingNoteInput, UpdateStatus } from './types'

declare global {
  interface Window {
    inventory: {
      dashboard(): Promise<DashboardSummary>
      people(search?: string): Promise<Person[]>
      savePerson(input: PersonInput, id?: number): Promise<Person>
      deletePerson(id: number): Promise<void>
      equipment(search?: string): Promise<Equipment[]>
      saveEquipment(input: EquipmentInput, id?: number): Promise<Equipment>
      deleteEquipment(id: number): Promise<void>
      components(search?: string): Promise<InventoryComponent[]>
      saveComponent(input: ComponentInput, id?: number): Promise<InventoryComponent>
      deleteComponent(id: number): Promise<void>
      areas(): Promise<Area[]>
      saveArea(name: string, id?: number): Promise<Area>
      deleteArea(id: number): Promise<void>
      passwords(search?: string): Promise<PasswordEntry[]>
      savePassword(input: PasswordInput, id?: number): Promise<PasswordEntry>
      deletePassword(id: number): Promise<void>
      pendingNotes(search?: string): Promise<PendingNote[]>
      savePendingNote(input: PendingNoteInput, id?: number): Promise<PendingNote>
      deletePendingNote(id: number): Promise<void>
      updateStatus(): Promise<UpdateStatus>
      checkForUpdates(): Promise<void>
      downloadUpdate(): Promise<void>
      installUpdate(): Promise<void>
      onUpdateStatus(callback: (status: UpdateStatus) => void): () => void
    }
  }
}

export {}
