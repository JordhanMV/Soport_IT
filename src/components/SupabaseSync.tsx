import { FormEvent, useEffect, useState } from 'react'
import { Button, Spinner } from '@fluentui/react-components'
import { Cloud20Regular } from '@fluentui/react-icons'
import { inventoryApi } from '../api'
import type { SyncStatus } from '../shared/types'

export function SupabaseSync() {
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle' })
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    inventoryApi.supabaseStatus().then(setStatus).catch(() => undefined)
  }, [])

  async function signIn(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    const result = creating
      ? await inventoryApi.supabaseSignUp(email, password)
      : await inventoryApi.supabaseSignIn(email, password)
    setStatus(result)
    setPassword('')
    setBusy(false)
  }

  async function sync() {
    setBusy(true)
    setStatus({ state: 'syncing', email: status.email })
    setStatus(await inventoryApi.supabaseSync())
    setBusy(false)
  }

  async function signOut() {
    setBusy(true)
    setStatus(await inventoryApi.supabaseSignOut())
    setBusy(false)
  }

  return <>
    <Button
      size="small"
      appearance="subtle"
      icon={status.state === 'syncing' ? <Spinner size="tiny" /> : <Cloud20Regular />}
      onClick={() => setOpen(true)}
    >
      {status.state === 'synced' ? 'Sincronizado' : 'Nube'}
    </Button>
    {open && <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false)
    }}>
      <section className="record-modal record-modal--small" role="dialog" aria-modal="true" aria-labelledby="sync-title">
        <h2 id="sync-title">Sincronización con Supabase</h2>
        <p className="modal-subtitle">Los datos locales siguen disponibles sin conexión.</p>
        {status.state === 'signed-in' || status.state === 'synced' || (status.state === 'error' && Boolean(status.email)) ? <>
          <p className="sync-account">Cuenta: <strong>{status.email || 'Usuario conectado'}</strong></p>
          {status.synchronizedAt && <p className="sync-account">Última sincronización: {new Date(status.synchronizedAt).toLocaleString()}</p>}
          {status.state === 'error' && <p className="modal-error">{status.message}</p>}
          <div className="form-actions">
            <Button type="button" appearance="secondary" disabled={busy} onClick={() => void signOut()}>Cerrar sesión</Button>
            <Button type="button" appearance="primary" disabled={busy} onClick={() => void sync()}>
              {busy ? 'Sincronizando…' : 'Sincronizar ahora'}
            </Button>
          </div>
        </> : <form onSubmit={signIn}>
          <div className="form-grid sync-login">
            <label className="form-field span-2">Correo <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="form-field span-2">Contraseña <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          </div>
          {status.message && <p className="modal-error">{status.message}</p>}
          <div className="form-actions">
            <Button type="button" appearance="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="button" appearance="secondary" disabled={busy} onClick={() => setCreating((value) => !value)}>
              {creating ? 'Ya tengo cuenta' : 'Crear cuenta'}
            </Button>
            <Button type="submit" appearance="primary" disabled={busy}>
              {busy ? 'Conectando…' : creating ? 'Registrarme' : 'Iniciar sesión'}
            </Button>
          </div>
        </form>}
      </section>
    </div>}
  </>
}
