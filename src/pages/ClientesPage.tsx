import { Button, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useNavigate } from 'react-router-dom'
import { formatFechaLarga } from '../domain/calendario'
import { money } from '../domain/calculo'
import { useClientes } from '../store/ClientesProvider'

const columns: GridColDef[] = [
  { field: 'numeroControl', headerName: 'No. control', width: 150 },
  { field: 'nombreCompleto', headerName: 'Cliente', flex: 1, minWidth: 180 },
  { field: 'telefono', headerName: 'Teléfono', width: 140 },
  { field: 'zona', headerName: 'Ruta', width: 120 },
  {
    field: 'desembolso',
    headerName: 'Desembolso',
    width: 130,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => money(value),
  },
  {
    field: 'cuotaDiaria',
    headerName: 'Cuota',
    width: 110,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => money(value),
  },
  { field: 'fechaDesembolso', headerName: 'Desembolsó', width: 180, valueFormatter: (value: string) => formatFechaLarga(value) },
]

export function ClientesPage() {
  const navigate = useNavigate()
  const { clientes } = useClientes()

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Stack>
          <Typography variant="h1">Clientes</Typography>
          <Typography color="text.secondary">
            Cada cliente tiene número de control, INE, pagaré y su calendario de pagos.
          </Typography>
        </Stack>
        <Button variant="contained" onClick={() => navigate('/clientes/nuevo')}>
          Registrar cliente
        </Button>
      </Stack>

      <Paper sx={{ p: 1 }}>
        <DataGrid
          rows={clientes.map((cliente) => ({
            id: cliente.id,
            numeroControl: cliente.numeroControl,
            nombreCompleto: cliente.nombreCompleto,
            telefono: cliente.telefono,
            zona: cliente.zona,
            desembolso: cliente.prestamo.desembolso,
            cuotaDiaria: cliente.prestamo.cuotaDiaria,
            fechaDesembolso: cliente.prestamo.fechaDesembolso,
          }))}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/clientes/${params.id}`)}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none', minHeight: 280, cursor: 'pointer' }}
        />
      </Paper>
    </Stack>
  )
}
