import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MarcaPrestaFast } from '../components/MarcaPrestaFast'
import { useAuth } from '../store/AuthProvider'

export function LoginPage() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()
  const [usuarioCampo, setUsuarioCampo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  if (usuario) {
    return <Navigate to={usuario.rol === 'cobrador' ? '/ruta' : '/'} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setCargando(true)
    try {
      const sesion = await login(usuarioCampo, clave)
      navigate(sesion.rol === 'cobrador' ? '/ruta' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: '#f4f1ea' }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <MarcaPrestaFast variante="login" />
            <Typography color="text.secondary">
              Entra con tu usuario. El administrador ve el tablero; el cobrador ve su ruta.
            </Typography>
            <TextField label="Usuario" value={usuarioCampo} onChange={(e) => setUsuarioCampo(e.target.value)} autoComplete="username" fullWidth />
            <TextField label="Contraseña" type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" fullWidth />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button type="submit" variant="contained" disabled={cargando}>
              {cargando ? 'Entrando…' : 'Entrar'}
            </Button>
            {import.meta.env.DEV ? (
              <Typography variant="caption" color="text.secondary">
                Desarrollo: admin / Admin#2026Prestamos · cobrador / Cobra#2026Ruta. Cámbialas antes de producción.
              </Typography>
            ) : null}
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
