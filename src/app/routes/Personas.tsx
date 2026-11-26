import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Button, Input, Spinner } from '@fluentui/react-components'
import { Add20Regular, Search20Regular, Edit20Regular, Delete20Regular, ArrowDownload20Regular } from '@fluentui/react-icons'
import { inventoryApi } from '../../api'
import type { Area, Person, PersonInput } from '../../shared/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, Feedback } from '../../components/Feedback'
import { Status } from './Panel'

const blank: PersonInput = { name: '', email: '', phone: '', areaId: null, status: 'Activo' }

export function Personas() {
  const [people, setPeople] = useState<Person[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [form, setForm] = useState<PersonInput>(blank)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setPeople(await inventoryApi.people(query)); setError('') }
    catch (reason) { setError(messageOf(reason)) }
    finally { setLoading(false) }
  }, [query])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { inventoryApi.areas().then(setAreas).catch((reason: unknown) => setError(messageOf(reason))) }, [])

  function start(person?: Person) {
    setEditing(person ?? null)
    setForm(person ? { name: person.name, email: person.email, phone: person.phone, areaId: person.areaId, status: person.status } : blank)
    setError('')
    setOpen(true)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try { await inventoryApi.savePerson(form, editing?.id); setOpen(false); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
    finally { setSaving(false) }
  }
  async function remove(person: Person) {
    if (!window.confirm(`¿Eliminar a ${person.name}? El equipo asignado quedará sin asignar.`)) return
    try { await inventoryApi.deletePerson(person.id); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
  }
  async function exportPdf() {
    setExporting(true)
    try {
      const result = await inventoryApi.exportInventoryPdf()
      if (result.saved) setError('')
    } catch (reason) { setError(messageOf(reason)) }
    finally { setExporting(false) }
  }

  return <>
    <PageHeader title="Personas" description="Consulta personas, áreas y equipos asignados.">
      <Button appearance="secondary" icon={<ArrowDownload20Regular />} disabled={exporting} onClick={() => void exportPdf()}>{exporting ? 'Generando PDF…' : 'Descargar PDF'}</Button>
      <Button appearance="primary" icon={<Add20Regular />} onClick={() => start()}>Registrar persona</Button>
    </PageHeader>
    <Feedback error={error && !open ? error : ''} />
    <section className="card">
      <div className="card-heading"><div><h2>Directorio de personas</h2><p>{people.length} {people.length === 1 ? 'persona encontrada' : 'personas encontradas'}</p></div></div>
      <div className="toolbar">
        <Input className="toolbar-search" contentBefore={<Search20Regular />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder="Buscar por nombre, área o equipo" aria-label="Buscar personas" />
        <span className="count-label">Búsqueda en datos locales</span>
      </div>
      {loading ? <div className="loading"><Spinner label="Cargando personas…" /></div> : people.length === 0 ? (
        <EmptyState title={query ? 'Sin coincidencias' : 'Aún no hay personas'} detail={query ? 'Prueba con otro nombre, área o identificador.' : 'Registra una persona para comenzar el directorio.'} />
      ) : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Persona</th><th>Área</th><th>Equipo asignado</th><th>Contacto</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{people.map((person) => <tr key={person.id}>
          <td><strong>{person.name}</strong><span className="table-secondary">{person.email || 'Sin correo registrado'}</span></td>
          <td>{person.areaName || '—'}</td>
          <td>{person.assetTag ? <strong className="table-primary">{person.assetTag}</strong> : <span className="muted">Sin equipo</span>}</td>
          <td>{person.phone || '—'}</td>
          <td><Status status={person.status} /></td>
          <td><div className="table-actions"><Button className="icon-button" size="small" appearance="subtle" icon={<Edit20Regular />} aria-label={`Editar ${person.name}`} onClick={() => start(person)} /><Button className="icon-button" size="small" appearance="subtle" icon={<Delete20Regular />} aria-label={`Eliminar ${person.name}`} onClick={() => void remove(person)} /></div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
    {open && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="person-title">
        <h2 id="person-title">{editing ? 'Editar persona' : 'Registrar persona'}</h2><p className="modal-subtitle">Los datos se guardan en la base local de este equipo.</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field span-2">Nombre completo <input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Mariana López" /></label>
            <label className="form-field">Área <select value={form.areaId ?? ''} onChange={(e) => setForm({ ...form, areaId: e.target.value ? Number(e.target.value) : null })}><option value="">Sin área</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
            <label className="form-field">Estado <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PersonInput['status'] })}><option>Activo</option><option>Inactivo</option></select></label>
            <label className="form-field">Correo electrónico <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nombre@empresa.com" /></label>
            <label className="form-field">Teléfono <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono de contacto" /></label>
          </div>
          {open && error && <p className="modal-error" role="alert">{error}</p>}
          <div className="form-actions"><Button type="button" appearance="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" appearance="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar persona'}</Button></div>
        </form>
      </section>
    </div>}
  </>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Ocurrió un error al consultar personas.' }
