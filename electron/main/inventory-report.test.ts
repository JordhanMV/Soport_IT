import { describe, expect, it } from 'vitest'
import type { Equipment, Person } from '../../src/shared/types'
import { generateInventoryReportHtml } from './inventory-report'

describe('inventory PDF report HTML', () => {
  it('includes equipment and people data but excludes equipment notes', () => {
    const equipment: Equipment = {
      id: 1, assetTag: 'OPS-001', personId: 1, personName: 'Lucía Torres', areaName: 'Operaciones',
      deviceType: 'Laptop', laptopBrand: 'Dell', processor: 'Intel Core i5', memoryGb: 16,
      graphicsCard: 'Intel UHD', diskCapacityGb: 512, diskType: 'SSD', operatingSystem: 'Windows 11',
      maintenanceDone: true, lastMaintenanceDate: '2026-11-20', status: 'Operativo',
      notes: 'NO INCLUIR ESTA NOTA', componentCount: 2, createdAt: '2026-11-20',
    }
    const person: Person = {
      id: 1, name: 'Lucía Torres', email: 'lucia@example.test', phone: '5550101',
      areaId: 1, areaName: 'Operaciones', equipmentId: 1, assetTag: 'OPS-001',
      status: 'Activo', createdAt: '2026-11-20',
    }

    const html = generateInventoryReportHtml([person], [equipment])

    expect(html).toContain('OPS-001')
    expect(html).toContain('Lucía Torres')
    expect(html).toContain('Intel Core i5')
    expect(html).not.toContain('NO INCLUIR ESTA NOTA')
    expect(html).not.toContain('Notas y pendientes')
  })

  it('escapes user-provided HTML instead of interpreting it as markup', () => {
    const person: Person = {
      id: 1, name: '<img src=x onerror=alert(1)>', email: '', phone: '',
      areaId: null, areaName: null, equipmentId: null, assetTag: null,
      status: 'Activo', createdAt: '2026-11-20',
    }

    const html = generateInventoryReportHtml([person], [])

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x')
  })
})
