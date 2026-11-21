import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Button, Input, Spinner } from '@fluentui/react-components'
import { Add20Regular, Search20Regular, Edit20Regular, Delete20Regular } from '@fluentui/react-icons'
import { inventoryApi } from '../../api'
import type { ComponentInput, Equipment, InventoryComponent } from '../../shared/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, Feedback } from '../../components/Feedback'

const blank: ComponentInput = { name: '', category: '', brand: '', model: '', serialNumber: '', equipmentId: null }

export function Componentes() {
  const [rows, setRows] = useState<InventoryComponent[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryComponent | null>(null)
  const [form, setForm] = useState<ComponentInput>(blank)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setRows(await inventoryApi.components(query)); setError('') }
    catch (reason) { setError(messageOf(reason)) }
    finally { setLoading(false) }
  }, [query])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { inventoryApi.equipment().then(setEquipment).catch((reason: unknown) => setError(messageOf(reason))) }, [])

  function start(item?: InventoryComponent) {
    setEditing(item ?? null)
    setForm(item ? { name: item.name, category: item.category, brand: item.brand, model: item.model, serialNumber: item.serialNumber, equipmentId: item.equipmentId } : blank)
    setError('')
    setOpen(true)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try { await inventoryApi.saveComponent(form, editing?.id); setOpen(false); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
    finally { setSaving(false) }
  }
  async function remove(item: InventoryComponent) {
    if (!window.confirm(`¿Eliminar el componente ${item.name}?`)) return
    try { await inventoryApi.deleteComponent(item.id); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
  }

  return <>
    <PageHeader title="Componentes" description="Registra piezas y consulta a qué equipo pertenecen.">
      <Button appearance="primary" icon={<Add20Regular />} onClick={() => start()}>Nuevo componente</Button>
    </PageHeader>
    <Feedback error={error && !open ? error : ''} />
    <section className="card">
      <div className="card-heading"><div><h2>Inventario de componentes</h2><p>{rows.length} {rows.length === 1 ? 'componente registrado' : 'componentes registrados'}</p></div></div>
      <div className="toolbar"><Input className="toolbar-search" contentBefore={<Search20Regular />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder="Buscar por nombre, categoría, serie o equipo" aria-label="Buscar componentes" /><span className="count-label">Inventario local</span></div>
      {loading ? <div className="loading"><Spinner label="Cargando componentes…" /></div> : rows.length === 0 ? <EmptyState title={query ? 'Sin coincidencias' : 'Aún no hay componentes'} detail={query ? 'Prueba con otro término de búsqueda.' : 'Registra memoria, almacenamiento y otros componentes.'} /> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Componente</th><th>Categoría</th><th>Marca / modelo</th><th>Número de serie</th><th>Equipo asignado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{rows.map((item) => <tr key={item.id}>
            <td><strong>{item.name}</strong></td><td><span className="summary-chip">{item.category}</span></td><td>{[item.brand, item.model].filter(Boolean).join(' ') || '—'}</td><td>{item.serialNumber || '—'}</td><td>{item.assetTag || <span className="muted">Disponible</span>}</td>
            <td><div className="table-actions"><Button className="icon-button" size="small" appearance="subtle" icon={<Edit20Regular />} aria-label={`Editar ${item.name}`} onClick={() => start(item)} /><Button className="icon-button" size="small" appearance="subtle" icon={<Delete20Regular />} aria-label={`Eliminar ${item.name}`} onClick={() => void remove(item)} /></div></td>
          </tr>)}</tbody>
        </table></div>
      )}
    </section>
    {open && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="component-title">
        <h2 id="component-title">{editing ? 'Editar componente' : 'Registrar componente'}</h2><p className="modal-subtitle">Relaciona el componente con un equipo o déjalo disponible.</p>
        <form onSubmit={submit}><div className="form-grid">
          <label className="form-field">Nombre <input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Memoria RAM" /></label>
          <label className="form-field">Categoría <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Memoria, almacenamiento…" /></label>
          <label className="form-field">Marca <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
          <label className="form-field">Modelo <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></label>
          <label className="form-field">Número de serie <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></label>
          <label className="form-field">Equipo asignado <select value={form.equipmentId ?? ''} onChange={(e) => setForm({ ...form, equipmentId: e.target.value ? Number(e.target.value) : null })}><option value="">Disponible / sin asignar</option>{equipment.map((item) => <option key={item.id} value={item.id}>{item.assetTag}</option>)}</select></label>
        </div>
        {error && <p className="modal-error" role="alert">{error}</p>}
        <div className="form-actions"><Button type="button" appearance="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" appearance="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar componente'}</Button></div></form>
      </section>
    </div>}
  </>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Ocurrió un error al consultar componentes.' }
