import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import { MarcaPrestaFast } from '../components/MarcaPrestaFast'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthProvider'

const DRAWER_WIDTH = 248

const menuAdmin = [
  { to: '/', label: 'Tablero', icon: <DashboardOutlinedIcon /> },
  { to: '/clientes', label: 'Clientes', icon: <GroupsOutlinedIcon /> },
  { to: '/autorizaciones', label: 'Autorizaciones', icon: <PaymentsOutlinedIcon /> },
  { to: '/tabulador', label: 'Tabulador', icon: <TableChartOutlinedIcon /> },
  { to: '/configuracion', label: 'Planes', icon: <SettingsOutlinedIcon /> },
  { to: '/cobranza', label: 'Cobranza', icon: <AccountBalanceWalletOutlinedIcon /> },
  { to: '/reportes', label: 'Reportes', icon: <AssessmentOutlinedIcon /> },
  { to: '/rutas', label: 'Cierres', icon: <RouteOutlinedIcon /> },
  { to: '/caja', label: 'Caja', icon: <SavingsOutlinedIcon /> },
  { to: '/usuarios', label: 'Usuarios', icon: <ManageAccountsOutlinedIcon /> },
]

const menuCobrador = [
  { to: '/ruta', label: 'Mi ruta', icon: <RouteOutlinedIcon /> },
  { to: '/clientes/nuevo', label: 'Registrar', icon: <GroupsOutlinedIcon /> },
]

export function AdminLayout() {
  const { usuario, logout } = useAuth()
  const theme = useTheme()
  const compacto = useMediaQuery(theme.breakpoints.down('md'))
  const [abierto, setAbierto] = useState(false)

  if (!usuario) return <Navigate to="/login" replace />

  const menu = usuario.rol === 'cobrador' ? menuCobrador : menuAdmin
  const drawer = (
    <Box>
      <Toolbar />
      <List sx={{ px: 1, pt: 2 }}>
        {menu.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === '/' || item.to === '/ruta'}
            onClick={() => setAbierto(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'inherit' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton onClick={logout} sx={{ borderRadius: 2, mt: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Salir" />
        </ListItemButton>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          {compacto ? (
            <IconButton color="inherit" onClick={() => setAbierto(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box sx={{ flexGrow: 1 }}>
            <MarcaPrestaFast variante="barra" />
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {usuario.nombre}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={compacto ? 'temporary' : 'permanent'}
        open={compacto ? abierto : true}
        onClose={() => setAbierto(false)}
        sx={{
          width: DRAWER_WIDTH,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, md: 3 }, width: '100%' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
