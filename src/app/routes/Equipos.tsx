import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Button, Input, Spinner } from '@fluentui/react-components'
import { Add20Regular, Search20Regular, Edit20Regular, Delete20Regular } from '@fluentui/react-icons'
import { inventoryApi } from '../../api'
import type { Equipment, EquipmentInput, Person } from '../../shared/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, Feedback } from '../../components/Feedback'
import { Status } from './Panel'

const blank: EquipmentInput = {
  assetTag: '', personId: null, deviceType: 'Escritorio', laptopBrand: '', processor: '',
  memoryGb: null, graphicsCard: '', diskCapacityGb: null, diskType: null, status: 'Operativo', notes: '',
}

export function Equipos() {
  const [rows, setRows] = useState<Equipment[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [form, setForm] = useState<EquipmentInput>(blank)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setRows(await inventoryApi.equipment(query)); setError('') }
    catch (reason) { setError(messageOf(reason)) }
    finally { setLoading(false) }
  }, [query])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { inventoryApi.people().then(setPeople).catch((reason: unknown) => setError(messageOf(reason))) }, [])

  function start(equipment?: Equipment) {
    setEditing(equipment ?? null)
    setForm(equipment ? {
      assetTag: equipment.assetTag, personId: equipment.personId, deviceType: equipment.deviceType,
      laptopBrand: equipment.laptopBrand, processor: equipment.processor, memoryGb: equipment.memoryGb,
      graphicsCard: equipment.graphicsCard, diskCapacityGb: equipment.diskCapacityGb,
      diskType: equipment.diskType, status: equipment.status, notes: equipment.notes,
    } : blank)
    setError('')
    setOpen(true)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try { await inventoryApi.saveEquipment(form, editing?.id); setOpen(false); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
    finally { setSaving(false) }
  }
  async function remove(item: Equipment) {
    if (!window.confirm(`¿Eliminar el equipo ${item.assetTag}? Los componentes vinculados quedarán sin asignar.`)) return
    try { await inventoryApi.deleteEquipment(item.id); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
  }

  return <>
    <PageHeader title="Equipos" description="Administra computadoras, asignaciones y especificaciones.">
      <Button appearance="primary" icon={<Add20Regular />} onClick={() => start()}>Nuevo equipo</Button>
    </PageHeader>
    <Feedback error={error && !open ? error : ''} />
    <section className="card">
      <div className="card-heading"><div><h2>Listado de equipos</h2><p>{rows.length} {rows.length === 1 ? 'equipo registrado' : 'equipos registrados'}</p></div></div>
      <div className="toolbar">
        <Input className="toolbar-search" contentBefore={<Search20Regular />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder="Buscar por identificador, persona o CPU" aria-label="Buscar equipos" />
        <span className="count-label">Inventario local</span>
      </div>
      {loading ? <div className="loading"><Spinner label="Cargando equipos…" /></div> : rows.length === 0 ? (
        <EmptyState title={query ? 'Sin coincidencias' : 'Aún no hay equipos'} detail={query ? 'Prueba con otro identificador o persona.' : 'Registra una computadora para iniciar el inventario.'} />
      ) : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Equipo</th><th>Tipo</th><th>Persona asignada</th><th>Procesador</th><th>Memoria</th><th>Tarjeta gráfica</th><th>Almacenamiento</th><th>Componentes</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{rows.map((item) => <tr key={item.id}>
          <td><strong className="table-primary">{item.assetTag}</strong><span className="table-secondary">{item.areaName || 'Sin área'}</span></td>
          <td>{item.deviceType}{item.deviceType === 'Laptop' && item.laptopBrand ? <span className="table-secondary">{item.laptopBrand}</span> : null}</td>
          <td>{item.personName || <span className="muted">Sin asignar</span>}</td>
          <td>{item.processor || '—'}</td>
          <td>{item.memoryGb ? `${item.memoryGb} GB` : '—'}</td>
          <td>{item.graphicsCard || '—'}</td>
          <td>{item.diskCapacityGb !== null ? `${item.diskCapacityGb} GB${item.diskType ? ` ${item.diskType}` : ''}` : item.diskType || '—'}</td>
          <td>{item.componentCount}</td>
          <td><Status status={item.status} /></td>
          <td><div className="table-actions"><Button className="icon-button" size="small" appearance="subtle" icon={<Edit20Regular />} aria-label={`Editar ${item.assetTag}`} onClick={() => start(item)} /><Button className="icon-button" size="small" appearance="subtle" icon={<Delete20Regular />} aria-label={`Eliminar ${item.assetTag}`} onClick={() => void remove(item)} /></div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
    {open && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="equipment-title">
        <h2 id="equipment-title">{editing ? 'Editar equipo' : 'Registrar equipo'}</h2><p className="modal-subtitle">Asigna equipo y registra sus características principales.</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field">Identificador <input required autoFocus value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} placeholder="Ej. FIN-043" /></label>
            <label className="form-field">Persona asignada <select value={form.personId ?? ''} onChange={(e) => setForm({ ...form, personId: e.target.value ? Number(e.target.value) : null })}><option value="">Sin asignar</option>{people.filter((person) => person.status === 'Activo' && (person.equipmentId === null || person.equipmentId === editing?.id)).map((person) => <option key={person.id} value={person.id}>{person.name} — {person.areaName || 'Sin área'}</option>)}</select></label>
            <label className="form-field">Tipo de equipo <select value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value as EquipmentInput['deviceType'], laptopBrand: e.target.value === 'Laptop' ? form.laptopBrand : '' })}><option value="Escritorio">Computadora de escritorio</option><option value="Laptop">Laptop</option></select></label>
            {form.deviceType === 'Laptop' && <label className="form-field">Marca de laptop <input required value={form.laptopBrand} onChange={(e) => setForm({ ...form, laptopBrand: e.target.value })} placeholder="Ej. Dell, HP, Lenovo" /></label>}
            <label className="form-field">Procesador <input value={form.processor} onChange={(e) => setForm({ ...form, processor: e.target.value })} placeholder="Marca y modelo" /></label>
            <label className="form-field">Memoria RAM (GB) <input type="number" min="0" step="1" value={form.memoryGb ?? ''} onChange={(e) => setForm({ ...form, memoryGb: e.target.value ? Number(e.target.value) : null })} placeholder="Ej. 16" /></label>
            <label className="form-field">Tarjeta gráfica <input value={form.graphicsCard} onChange={(e) => setForm({ ...form, graphicsCard: e.target.value })} placeholder="Marca y modelo" /></label>
            <label className="form-field">Capacidad del disco (GB) <input type="number" min="0" step="1" value={form.diskCapacityGb ?? ''} onChange={(e) => setForm({ ...form, diskCapacityGb: e.target.value ? Number(e.target.value) : null })} placeholder="Ej. 512" /></label>
            <label className="form-field">Tipo de disco <select value={form.diskType ?? ''} onChange={(e) => setForm({ ...form, diskType: e.target.value ? e.target.value as NonNullable<EquipmentInput['diskType']> : null })}><option value="">Sin especificar</option><option value="SSD">SSD</option><option value="HDD">HDD</option></select></label>
            <label className="form-field">Estado <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EquipmentInput['status'] })}><option>Operativo</option><option>Mantenimiento</option><option>Baja</option></select></label>
            <label className="form-field span-2">Notas <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalles adicionales del equipo" /></label>
          </div>
          {error && <p className="modal-error" role="alert">{error}</p>}
          <div className="form-actions"><Button type="button" appearance="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" appearance="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar equipo'}</Button></div>
        </form>
      </section>
    </div>}
  </>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Ocurrió un error al consultar equipos.' }
