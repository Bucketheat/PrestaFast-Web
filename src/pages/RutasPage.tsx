import { Alert, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { formatFechaLarga } from '../domain/calendario'
import { money } from '../domain/calculo'
import { useCierres } from '../store/CierresProvider'

const columnas: GridColDef[] = [
  { field: 'fecha', headerName: 'Fecha', width: 160, valueFormatter: (v: string) => formatFechaLarga(v) },
  { field: 'cobradorNombre', headerName: 'Cobrador', flex: 1, minWidth: 160 },
  { field: 'esperado', headerName: 'Esperado', width: 120, valueFormatter: (v: number) => money(v) },
  { field: 'cobrado', headerName: 'Cobrado', width: 120, valueFormatter: (v: number) => money(v) },
  { field: 'desembolsado', headerName: 'Desembolsado', width: 140, valueFormatter: (v: number) => money(v) },
  { field: 'aEntregar', headerName: 'A entregar', width: 130, valueFormatter: (v: number) => money(v) },
  { field: 'visitasPendientes', headerName: 'Pendientes', width: 120 },
  { field: 'notas', headerName: 'Notas', flex: 1, minWidth: 160 },
]

export function RutasPage() {
  const { cierres } = useCierres()

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h1">Cierres de ruta</Typography>
        <Typography color="text.secondary">
          Lo que cada cobrador cobró, desembolsó y debe entregar al terminar el día.
        </Typography>
      </Stack>

      {cierres.length === 0 ? (
        <Alert severity="info">Aún no hay cierres. El cobrador los registra desde Mi ruta.</Alert>
      ) : (
        <Paper sx={{ p: 1 }}>
          <DataGrid rows={cierres} columns={columnas} autoHeight disableRowSelectionOnClick sx={{ border: 'none' }} />
        </Paper>
      )}
    </Stack>
  )
}
