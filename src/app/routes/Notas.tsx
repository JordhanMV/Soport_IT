import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Button, Input, Spinner } from '@fluentui/react-components'
import { Add20Regular, Delete20Regular, Edit20Regular, Search20Regular } from '@fluentui/react-icons'
import { inventoryApi } from '../../api'
import type { PendingNote, PendingNoteInput } from '../../shared/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, Feedback } from '../../components/Feedback'

const blank: PendingNoteInput = { title: '', content: '', completed: false }

export function Notas() {
  const [notes, setNotes] = useState<PendingNote[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PendingNote | null>(null)
  const [form, setForm] = useState<PendingNoteInput>(blank)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setNotes(await inventoryApi.pendingNotes(query)); setError('') }
    catch (reason) { setError(messageOf(reason)) }
    finally { setLoading(false) }
  }, [query])

  useEffect(() => { void refresh() }, [refresh])

  function start(note?: PendingNote) {
    setEditing(note ?? null)
    setForm(note ? { title: note.title, content: note.content, completed: note.completed } : blank)
    setError('')
    setOpen(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try { await inventoryApi.savePendingNote(form, editing?.id); setOpen(false); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
    finally { setSaving(false) }
  }

  async function toggleCompleted(note: PendingNote) {
    try { await inventoryApi.savePendingNote({ title: note.title, content: note.content, completed: !note.completed }, note.id); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
  }

  async function remove(note: PendingNote) {
    if (!window.confirm(`¿Eliminar la nota "${note.title}"?`)) return
    try { await inventoryApi.deletePendingNote(note.id); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
  }

  const pendingCount = notes.filter((note) => !note.completed).length

  return <>
    <PageHeader title="Notas y pendientes" description="Registra tareas, recordatorios y actividades pendientes.">
      <Button appearance="primary" icon={<Add20Regular />} onClick={() => start()}>Nueva nota</Button>
    </PageHeader>
    <Feedback error={error && !open ? error : ''} />
    <section className="card">
      <div className="card-heading"><div><h2>Pendientes</h2><p>{pendingCount} {pendingCount === 1 ? 'nota pendiente' : 'notas pendientes'}</p></div></div>
      <div className="toolbar">
        <Input className="toolbar-search" contentBefore={<Search20Regular />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder="Buscar notas o pendientes" aria-label="Buscar notas" />
        <span className="count-label">{notes.length} registros</span>
      </div>
      {loading ? <div className="loading"><Spinner label="Cargando notas…" /></div> : notes.length === 0 ? (
        <EmptyState title={query ? 'Sin coincidencias' : 'No hay notas'} detail={query ? 'Prueba con otra palabra.' : 'Agrega tu primer pendiente.'} />
      ) : <div className="notes-list">{notes.map((note) => (
        <article className={`note-row${note.completed ? ' completed' : ''}`} key={note.id}>
          <button type="button" className={`note-check${note.completed ? ' checked' : ''}`} aria-label={note.completed ? `Marcar ${note.title} como pendiente` : `Marcar ${note.title} como completada`} onClick={() => void toggleCompleted(note)}>
            {note.completed ? '✓' : ''}
          </button>
          <div className="note-body">
            <strong>{note.title}</strong>
            {note.content && <p>{note.content}</p>}
            <span>{note.completed ? 'Completada' : 'Pendiente'} · Actualizada {formatDate(note.updatedAt)}</span>
          </div>
          <div className="table-actions">
            <Button className="icon-button" size="small" appearance="subtle" icon={<Edit20Regular />} aria-label={`Editar ${note.title}`} onClick={() => start(note)} />
            <Button className="icon-button" size="small" appearance="subtle" icon={<Delete20Regular />} aria-label={`Eliminar ${note.title}`} onClick={() => void remove(note)} />
          </div>
        </article>
      ))}</div>}
    </section>
    {open && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="record-modal record-modal--small" role="dialog" aria-modal="true" aria-labelledby="note-title">
        <h2 id="note-title">{editing ? 'Editar nota' : 'Nueva nota'}</h2>
        <p className="modal-subtitle">Describe una tarea pendiente o una nota importante.</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field span-2">Título <input required autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Revisar impresora del área" /></label>
            <label className="form-field span-2">Descripción <textarea rows={5} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Detalles de lo que hay que hacer" /></label>
            <label className="form-field span-2">Estado <select value={form.completed ? 'completada' : 'pendiente'} onChange={(event) => setForm({ ...form, completed: event.target.value === 'completada' })}><option value="pendiente">Pendiente</option><option value="completada">Completada</option></select></label>
          </div>
          {error && <p className="modal-error" role="alert">{error}</p>}
          <div className="form-actions"><Button type="button" appearance="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" appearance="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar nota'}</Button></div>
        </form>
      </section>
    </div>}
  </>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Ocurrió un error al consultar las notas.' }

function formatDate(value: string): string {
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-MX')
}
