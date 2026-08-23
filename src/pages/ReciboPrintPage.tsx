import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { MARCA } from '../branding'
import { formatFechaLarga, hoyIso } from '../domain/calendario'
import { money } from '../domain/calculo'
import { enlaceWhatsApp, textoReciboWhatsApp } from '../domain/recibo'
import { useAuth } from '../store/AuthProvider'
import { useClientes } from '../store/ClientesProvider'

export function ReciboPrintPage() {
  const { id, numero } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { buscarPorId, cargarDetalle } = useClientes()

  useEffect(() => {
    if (id && usuario) void cargarDetalle(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, usuario])

  if (!usuario) return <Navigate to="/login" replace />
  const cliente = id ? buscarPorId(id) : undefined
  const cuota = cliente?.prestamo.cuotas.find((item) => String(item.numero) === numero)

  if (!cliente || !cuota) {
    return (
      <Stack sx={{ p: 3 }}>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </Stack>
    )
  }

  const pagado = cuota.pagado || cuota.monto
  const restantes = cliente.prestamo.cuotas.filter((item) => item.estado !== 'pagada').length
  const recuperado = cliente.prestamo.cuotas.reduce((suma, item) => suma + item.pagado, 0)
  const whatsapp = enlaceWhatsApp(cliente.telefono, textoReciboWhatsApp(cliente, cuota))

  return (
    <Stack>
      <Stack className="no-print" direction="row" sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => window.print()}>
          Imprimir o PDF
        </Button>
        <Button variant="outlined" startIcon={<WhatsAppIcon />} href={whatsapp} target="_blank" rel="noreferrer">
          Enviar por WhatsApp
        </Button>
        <Button onClick={() => navigate(usuario.rol === 'cobrador' ? '/ruta' : `/clientes/${cliente.id}`)}>
          Volver
        </Button>
      </Stack>

      <Box sx={{ display: 'grid', placeItems: 'center', p: 2 }}>
        <Paper sx={{ p: 3, width: '100%', maxWidth: 420 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>
            {MARCA.nombre}
          </Typography>
          <Typography color="text.secondary">{MARCA.eslogan}</Typography>
          <Typography variant="h1" sx={{ mt: 1 }}>
            Recibo de pago
          </Typography>
          <Typography sx={{ fontSize: 36, fontWeight: 700, color: 'primary.main', my: 1 }}>{money(pagado)}</Typography>
          <Stack spacing={0.75}>
            <Typography><strong>Cliente:</strong> {cliente.nombreCompleto}</Typography>
            <Typography><strong>Control:</strong> {cliente.numeroControl}</Typography>
            <Typography><strong>Pago:</strong> {cuota.numero} / {cliente.prestamo.plazoPagos}</Typography>
            <Typography><strong>Fecha:</strong> {formatFechaLarga(cuota.pagadoEn || hoyIso())}</Typography>
            <Typography><strong>Recuperado:</strong> {money(recuperado)} de {money(cliente.prestamo.total)}</Typography>
            <Typography><strong>Pendientes:</strong> {restantes}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Conserve este recibo. El cobro quedó registrado en {MARCA.nombre}.
          </Typography>
        </Paper>
      </Box>
    </Stack>
  )
}
