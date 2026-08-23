import { CssBaseline, ThemeProvider } from '@mui/material'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layout/AdminLayout'
import { AutorizacionesPage } from './pages/AutorizacionesPage'
import { ClienteDetallePage } from './pages/ClienteDetallePage'
import { ClienteNuevoPage } from './pages/ClienteNuevoPage'
import { ClientesPage } from './pages/ClientesPage'
import { CobradorRutaPage } from './pages/CobradorRutaPage'
import { CobranzaPage } from './pages/CobranzaPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'
import { ControlPrintPage } from './pages/ControlPrintPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { CajaPage } from './pages/CajaPage'
import { GastosPage } from './pages/GastosPage'
import { ReciboPrintPage } from './pages/ReciboPrintPage'
import { ReportesPage } from './pages/ReportesPage'
import { RutasPage } from './pages/RutasPage'
import { TabuladorPage } from './pages/TabuladorPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { AuthProvider, useAuth } from './store/AuthProvider'
import { CierresProvider } from './store/CierresProvider'
import { ClientesProvider } from './store/ClientesProvider'
import { CajaProvider } from './store/CajaProvider'
import { GastosProvider } from './store/GastosProvider'
import { ConfigProvider } from './store/ConfigProvider'
import { UsuariosProvider } from './store/UsuariosProvider'
import { theme } from './theme'

function SoloAdmin({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  if (usuario?.rol === 'cobrador') return <Navigate to="/ruta" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="control/:id" element={<ControlPrintPage />} />
      <Route path="recibo/:id/:numero" element={<ReciboPrintPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<SoloAdmin><DashboardPage /></SoloAdmin>} />
        <Route path="ruta" element={<CobradorRutaPage />} />
        <Route path="tabulador" element={<SoloAdmin><TabuladorPage /></SoloAdmin>} />
        <Route path="configuracion" element={<SoloAdmin><ConfiguracionPage /></SoloAdmin>} />
        <Route path="autorizaciones" element={<SoloAdmin><AutorizacionesPage /></SoloAdmin>} />
        <Route path="clientes" element={<SoloAdmin><ClientesPage /></SoloAdmin>} />
        <Route path="clientes/nuevo" element={<ClienteNuevoPage />} />
        <Route path="clientes/:id" element={<ClienteDetallePage />} />
        <Route path="cobranza" element={<SoloAdmin><CobranzaPage /></SoloAdmin>} />
        <Route path="reportes" element={<SoloAdmin><ReportesPage /></SoloAdmin>} />
        <Route path="rutas" element={<SoloAdmin><RutasPage /></SoloAdmin>} />
        <Route path="caja" element={<SoloAdmin><CajaPage /></SoloAdmin>} />
        <Route path="gastos" element={<GastosPage />} />
        <Route path="usuarios" element={<SoloAdmin><UsuariosPage /></SoloAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UsuariosProvider>
        <AuthProvider>
          <ConfigProvider>
            <CajaProvider>
              <ClientesProvider>
                <CierresProvider>
                  <GastosProvider>
                    <BrowserRouter>
                      <AppRoutes />
                    </BrowserRouter>
                  </GastosProvider>
                </CierresProvider>
              </ClientesProvider>
            </CajaProvider>
          </ConfigProvider>
        </AuthProvider>
      </UsuariosProvider>
    </ThemeProvider>
  )
}
