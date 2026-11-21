import { useEffect, useState } from 'react'
import { Button, Spinner } from '@fluentui/react-components'
import type { UpdateStatus } from '../shared/types'

export function UpdateNotice() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [dismissedVersion, setDismissedVersion] = useState('')
  const [dismissedError, setDismissedError] = useState(false)

  useEffect(() => {
    const unsubscribe = window.inventory.onUpdateStatus((nextStatus) => {
      setStatus(nextStatus)
      if (nextStatus.state === 'checking') setDismissedError(false)
    })
    void window.inventory.updateStatus().then(setStatus).catch((error: unknown) => {
      setStatus({ state: 'error', message: messageOf(error) })
    })
    void window.inventory.checkForUpdates()
    const interval = window.setInterval(() => void window.inventory.checkForUpdates(), 6 * 60 * 60 * 1000)
    return () => {
      unsubscribe()
      window.clearInterval(interval)
    }
  }, [])

  async function download() {
    await window.inventory.downloadUpdate()
  }

  async function install() {
    await window.inventory.installUpdate()
  }

  if (
    status.state === 'idle' ||
    status.state === 'not-available' ||
    (status.state === 'available' && dismissedVersion === status.version) ||
    (status.state === 'error' && dismissedError)
  ) return null

  return (
    <section className="update-notice" role="status" aria-live="polite">
      {status.state === 'checking' && <><Spinner size="tiny" /><span>Buscando actualizaciones…</span></>}
      {status.state === 'available' && <>
        <span>Está disponible la versión {status.version}.</span>
        <Button size="small" appearance="primary" onClick={() => void download()}>Descargar</Button>
        <Button size="small" appearance="subtle" onClick={() => setDismissedVersion(status.version)}>Después</Button>
      </>}
      {status.state === 'downloading' && <>
        <span>Descargando actualización: {Math.round(status.percent)}%</span>
        <progress max="100" value={status.percent} aria-label="Progreso de descarga" />
      </>}
      {status.state === 'downloaded' && <>
        <span>La versión {status.version} está lista para instalar.</span>
        <Button size="small" appearance="primary" onClick={() => void install()}>Reiniciar e instalar</Button>
      </>}
      {status.state === 'error' && <>
        <span role="alert">No se pudo actualizar: {status.message}</span>
        <Button size="small" appearance="secondary" onClick={() => void window.inventory.checkForUpdates()}>Reintentar</Button>
        <Button size="small" appearance="subtle" onClick={() => setDismissedError(true)}>Cerrar</Button>
      </>}
    </section>
  )
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo consultar la actualización.'
}
