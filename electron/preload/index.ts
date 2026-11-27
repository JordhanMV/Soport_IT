import { contextBridge, ipcRenderer } from 'electron'
import type { ComponentInput, DashboardSummary, Equipment, EquipmentInput, InventoryComponent, PasswordEntry, PasswordInput, Person, PersonInput, Area, PendingNote, PendingNoteInput, UpdateStatus, SyncStatus } from '../../src/shared/types'

const inventoryApi = {
  dashboard: () => ipcRenderer.invoke('dashboard:summary') as Promise<DashboardSummary>,
  people: (search = '') => ipcRenderer.invoke('people:list', search) as Promise<Person[]>,
  savePerson: (input: PersonInput, id?: number) => ipcRenderer.invoke('people:save', input, id) as Promise<Person>,
  deletePerson: (id: number) => ipcRenderer.invoke('people:delete', id) as Promise<void>,
  equipment: (search = '') => ipcRenderer.invoke('equipment:list', search) as Promise<Equipment[]>,
  saveEquipment: (input: EquipmentInput, id?: number) => ipcRenderer.invoke('equipment:save', input, id) as Promise<Equipment>,
  deleteEquipment: (id: number) => ipcRenderer.invoke('equipment:delete', id) as Promise<void>,
  components: (search = '') => ipcRenderer.invoke('components:list', search) as Promise<InventoryComponent[]>,
  saveComponent: (input: ComponentInput, id?: number) => ipcRenderer.invoke('components:save', input, id) as Promise<InventoryComponent>,
  deleteComponent: (id: number) => ipcRenderer.invoke('components:delete', id) as Promise<void>,
  areas: () => ipcRenderer.invoke('areas:list') as Promise<Area[]>,
  saveArea: (name: string, id?: number) => ipcRenderer.invoke('areas:save', name, id) as Promise<Area>,
  deleteArea: (id: number) => ipcRenderer.invoke('areas:delete', id) as Promise<void>,
  passwords: (search = '') => ipcRenderer.invoke('passwords:list', search) as Promise<PasswordEntry[]>,
  savePassword: (input: PasswordInput, id?: number) => ipcRenderer.invoke('passwords:save', input, id) as Promise<PasswordEntry>,
  deletePassword: (id: number) => ipcRenderer.invoke('passwords:delete', id) as Promise<void>,
  pendingNotes: (search = '') => ipcRenderer.invoke('pendingNotes:list', search) as Promise<PendingNote[]>,
  savePendingNote: (input: PendingNoteInput, id?: number) => ipcRenderer.invoke('pendingNotes:save', input, id) as Promise<PendingNote>,
  deletePendingNote: (id: number) => ipcRenderer.invoke('pendingNotes:delete', id) as Promise<void>,
  exportInventoryPdf: () => ipcRenderer.invoke('inventory:export-pdf') as Promise<{ saved: boolean }>,
  updateStatus: () => ipcRenderer.invoke('updates:status') as Promise<UpdateStatus>,
  checkForUpdates: () => ipcRenderer.invoke('updates:check') as Promise<void>,
  downloadUpdate: () => ipcRenderer.invoke('updates:download') as Promise<void>,
  installUpdate: () => ipcRenderer.invoke('updates:install') as Promise<void>,
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => callback(status)
    ipcRenderer.on('updates:status', listener)
    return () => ipcRenderer.removeListener('updates:status', listener)
  },
  supabaseStatus: () => ipcRenderer.invoke('supabase:status') as Promise<SyncStatus>,
  supabaseSignIn: (email: string, password: string) => ipcRenderer.invoke('supabase:sign-in', email, password) as Promise<SyncStatus>,
  supabaseSignUp: (email: string, password: string) => ipcRenderer.invoke('supabase:sign-up', email, password) as Promise<SyncStatus>,
  supabaseSignOut: () => ipcRenderer.invoke('supabase:sign-out') as Promise<SyncStatus>,
  supabaseSync: () => ipcRenderer.invoke('supabase:sync') as Promise<SyncStatus>,
}

contextBridge.exposeInMainWorld('inventory', inventoryApi)
