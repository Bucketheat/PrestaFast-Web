import { Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { formatFechaLarga } from '../domain/calendario'
import { money } from '../domain/calculo'
import type { CuotaCliente } from '../domain/cliente'

const columns: GridColDef[] = [
  { field: 'numero', headerName: '#', width: 70, align: 'right', headerAlign: 'right' },
  {
    field: 'fecha',
    headerName: 'Fecha de cobro',
    flex: 1,
    minWidth: 220,
    valueFormatter: (value: string) => formatFechaLarga(value),
  },
  {
    field: 'monto',
    headerName: 'Cuota',
    width: 130,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => money(value),
  },
]

type Props = {
  cuotas: CuotaCliente[]
  title?: string
}

export function CalendarioPreview({ cuotas, title = 'Pagos diarios calculados' }: Props) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <Typography variant="h3">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          El día del desembolso no se cobra. El primer pago es el siguiente día de cobro según el plan.
        </Typography>
        <DataGrid
          rows={cuotas.map((cuota) => ({ id: cuota.numero, ...cuota }))}
          columns={columns}
          hideFooter
          disableRowSelectionOnClick
          sx={{ border: 'none', minHeight: 360 }}
        />
      </Stack>
    </Paper>
  )
}
