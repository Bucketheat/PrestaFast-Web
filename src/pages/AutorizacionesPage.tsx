import { Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useNavigate } from 'react-router-dom'
import { money } from '../domain/calculo'
import { hidratarCliente } from '../domain/operacion'
import { useClientes } from '../store/ClientesProvider'

export function AutorizacionesPage() {
  const navigate = useNavigate()
  const { clientes, aprobar, rechazar } = useClientes()
  const pendientes = clientes.map(hidratarCliente).filter((c) => c.estado === 'pendiente_autorizacion')

  const columns: GridColDef[] = [
    { field: 'numeroControl', headerName: 'Control', width: 140 },
    { field: 'nombreCompleto', headerName: 'Cliente', flex: 1, minWidth: 160 },
    { field: 'capturadoPor', headerName: 'Cobrador', width: 160 },
    { field: 'zona', headerName: 'Ruta', width: 120 },
    { field: 'desembolso', headerName: 'Monto', width: 120, valueFormatter: (v: number) => money(v) },
    { field: 'cuota', headerName: 'Cuota', width: 110, valueFormatter: (v: number) => money(v) },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button size="small" variant="contained" onClick={() => aprobar(String(params.id))}>
            Aprobar
          </Button>
          <Button size="small" color="error" onClick={() => rechazar(String(params.id))}>
            Rechazar
          </Button>
        </Stack>
      ),
    },
  ]

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h1">Autorizaciones</Typography>
        <Typography color="text.secondary">
          Altas que manda el cobrador. Al aprobar, el cliente entra a cobranza con su control.
        </Typography>
      </Stack>
      <Chip label={`${pendientes.length} pendientes`} color={pendientes.length ? 'warning' : 'default'} sx={{ alignSelf: 'flex-start' }} />
      <Paper sx={{ p: 1 }}>
        <DataGrid
          rows={pendientes.map((c) => ({
            id: c.id,
            numeroControl: c.numeroControl,
            nombreCompleto: c.nombreCompleto,
            capturadoPor: c.capturadoPor ?? 'Cobrador',
            zona: c.zona,
            desembolso: c.prestamo.desembolso,
            cuota: c.prestamo.cuotaDiaria,
          }))}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(params) => {
            if ((params as { field?: string }).field === 'acciones') return
            navigate(`/clientes/${params.id}`)
          }}
          sx={{ border: 'none', minHeight: 280 }}
        />
      </Paper>
    </Stack>
  )
}
