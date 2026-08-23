import { Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useNavigate } from 'react-router-dom'
import { BotonWhatsAppCliente } from '../components/BotonWhatsAppCliente'
import { hoyIso } from '../domain/calendario'
import { money } from '../domain/calculo'
import type { Cliente } from '../domain/cliente'
import { hidratarCliente } from '../domain/operacion'
import { useClientes } from '../store/ClientesProvider'

export function CobranzaPage() {
  const navigate = useNavigate()
  const { clientes } = useClientes()
  const hoy = hoyIso()
  const filas = clientes
    .map(hidratarCliente)
    .filter((c) => c.estado === 'activo')
    .map((c) => {
      const deHoy = c.prestamo.cuotas.find((q) => q.fecha === hoy)
      return {
        id: c.id,
        numeroControl: c.numeroControl,
        nombreCompleto: c.nombreCompleto,
        estadoCuota: deHoy?.estado ?? 'sin cuota hoy',
        monto: deHoy?.monto ?? 0,
        vencidas: c.prestamo.cuotas.filter((q) => q.estado === 'vencida').length,
        cliente: c,
      }
    })

  const columns: GridColDef<(typeof filas)[number]>[] = [
    { field: 'numeroControl', headerName: 'Control', width: 140 },
    { field: 'nombreCompleto', headerName: 'Cliente', flex: 1, minWidth: 160 },
    { field: 'estadoCuota', headerName: 'Estado', width: 130 },
    { field: 'monto', headerName: 'Monto', width: 120, valueFormatter: (v: number) => money(v) },
    { field: 'vencidas', headerName: 'Vencidas', width: 110 },
    {
      field: 'whatsapp',
      headerName: 'Aviso',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => <BotonWhatsAppCliente cliente={params.row.cliente as Cliente} compacto />,
    },
  ]

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h1">Cobranza del día</Typography>
        <Typography color="text.secondary">Lo que toca hoy y quién ya viene atrasado.</Typography>
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
          sx={{ border: 'none', cursor: 'pointer' }}
        />
      </Paper>
    </Stack>
  )
}
