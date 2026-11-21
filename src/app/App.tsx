import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { Panel } from './routes/Panel'
import { Personas } from './routes/Personas'
import { Equipos } from './routes/Equipos'
import { Componentes } from './routes/Componentes'
import { Areas } from './routes/Areas'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Panel />} />
        <Route path="/personas" element={<Personas />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/componentes" element={<Componentes />} />
        <Route path="/areas" element={<Areas />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
