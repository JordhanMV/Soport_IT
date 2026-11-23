export type EquipmentStatus = 'Operativo' | 'Mantenimiento' | 'Baja'

export type UpdateStatus =
  | { state: 'idle' | 'checking' | 'not-available' }
  | { state: 'available' | 'downloaded'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'error'; message: string }

export interface Area {
  id: number
  name: string
  createdAt: string
}

export interface Person {
  id: number
  name: string
  email: string
  phone: string
  areaId: number | null
  areaName: string | null
  equipmentId: number | null
  assetTag: string | null
  status: 'Activo' | 'Inactivo'
  createdAt: string
}

export interface Equipment {
  id: number
  assetTag: string
  personId: number | null
  personName: string | null
  areaName: string | null
  deviceType: 'Laptop' | 'Escritorio'
  laptopBrand: string
  processor: string
  memoryGb: number | null
  graphicsCard: string
  diskCapacityGb: number | null
  diskType: 'SSD' | 'HDD' | null
  operatingSystem: 'Windows 10' | 'Windows 11' | null
  maintenanceDone: boolean
  lastMaintenanceDate: string | null
  status: EquipmentStatus
  notes: string
  componentCount: number
  createdAt: string
}

export interface InventoryComponent {
  id: number
  name: string
  category: string
  brand: string
  model: string
  serialNumber: string
  equipmentId: number | null
  assetTag: string | null
  createdAt: string
}

export interface PasswordEntry {
  id: number
  title: string
  username: string
  password: string
  url: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface DashboardSummary {
  peopleCount: number
  equipmentCount: number
  componentCount: number
  unassignedEquipment: number
  recentEquipment: Equipment[]
}

export type PersonInput = Pick<Person, 'name' | 'email' | 'phone' | 'areaId' | 'status'>
export type EquipmentInput = Pick<Equipment, 'assetTag' | 'personId' | 'deviceType' | 'laptopBrand' | 'processor' | 'memoryGb' | 'graphicsCard' | 'diskCapacityGb' | 'diskType' | 'operatingSystem' | 'maintenanceDone' | 'lastMaintenanceDate' | 'status' | 'notes'>
export type ComponentInput = Pick<InventoryComponent, 'name' | 'category' | 'brand' | 'model' | 'serialNumber' | 'equipmentId'>
export type PasswordInput = Pick<PasswordEntry, 'title' | 'username' | 'password' | 'url' | 'notes'>
