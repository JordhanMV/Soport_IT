import { useEffect, useState } from 'react'
import { Button, Spinner } from '@fluentui/react-components'
import { Desktop20Regular, People20Regular, Memory16Regular, ArrowRight20Regular, Add20Regular } from '@fluentui/react-icons'
import { Link, useNavigate } from 'react-router-dom'
import { inventoryApi } from '../../api'
import type { DashboardSummary } from '../../shared/types'
import { PageHeader } from '../../components/PageHeader'
import { Feedback, EmptyState } from '../../components/Feedback'

export function Panel() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    inventoryApi.dashboard().then(setSummary).catch((reason: unknown) => setError(messageOf(reason)))
  }, [])

  return (
    <>
      <PageHeader title="Panel" description="Resumen de personas, equipos y componentes del inventario.">
        <Button appearance="primary" icon={<Add20Regular />} onClick={() => navigate('/equipos')}>Registrar equipo</Button>
      </PageHeader>
      <Feedback error={error} />
      {!summary ? <div className="loading"><Spinner label="Cargando inventario local…" /></div> : (
        <>
          <section className="kpi-grid" aria-label="Resumen del inventario">
            <Kpi label="Personas activas" value={summary.peopleCount} detail="Personas en el directorio" icon={<People20Regular />} />
            <Kpi label="Equipos registrados" value={summary.equipmentCount} detail="Equipos y periféricos" icon={<Desktop20Regular />} />
            <Kpi label="Componentes" value={summary.componentCount} detail="Componentes registrados" icon={<Memory16Regular />} />
            <Kpi label="Sin asignar" value={summary.unassignedEquipment} detail="Equipos disponibles" icon={<span className="unassigned-icon">↗</span>} warn={summary.unassignedEquipment > 0} />
          </section>
          <section className="card">
            <div className="card-heading">
              <div><h2>Equipos recientes</h2><p>Asignaciones y estado del equipo.</p></div>
              <Link className="inline-link" to="/equipos">Ver equipos <ArrowRight20Regular /></Link>
            </div>
            {summary.recentEquipment.length === 0 ? (
              <EmptyState title="Aún no hay equipos" detail="Registra el primer equipo para comenzar el inventario." />
            ) : <EquipmentTable rows={summary.recentEquipment} />}
          </section>
          <div className="quick-links">
            <Link to="/personas"><People20Regular /> Directorio de personas <ArrowRight20Regular /></Link>
            <Link to="/componentes"><Memory16Regular /> Administrar componentes <ArrowRight20Regular /></Link>
          </div>
        </>
      )}
    </>
  )
}

function Kpi({ label, value, detail, icon, warn }: { label: string; value: number; detail: string; icon: import('react').ReactNode; warn?: boolean }) {
  return <article className="kpi-card"><div className="kpi-top"><span>{label}</span><span className="kpi-icon">{icon}</span></div><div className="kpi-value">{value}</div><div className={`kpi-foot${warn ? ' warning-text' : ''}`}>{detail}</div></article>
}

export function EquipmentTable({ rows }: { rows: DashboardSummary['recentEquipment'] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Equipo</th><th>Persona</th><th>Procesador</th><th>Memoria</th><th>Componentes</th><th>Estado</th></tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={row.id}>
            <td><strong className="table-primary">{row.assetTag}</strong><span className="table-secondary">{row.areaName || 'Sin área'}</span></td>
            <td>{row.personName || <span className="muted">Sin asignar</span>}</td>
            <td>{row.processor || '—'}</td>
            <td>{row.memoryGb ? `${row.memoryGb} GB` : '—'}</td>
            <td>{row.componentCount}</td>
            <td><Status status={row.status} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

export function Status({ status }: { status: string }) {
  const style = status === 'Operativo' || status === 'Activo' ? 'success' : status === 'Mantenimiento' ? 'warning' : status === 'Baja' || status === 'Inactivo' ? 'danger' : 'neutral'
  return <span className={`status ${style}`}>{status}</span>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'No se pudieron cargar los datos locales.' }
