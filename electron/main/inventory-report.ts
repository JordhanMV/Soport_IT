import type { Equipment, Person } from '../../src/shared/types'

type EquipmentReportRecord = Pick<Equipment,
  'assetTag' | 'personName' | 'areaName' | 'deviceType' | 'laptopBrand' | 'processor' |
  'memoryGb' | 'graphicsCard' | 'diskCapacityGb' | 'diskType' | 'operatingSystem' |
  'maintenanceDone' | 'lastMaintenanceDate' | 'status' | 'componentCount'
>

type PersonReportRecord = Pick<Person,
  'name' | 'email' | 'phone' | 'areaName' | 'assetTag' | 'status'
>

export function generateInventoryReportHtml(people: PersonReportRecord[], equipment: EquipmentReportRecord[]): string {
  const equipmentCards = equipment.length
    ? equipment.map((item) => `
      <article class="equipment-card">
        <h3>${escapeHtml(item.assetTag)} <span>${escapeHtml(item.status)}</span></h3>
        <dl>
          ${detail('Área', item.areaName)}
          ${detail('Tipo', item.deviceType === 'Laptop' && item.laptopBrand ? `Laptop — ${item.laptopBrand}` : item.deviceType)}
          ${detail('Persona asignada', item.personName)}
          ${detail('Procesador', item.processor)}
          ${detail('Memoria RAM', item.memoryGb === null ? null : `${item.memoryGb} GB`)}
          ${detail('Gráficos', item.graphicsCard)}
          ${detail('Almacenamiento', item.diskCapacityGb === null ? item.diskType : `${item.diskCapacityGb} GB${item.diskType ? ` ${item.diskType}` : ''}`)}
          ${detail('Sistema operativo', item.operatingSystem)}
          ${detail('Mantenimiento', item.maintenanceDone
            ? `Realizado${item.lastMaintenanceDate ? ` — ${formatDate(item.lastMaintenanceDate)}` : ''}`
            : 'Pendiente')}
          ${detail('Componentes registrados', String(item.componentCount))}
        </dl>
      </article>
    `).join('')
    : '<p class="empty">No hay equipos registrados.</p>'

  const personRows = people.length
    ? people.map((person) => `
      <tr>
        <td>${escapeHtml(person.name)}</td>
        <td>${escapeHtml(person.areaName)}</td>
        <td>${escapeHtml(person.assetTag)}</td>
        <td>${escapeHtml(person.email)}</td>
        <td>${escapeHtml(person.phone)}</td>
        <td>${escapeHtml(person.status)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="6" class="empty">No hay personas registradas.</td></tr>'

  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Inventario de equipos y personas</title>
        <style>
          @page { size: A4; margin: 16mm 13mm; }
          * { box-sizing: border-box; }
          body { color: #182230; font: 10px "Segoe UI", Arial, sans-serif; }
          h1 { margin: 0 0 5px; font-size: 21px; }
          h2 { margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #cfd5dd; font-size: 15px; }
          .subtitle { margin: 0; color: #667085; }
          .equipment-card { margin: 0 0 10px; padding: 10px; border: 1px solid #d0d5dd; border-radius: 5px; break-inside: avoid; }
          .equipment-card h3 { margin: 0 0 8px; font-size: 12px; }
          .equipment-card h3 span { float: right; color: #475467; font-size: 10px; font-weight: normal; }
          dl { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 16px; margin: 0; }
          dl div { min-width: 0; }
          dt { color: #667085; font-size: 8px; text-transform: uppercase; }
          dd { margin: 2px 0 0; overflow-wrap: anywhere; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; }
          thead { display: table-header-group; }
          th { background: #eef2f6; color: #344054; text-align: left; }
          th, td { padding: 6px 5px; border: 1px solid #d0d5dd; vertical-align: top; overflow-wrap: anywhere; }
          .empty { color: #667085; }
        </style>
      </head>
      <body>
        <h1>Inventario de equipos y personas</h1>
        <p class="subtitle">Generado: ${escapeHtml(new Date().toLocaleString('es-MX'))} · ${equipment.length} equipos · ${people.length} personas</p>
        <h2>Equipos</h2>
        ${equipmentCards}
        <h2>Personas</h2>
        <table>
          <thead><tr><th>Nombre</th><th>Área</th><th>Equipo</th><th>Correo</th><th>Teléfono</th><th>Estado</th></tr></thead>
          <tbody>${personRows}</tbody>
        </table>
      </body>
    </html>`
}

function detail(label: string, value: string | number | null): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value === null || value === '' ? '—' : String(value))}</dd></div>`
}

function escapeHtml(value: string | number | null): string {
  return String(value ?? '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-MX')
}
