import { Box, Typography } from '@mui/material'
import { MARCA } from '../branding'
import { formatFechaLarga } from '../domain/calendario'
import { money } from '../domain/calculo'
import type { Cliente } from '../domain/cliente'

export function ControlFicha({ cliente }: { cliente: Cliente }) {
  const { prestamo } = cliente
  const ine = cliente.documentos.find((doc) => doc.tipo === 'ine_frente')
  const pagare = cliente.documentos.find((doc) => doc.tipo === 'pagare')

  return (
    <Box sx={{ p: 3, bgcolor: '#fff', color: '#1c1917' }}>
      <Typography variant="body2" color="text.secondary">
        {MARCA.nombre} · Ficha de control digital
      </Typography>
      <Typography variant="h1">{cliente.nombreCompleto}</Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 700, letterSpacing: 0.6 }}>
        {cliente.numeroControl}
      </Typography>
      <Typography sx={{ my: 1.5 }} color="text.secondary">
        Este control lo lleva el administrador en el sistema y el cobrador en la app. Esta copia es el respaldo digital.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1, my: 2 }}>
        <Typography><strong>Teléfono:</strong> {cliente.telefono}</Typography>
        <Typography><strong>INE:</strong> {cliente.ineNumero}</Typography>
        <Typography><strong>Domicilio:</strong> {cliente.domicilio}</Typography>
        <Typography><strong>Zona / ruta:</strong> {cliente.zona || 'Sin asignar'}</Typography>
        <Typography><strong>Pagaré:</strong> {money(cliente.pagareMonto)} · {formatFechaLarga(cliente.pagareFecha)}</Typography>
        <Typography><strong>Desembolso:</strong> {formatFechaLarga(prestamo.fechaDesembolso)}</Typography>
        <Typography><strong>Plan:</strong> {prestamo.planNombre} · ${prestamo.cuotaPorMil} por mil</Typography>
        <Typography><strong>Primer cobro:</strong> {formatFechaLarga(prestamo.fechaPrimerCobro)}</Typography>
        <Typography><strong>Entregado:</strong> {money(prestamo.desembolso)}</Typography>
        <Typography><strong>Cuota diaria:</strong> {money(prestamo.cuotaDiaria)}</Typography>
        <Typography><strong>Pagos:</strong> {prestamo.plazoPagos} · {prestamo.cobraDomingo ? 'incluye domingo' : 'sin domingo'}</Typography>
        <Typography><strong>Total:</strong> {money(prestamo.total)} · cargo {money(prestamo.cargo)}</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, my: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>INE</Typography>
          {ine?.dataUrl.startsWith('data:image') ? (
            <Box component="img" src={ine.dataUrl} alt="INE" sx={{ maxWidth: '100%', maxHeight: 180 }} />
          ) : (
            <Typography color="text.secondary">Sin archivo</Typography>
          )}
        </Box>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>Pagaré</Typography>
          {pagare?.dataUrl.startsWith('data:image') ? (
            <Box component="img" src={pagare.dataUrl} alt="Pagaré" sx={{ maxWidth: '100%', maxHeight: 180 }} />
          ) : (
            <Typography color="text.secondary">Pagaré cargado en el expediente</Typography>
          )}
        </Box>
      </Box>

      <Typography variant="h3" sx={{ mb: 1 }}>Calendario de pagos diarios</Typography>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { border: '1px solid #d6d3d1', p: 1, fontSize: 13 } }}>
        <thead>
          <tr>
            <Box component="th" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'left' }}>#</Box>
            <Box component="th" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'left' }}>Fecha</Box>
            <Box component="th" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'right' }}>Cuota</Box>
            <Box component="th" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'left' }}>Cobrado</Box>
          </tr>
        </thead>
        <tbody>
          {prestamo.cuotas.map((cuota) => (
            <tr key={cuota.numero}>
              <td>{cuota.numero}</td>
              <td>{formatFechaLarga(cuota.fecha)}</td>
              <Box component="td" sx={{ textAlign: 'right' }}>{money(cuota.monto)}</Box>
              <td />
            </tr>
          ))}
        </tbody>
      </Box>

      <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f4f1ea' }}>
        <Typography variant="body2">
          Folio {prestamo.folio}. El cobrador registra el pago en la app; el administrador lo ve en la web.
          No se cobra el día del desembolso.
        </Typography>
      </Box>
    </Box>
  )
}
