import { FormEvent, useEffect, useState } from 'react'
import { Button, Input, Spinner } from '@fluentui/react-components'
import { Add20Regular, Delete20Regular, Edit20Regular } from '@fluentui/react-icons'
import { inventoryApi } from '../../api'
import type { Area, Person } from '../../shared/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, Feedback } from '../../components/Feedback'

export function Areas() {
  const [areas, setAreas] = useState<Area[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Area | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    try { const [areaList, personList] = await Promise.all([inventoryApi.areas(), inventoryApi.people()]); setAreas(areaList); setPeople(personList); setError('') }
    catch (reason) { setError(messageOf(reason)) }
    finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [])

  function start(area?: Area) { setEditing(area ?? null); setName(area?.name ?? ''); setError(''); setDialogOpen(true) }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try { await inventoryApi.saveArea(name, editing?.id); setDialogOpen(false); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
    finally { setSaving(false) }
  }
  async function remove(area: Area) {
    if (!window.confirm(`¿Eliminar el área ${area.name}? Las personas asociadas quedarán sin área.`)) return
    try { await inventoryApi.deleteArea(area.id); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
  }

  return <>
    <PageHeader title="Áreas" description="Organiza el directorio por departamentos y unidades.">
      <Button appearance="primary" icon={<Add20Regular />} onClick={() => start()}>Nueva área</Button>
    </PageHeader>
    <Feedback error={error && !dialogOpen ? error : ''} />
    <section className="card">
      <div className="card-heading"><div><h2>Áreas registradas</h2><p>{areas.length} {areas.length === 1 ? 'área' : 'áreas'} en el inventario</p></div></div>
      {loading ? <div className="loading"><Spinner label="Cargando áreas…" /></div> : areas.length === 0 ? <EmptyState title="Aún no hay áreas" detail="Agrega áreas para organizar a las personas del inventario." /> :
        <div className="area-list">{areas.map((area) => {
          const peopleCount = people.filter((person) => person.areaId === area.id).length
          return <div className="area-row" key={area.id}>
            <div className="area-identity"><span className="area-avatar">{area.name.slice(0, 1).toLocaleUpperCase('es-MX')}</span><div><strong>{area.name}</strong><span>{peopleCount} {peopleCount === 1 ? 'persona asignada' : 'personas asignadas'}</span></div></div>
            <div className="table-actions"><Button className="icon-button" size="small" appearance="subtle" icon={<Edit20Regular />} aria-label={`Editar ${area.name}`} onClick={() => start(area)} /><Button className="icon-button" size="small" appearance="subtle" icon={<Delete20Regular />} aria-label={`Eliminar ${area.name}`} onClick={() => void remove(area)} /></div>
          </div>
        })}</div>}
    </section>
    {dialogOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false) }}>
      <section className="record-modal record-modal--small" role="dialog" aria-modal="true" aria-labelledby="area-title">
        <h2 id="area-title">{editing ? 'Editar área' : 'Nueva área'}</h2><p className="modal-subtitle">El nombre del área debe ser único.</p>
        <form onSubmit={submit}><label className="form-field">Nombre del área <Input autoFocus required value={name} onChange={(_, data) => setName(data.value)} placeholder="Ej. Finanzas" /></label>
          {error && <p className="modal-error" role="alert">{error}</p>}
          <div className="form-actions"><Button type="button" appearance="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" appearance="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar área'}</Button></div>
        </form>
      </section>
    </div>}
  </>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Ocurrió un error al consultar áreas.' }
