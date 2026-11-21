import type { ComponentInput, EquipmentInput, PersonInput } from '../shared/types'

// Renderer seam: replace this adapter to target a future shared service without changing views.
export const inventoryApi = {
  dashboard: () => window.inventory.dashboard(),
  people: (search?: string) => window.inventory.people(search),
  savePerson: (input: PersonInput, id?: number) => window.inventory.savePerson(input, id),
  deletePerson: (id: number) => window.inventory.deletePerson(id),
  equipment: (search?: string) => window.inventory.equipment(search),
  saveEquipment: (input: EquipmentInput, id?: number) => window.inventory.saveEquipment(input, id),
  deleteEquipment: (id: number) => window.inventory.deleteEquipment(id),
  components: (search?: string) => window.inventory.components(search),
  saveComponent: (input: ComponentInput, id?: number) => window.inventory.saveComponent(input, id),
  deleteComponent: (id: number) => window.inventory.deleteComponent(id),
  areas: () => window.inventory.areas(),
  saveArea: (name: string, id?: number) => window.inventory.saveArea(name, id),
  deleteArea: (id: number) => window.inventory.deleteArea(id),
}
