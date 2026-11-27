import { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { Desktop20Regular, People20Regular, Home20Regular, Memory16Regular, Building20Regular, Key20Regular, Note20Regular, WeatherMoon20Regular, WeatherSunny20Regular } from '@fluentui/react-icons'
import { Button } from '@fluentui/react-components'
import { UpdateNotice } from './UpdateNotice'
import { SupabaseSync } from './SupabaseSync'
import { useTheme } from '../theme'

const links = [
  { to: '/', label: 'Panel', Icon: Home20Regular, end: true },
  { to: '/personas', label: 'Personas', Icon: People20Regular },
  { to: '/equipos', label: 'Equipos', Icon: Desktop20Regular },
  { to: '/componentes', label: 'Componentes', Icon: Memory16Regular },
  { to: '/areas', label: 'Áreas', Icon: Building20Regular },
  { to: '/contrasenas', label: 'Contraseñas', Icon: Key20Regular },
  { to: '/notas', label: 'Notas', Icon: Note20Regular },
]

export function Shell({ children }: PropsWithChildren) {
  const { themeName, toggleTheme } = useTheme()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Desktop20Regular /></span>
          <span>Inventario de soporte</span>
        </div>
        <div className="topbar-actions">
          <Button
            size="small"
            appearance="subtle"
            icon={themeName === 'dark' ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
            onClick={toggleTheme}
            aria-label={themeName === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {themeName === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </Button>
          <Button size="small" appearance="subtle" onClick={() => void window.inventory.checkForUpdates()}>Buscar actualizaciones</Button>
          <SupabaseSync />
          <div className="local-indicator"><span className="online-dot" /> Base de datos local</div>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="nav-caption">INVENTARIO</div>
          <nav aria-label="Navegación principal">
            {links.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Icon /> <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-note">
            <strong>Almacenamiento protegido</strong>
            <span>Los datos se guardan en este equipo y no se envían a la nube.</span>
          </div>
        </aside>
        <main className="main-content">
          <UpdateNotice />
          {children}
        </main>
      </div>
    </div>
  )
}
