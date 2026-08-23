import { Button, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { hoyIso } from '../domain/calendario'
import { money } from '../domain/calculo'
import { cuotaCobradaEl } from '../domain/cierre'
import { descargarCsv } from '../domain/exportar'
import { hidratarCliente } from '../domain/operacion'
import { useClientes } from '../store/ClientesProvider'

const columnasCobranza: GridColDef[] = [
  { field: 'numeroControl', headerName: 'Control', width: 140 },
  { field: 'nombreCompleto', headerName: 'Cliente', flex: 1, minWidth: 160 },
  { field: 'cobrador', headerName: 'Cobrador', width: 140 },
  { field: 'esperado', headerName: 'Esperado', width: 120, valueFormatter: (v: number) => money(v) },
  { field: 'cobrado', headerName: 'Cobrado', width: 120, valueFormatter: (v: number) => money(v) },
  { field: 'estadoCuota', headerName: 'Hoy', width: 130 },
  { field: 'vencidas', headerName: 'Vencidas', width: 110 },
]

const columnasMora: GridColDef[] = [
  { field: 'numeroControl', headerName: 'Control', width: 140 },
  { field: 'nombreCompleto', headerName: 'Cliente', flex: 1, minWidth: 160 },
  { field: 'telefono', headerName: 'Teléfono', width: 140 },
  { field: 'vencidas', headerName: 'Días', width: 90 },
  { field: 'montoVencido', headerName: 'Vencido', width: 130, valueFormatter: (v: number) => money(v) },
  { field: 'score', headerName: 'Score', width: 90 },
]

export function ReportesPage() {
  const { clientes } = useClientes()
  const hoy = hoyIso()
  const hidratados = clientes.map(hidratarCliente)

  const cobranza = hidratados
    .filter((cliente) => cliente.estado === 'activo')
    .map((cliente) => {
      const deHoy = cliente.prestamo.cuotas.find((cuota) => cuota.fecha === hoy)
      return {
        id: cliente.id,
        numeroControl: cliente.numeroControl,
        nombreCompleto: cliente.nombreCompleto,
        cobrador: cliente.capturadoPor || cliente.zona || '—',
        esperado: deHoy ? deHoy.monto : 0,
        cobrado: cliente.prestamo.cuotas.filter((cuota) => cuotaCobradaEl(cuota, hoy)).reduce((suma, cuota) => suma + cuota.pagado, 0),
        estadoCuota: deHoy?.estado ?? 'sin cuota',
        vencidas: cliente.prestamo.cuotas.filter((cuota) => cuota.estado === 'vencida').length,
      }
    })

  const morosos = hidratados
    .filter((cliente) => cliente.estado === 'activo' && cliente.prestamo.cuotas.some((cuota) => cuota.estado === 'vencida'))
    .map((cliente) => {
      const vencidas = cliente.prestamo.cuotas.filter((cuota) => cuota.estado === 'vencida')
      return {
        id: cliente.id,
        numeroControl: cliente.numeroControl,
        nombreCompleto: cliente.nombreCompleto,
        telefono: cliente.telefono,
        vencidas: vencidas.length,
        montoVencido: vencidas.reduce((suma, cuota) => suma + (cuota.monto - cuota.pagado), 0),
        score: cliente.score,
      }
    })
    .sort((a, b) => b.montoVencido - a.montoVencido)

  const liquidados = hidratados.filter((cliente) => cliente.prestamo.estado === 'liquidado')

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h1">Reportes</Typography>
        <Typography color="text.secondary">Cobranza del día, morosidad y exportar a Excel.</Typography>
      </Stack>

      <Paper sx={{ p: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ p: 1.5, justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h3">Cobranza de hoy</Typography>
          <Button
            variant="outlined"
            onClick={() =>
              descargarCsv(
                `prestafast-cobranza-${hoy}`,
                ['Control', 'Cliente', 'Cobrador', 'Esperado', 'Cobrado', 'Estado', 'Vencidas'],
                cobranza.map((fila) => [fila.numeroControl, fila.nombreCompleto, fila.cobrador, fila.esperado, fila.cobrado, fila.estadoCuota, fila.vencidas]),
              )
            }
          >
            Excel / CSV
          </Button>
        </Stack>
        <DataGrid rows={cobranza} columns={columnasCobranza} autoHeight disableRowSelectionOnClick sx={{ border: 'none' }} />
      </Paper>

      <Paper sx={{ p: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ p: 1.5, justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h3">Morosidad</Typography>
          <Button
            variant="outlined"
            onClick={() =>
              descargarCsv(
                `prestafast-mora-${hoy}`,
                ['Control', 'Cliente', 'Teléfono', 'Días vencidos', 'Monto vencido', 'Score'],
                morosos.map((fila) => [fila.numeroControl, fila.nombreCompleto, fila.telefono, fila.vencidas, fila.montoVencido, fila.score]),
              )
            }
          >
            Excel / CSV
          </Button>
        </Stack>
        <DataGrid rows={morosos} columns={columnasMora} autoHeight disableRowSelectionOnClick sx={{ border: 'none' }} />
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h3">Listos para renovar</Typography>
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          {liquidados.length} cliente(s) ya liquidaron los 30 pagos.
        </Typography>
        {liquidados.length === 0 ? (
          <Typography color="text.secondary">Nadie ha liquidado todavía.</Typography>
        ) : (
          liquidados.map((cliente) => (
            <Typography key={cliente.id}>
              {cliente.numeroControl} · {cliente.nombreCompleto} · score {cliente.score}
            </Typography>
          ))
        )}
      </Paper>
    </Stack>
  )
}
