import { Button, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useNavigate } from 'react-router-dom'
import { BotonWhatsAppCliente } from '../components/BotonWhatsAppCliente'
import { formatFechaLarga } from '../domain/calendario'
import { money } from '../domain/calculo'
import type { Cliente } from '../domain/cliente'
import { hidratarCliente } from '../domain/operacion'
import { useClientes } from '../store/ClientesProvider'

export function ClientesPage() {
  const navigate = useNavigate()
  const { clientes } = useClientes()
  const filas = clientes.map(hidratarCliente)

  const columns: GridColDef<(typeof filas)[number]>[] = [
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
      valueGetter: (_value, row) => row.prestamo.desembolso,
      valueFormatter: (value: number) => money(value),
    },
    {
      field: 'cuotaDiaria',
      headerName: 'Cuota',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_value, row) => row.prestamo.cuotaDiaria,
      valueFormatter: (value: number) => money(value),
    },
    {
      field: 'fechaDesembolso',
      headerName: 'Desembolsó',
      width: 160,
      valueGetter: (_value, row) => row.prestamo.fechaDesembolso,
      valueFormatter: (value: string) => formatFechaLarga(value),
    },
    {
      field: 'whatsapp',
      headerName: 'Aviso',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => <BotonWhatsAppCliente cliente={params.row as Cliente} compacto />,
    },
  ]

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
          rows={filas}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          onCellClick={(params) => {
            if (params.field === 'whatsapp') return
            navigate(`/clientes/${params.id}`)
          }}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none', minHeight: 280, cursor: 'pointer' }}
        />
      </Paper>
    </Stack>
  )
}
