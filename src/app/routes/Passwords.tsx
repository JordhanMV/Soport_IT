import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Button, Input, Spinner } from '@fluentui/react-components'
import { Add20Regular, Delete20Regular, Edit20Regular, Search20Regular } from '@fluentui/react-icons'
import { inventoryApi } from '../../api'
import type { PasswordEntry, PasswordInput } from '../../shared/types'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, Feedback } from '../../components/Feedback'

const blank: PasswordInput = { title: '', username: '', password: '', url: '', notes: '' }

export function Passwords() {
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PasswordEntry | null>(null)
  const [form, setForm] = useState<PasswordInput>(blank)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setEntries(await inventoryApi.passwords(query)); setError('') }
    catch (reason) { setError(messageOf(reason)) }
    finally { setLoading(false) }
  }, [query])

  useEffect(() => { void refresh() }, [refresh])

  function start(entry?: PasswordEntry) {
    setEditing(entry ?? null)
    setForm(entry ? { title: entry.title, username: entry.username, password: entry.password, url: entry.url, notes: entry.notes } : blank)
    setError('')
    setOpen(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await inventoryApi.savePassword(form, editing?.id)
      setOpen(false)
      await refresh()
    } catch (reason) { setError(messageOf(reason)) }
    finally { setSaving(false) }
  }

  async function remove(entry: PasswordEntry) {
    if (!window.confirm(`¿Eliminar la contraseña de ${entry.title}?`)) return
    try { await inventoryApi.deletePassword(entry.id); await refresh() }
    catch (reason) { setError(messageOf(reason)) }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setError('') }
    catch { setError('No se pudo copiar al portapapeles.') }
  }

  function generatePassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?-_=+'
    const bytes = new Uint32Array(20)
    crypto.getRandomValues(bytes)
    setForm({ ...form, password: Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('') })
  }

  function toggleReveal(id: number) {
    setRevealed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return <>
    <PageHeader title="Gestor de contraseñas" description="Guarda credenciales locales con cifrado del sistema.">
      <Button appearance="primary" icon={<Add20Regular />} onClick={() => start()}>Nueva contraseña</Button>
    </PageHeader>
    <Feedback error={error && !open ? error : ''} />
    <section className="card">
      <div className="card-heading"><div><h2>Credenciales protegidas</h2><p>{entries.length} {entries.length === 1 ? 'registro encontrado' : 'registros encontrados'}</p></div></div>
      <div className="toolbar">
        <Input className="toolbar-search" contentBefore={<Search20Regular />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder="Buscar servicio, usuario o sitio" aria-label="Buscar contraseñas" />
        <span className="count-label">Cifrado local seguro</span>
      </div>
      {loading ? <div className="loading"><Spinner label="Cargando contraseñas…" /></div> : entries.length === 0 ? (
        <EmptyState title={query ? 'Sin coincidencias' : 'Aún no hay contraseñas'} detail={query ? 'Prueba con otro servicio o usuario.' : 'Agrega la primera credencial protegida.'} />
      ) : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Servicio</th><th>Usuario</th><th>Contraseña</th><th>Sitio</th><th>Acciones</th></tr></thead>
        <tbody>{entries.map((entry) => <tr key={entry.id}>
          <td><strong>{entry.title}</strong><span className="table-secondary">{entry.notes || 'Sin notas'}</span></td>
          <td>{entry.username ? <button className="copy-link" onClick={() => void copy(entry.username)} title="Copiar usuario">{entry.username}</button> : '—'}</td>
          <td><span className="password-value">{revealed.has(entry.id) ? entry.password : '••••••••••••'}</span><button className="copy-link copy-link--action" onClick={() => toggleReveal(entry.id)}>{revealed.has(entry.id) ? 'Ocultar' : 'Mostrar'}</button><button className="copy-link copy-link--action" onClick={() => void copy(entry.password)}>Copiar</button></td>
          <td>{entry.url ? <a className="inline-link" href={entry.url} target="_blank" rel="noreferrer">{entry.url}</a> : '—'}</td>
          <td><div className="table-actions"><Button className="icon-button" size="small" appearance="subtle" icon={<Edit20Regular />} aria-label={`Editar ${entry.title}`} onClick={() => start(entry)} /><Button className="icon-button" size="small" appearance="subtle" icon={<Delete20Regular />} aria-label={`Eliminar ${entry.title}`} onClick={() => void remove(entry)} /></div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
    {open && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="password-title">
        <h2 id="password-title">{editing ? 'Editar contraseña' : 'Nueva contraseña'}</h2>
        <p className="modal-subtitle">La contraseña se cifra antes de guardar en la base local.</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field span-2">Servicio o aplicación <input required autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Microsoft 365" /></label>
            <label className="form-field">Usuario o correo <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="usuario@empresa.com" /></label>
            <label className="form-field">Sitio web <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://ejemplo.com" /></label>
            <label className="form-field span-2">Contraseña
              <div className="password-input-row"><input required type="text" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Contraseña" /><Button type="button" appearance="secondary" onClick={generatePassword}>Generar</Button></div>
            </label>
            <label className="form-field span-2">Notas <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Información adicional" /></label>
          </div>
          {error && <p className="modal-error" role="alert">{error}</p>}
          <div className="form-actions"><Button type="button" appearance="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" appearance="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar contraseña'}</Button></div>
        </form>
      </section>
    </div>}
  </>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Ocurrió un error al consultar contraseñas.' }
