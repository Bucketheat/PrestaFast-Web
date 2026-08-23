import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Card, CardContent, Paper, Stack, TextField, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { hoyIso } from '../domain/calendario'
import { money } from '../domain/calculo'
import { resumenCaja } from '../domain/caja'
import { hidratarCliente } from '../domain/operacion'
import { useCaja } from '../store/CajaProvider'
import { useCierres } from '../store/CierresProvider'
import { useClientes } from '../store/ClientesProvider'

const cajaSchema = z.object({
  capitalInicial: z.coerce.number().min(0, 'No puede ser negativo'),
  capitalYaPrestada: z.coerce.number().min(0, 'No puede ser negativo'),
})

type CajaForm = z.infer<typeof cajaSchema>

const columnas: GridColDef[] = [
  { field: 'numeroControl', headerName: 'Control', width: 140 },
  { field: 'nombre', headerName: 'Cliente', flex: 1, minWidth: 160 },
  { field: 'estado', headerName: 'Estado', width: 140 },
  {
    field: 'desembolso',
    headerName: 'Desembolso',
    width: 130,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => money(value),
  },
  { field: 'pagos', headerName: 'Pagos', width: 110 },
]

export function CajaPage() {
  const { caja, guardar } = useCaja()
  const { clientes } = useClientes()
  const { cierres } = useCierres()
  const resumen = resumenCaja(caja, clientes)
  const hoy = hoyIso()
  const cierresHoy = cierres.filter((item) => item.fecha === hoy)
  const entregaHoy = cierresHoy.reduce((suma, item) => suma + item.aEntregar, 0)
  const cambioHoy = cierresHoy.reduce((suma, item) => suma + (item.cambio ?? 0), 0)
  const form = useForm<CajaForm>({
    resolver: zodResolver(cajaSchema),
    defaultValues: {
      capitalInicial: caja.capitalInicial,
      capitalYaPrestada: caja.capitalYaPrestada,
    },
  })

  useEffect(() => {
    form.reset({
      capitalInicial: caja.capitalInicial,
      capitalYaPrestada: caja.capitalYaPrestada,
    })
  }, [caja, form])

  const filas = clientes.map(hidratarCliente).map((cliente) => ({
    id: cliente.id,
    numeroControl: cliente.numeroControl,
    nombre: cliente.nombreCompleto,
    estado: cliente.prestamo.estado === 'liquidado' ? 'Liquidado' : etiquetaEstado(cliente.estado),
    desembolso: cliente.prestamo.desembolso,
    pagos: `${cliente.prestamo.cuotas.filter((c) => c.estado === 'pagada').length}/${cliente.prestamo.plazoPagos}`,
  }))

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h1">Caja</Typography>
        <Typography color="text.secondary">
          Captura el capital con el que arrancas. La capital distribuida suma lo ya prestado y los desembolsos activos.
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
        {[
          ['Capital inicial', money(resumen.capitalInicial), 'Lo que hay en caja para prestar'],
          ['Capital distribuida', money(resumen.capitalDistribuida), 'Dinero que ya está en la calle'],
          ['Disponible', money(resumen.capitalDisponible), 'Lo que aún puedes desembolsar'],
          ['Cierres de hoy', money(entregaHoy), `Cambio ${money(cambioHoy)} · lo que deben entregar`],
        ].map(([label, value, hint]) => (
          <Card key={label} sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                {label}
              </Typography>
              <Typography variant="h2">{value}</Typography>
              <Typography variant="caption">{hint}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {resumen.capitalDisponible < 0 ? (
        <Alert severity="error">La capital distribuida ya rebasó el capital inicial. Revisa los montos o el ajuste.</Alert>
      ) : null}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={form.handleSubmit(guardar)}>
          <Stack spacing={2}>
            <Typography variant="h3">Establecer capital</Typography>
            <Controller
              name="capitalInicial"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Capital inicial"
                  type="number"
                  fullWidth
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? 'Efectivo o banco con el que opera la oficina'}
                />
              )}
            />
            <Controller
              name="capitalYaPrestada"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Capital ya prestada (antes del sistema)"
                  type="number"
                  fullWidth
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  error={Boolean(fieldState.error)}
                  helperText={
                    fieldState.error?.message ??
                    'Préstamos que ya estaban en la calle y aún no capturas como clientes'
                  }
                />
              )}
            />
            <Typography variant="body2" color="text.secondary">
              Distribuida del sistema: {money(resumen.distribuidaActiva)} · Por autorizar:{' '}
              {money(resumen.comprometida)} · Cobrado: {money(resumen.cobrado)}
            </Typography>
            <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
              Guardar capital
            </Button>
          </Stack>
        </form>
      </Paper>

      <Paper sx={{ p: 1 }}>
        <Typography variant="h3" sx={{ p: 1.5 }}>
          Desembolsos del sistema
        </Typography>
        <DataGrid
          rows={filas}
          columns={columnas}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none', minHeight: 240 }}
        />
      </Paper>
    </Stack>
  )
}

function etiquetaEstado(estado: string) {
  if (estado === 'pendiente_autorizacion') return 'Por autorizar'
  if (estado === 'bloqueado') return 'Bloqueado'
  if (estado === 'rechazado') return 'Rechazado'
  return 'Activo'
}
