import { Chip, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { generarTabulador, money } from '../domain/calculo'
import type { ParametrosSistema, PlanCobro } from '../domain/types'

const columns: GridColDef[] = [
  { field: 'miles', headerName: 'Miles', width: 90, align: 'right', headerAlign: 'right' },
  {
    field: 'desembolso',
    headerName: 'Desembolso',
    flex: 1,
    minWidth: 130,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => money(value),
  },
  {
    field: 'cuotaDiaria',
    headerName: 'Cuota diaria',
    flex: 1,
    minWidth: 130,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => money(value),
  },
  { field: 'pagos', headerName: 'Pagos', width: 90, align: 'right', headerAlign: 'right' },
  {
    field: 'total',
    headerName: 'Total a recuperar',
    flex: 1,
    minWidth: 150,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => money(value),
  },
  {
    field: 'cargo',
    headerName: 'Cargo',
    flex: 1,
    minWidth: 120,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => money(value),
  },
]

type Props = {
  plan: PlanCobro
  parametros: ParametrosSistema
  title?: string
}

export function TabuladorPreview({ plan, parametros, title = 'Vista previa del tabulador' }: Props) {
  const rows = generarTabulador(plan, parametros)
  const filaInicio = rows.find((row) => row.desembolso === parametros.cupoInicial)

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h3">{title}</Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={`${plan.nombre} · $${plan.cuotaPorMil} por mil`} color="primary" />
            <Chip size="small" label={`${plan.plazoPagos} pagos`} />
            <Chip size="small" label={plan.cobraDomingo ? 'Cobra domingo' : 'No cobra domingo'} />
          </Stack>
        </Stack>
        {filaInicio ? (
          <Typography variant="body2" color="text.secondary">
            Cliente nuevo ({money(parametros.cupoInicial)}): cuota {money(filaInicio.cuotaDiaria)} · total{' '}
            {money(filaInicio.total)} · cargo {money(filaInicio.cargo)}
          </Typography>
        ) : null}
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          hideFooter
          getRowClassName={(params) =>
            params.row.desembolso === parametros.cupoInicial ? 'fila-inicio' : ''
          }
          sx={{
            border: 'none',
            minHeight: 420,
            '& .fila-inicio': {
              bgcolor: 'rgba(15, 61, 62, 0.08)',
              fontWeight: 700,
            },
          }}
        />
      </Stack>
    </Paper>
  )
}
