import { Alert, Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { MapaClientes } from '../components/MapaClientes'
import { money } from '../domain/calculo'
import { resumenCaja } from '../domain/caja'
import { estadisticasCartera, generarAlertas, hidratarCliente } from '../domain/operacion'
import { useGeocodificarClientes } from '../hooks/useGeocodificarClientes'
import { useCaja } from '../store/CajaProvider'
import { useClientes } from '../store/ClientesProvider'

const columnasScore: GridColDef[] = [
  { field: 'numeroControl', headerName: 'Control', width: 140 },
  { field: 'nombreCompleto', headerName: 'Cliente', flex: 1, minWidth: 160 },
  { field: 'score', headerName: 'Score', width: 90, align: 'right', headerAlign: 'right' },
  { field: 'nivel', headerName: 'Nivel', width: 120 },
  { field: 'puntualidad', headerName: 'Puntualidad', width: 120, valueFormatter: (v: number) => `${v}%` },
  { field: 'vencidas', headerName: 'Vencidas', width: 100, align: 'right', headerAlign: 'right' },
  { field: 'estado', headerName: 'Estado', width: 160 },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { clientes, actualizar } = useClientes()
  const { caja } = useCaja()
  const hidratados = clientes.map(hidratarCliente)
  const stats = estadisticasCartera(hidratados)
  const cajaResumen = resumenCaja(caja, hidratados)
  const alertas = generarAlertas(hidratados)
  const altas = alertas.filter((a) => a.severidad === 'alta').length
  const geocodificando = useGeocodificarClientes(hidratados, actualizar)

  const filasScore = hidratados.map((cliente) => ({
    id: cliente.id,
    numeroControl: cliente.numeroControl,
    nombreCompleto: cliente.nombreCompleto,
    score: cliente.score,
    nivel: cliente.nivel,
    puntualidad: Math.round(
      (cliente.prestamo.cuotas.filter((c) => c.estado === 'pagada').length /
        Math.max(1, cliente.prestamo.cuotas.filter((c) => c.estado !== 'programada').length)) *
        100,
    ),
    vencidas: cliente.prestamo.cuotas.filter((c) => c.estado === 'vencida').length,
    estado: cliente.estado,
  }))

  const chartNiveles = ['nuevo', 'regular', 'bueno', 'confiable', 'excelente'].map((nivel) => ({
    nivel,
    clientes: hidratados.filter((c) => c.nivel === nivel).length,
  }))

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h1">Tablero</Typography>
        <Typography color="text.secondary">
          Alertas, vencidos, scores y lo que el cobrador mande a autorización.
        </Typography>
      </Stack>

      {altas > 0 ? (
        <Alert severity="error">{altas} alerta(s) alta(s): autorizaciones, INE o atrasos graves.</Alert>
      ) : null}

      <Grid container spacing={2}>
        {[
          ['Clientes', stats.clientes, 'Con número de control'],
          ['Activos', stats.activos, 'En cobranza'],
          ['Por autorizar', stats.pendientes, 'Altas del cobrador'],
          ['Con atraso', stats.vencidos, 'Al menos una cuota vencida'],
          ['Esperado hoy', money(stats.esperadoHoy), 'Por cobrar'],
          ['Cobrado hoy', money(stats.cobradoHoy), 'Ya registrado'],
          ['Saldo vencido', money(stats.vencido), 'Arrastre'],
          ['Score promedio', stats.scorePromedio, 'Confianza de cartera'],
        ].map(([label, value, hint]) => (
          <Grid key={String(label)} size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{label}</Typography>
                <Typography variant="h2">{value}</Typography>
                <Typography variant="caption">{hint}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {[
          ['Capital inicial', money(cajaResumen.capitalInicial), 'Caja de la oficina'],
          ['Capital distribuida', money(cajaResumen.capitalDistribuida), 'Dinero en la calle'],
          ['Disponible', money(cajaResumen.capitalDisponible), 'Para nuevos desembolsos'],
        ].map(([label, value, hint]) => (
          <Grid key={String(label)} size={{ xs: 12, md: 4 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/caja')}>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{label}</Typography>
                <Typography variant="h2">{value}</Typography>
                <Typography variant="caption">{hint}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.5, minHeight: 360 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Alertas</Typography>
            <Stack spacing={1} sx={{ maxHeight: 420, overflow: 'auto' }}>
              {alertas.length === 0 ? (
                <Typography color="text.secondary">No hay alertas. La cartera está al corriente.</Typography>
              ) : (
                alertas.map((alerta) => (
                  <Alert
                    key={alerta.id}
                    severity={alerta.severidad === 'alta' ? 'error' : alerta.severidad === 'media' ? 'warning' : 'info'}
                    action={
                      alerta.clienteId ? (
                        <Button color="inherit" size="small" onClick={() => navigate(`/clientes/${alerta.clienteId}`)}>
                          Ver
                        </Button>
                      ) : undefined
                    }
                  >
                    <strong>{alerta.titulo}</strong> — {alerta.detalle}
                  </Alert>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.5, height: 360 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Clientes por nivel de score</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartNiveles}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nivel" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="clientes" fill="#0f3d3e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.5 }}>
        <MapaClientes clientes={hidratados} geocodificando={geocodificando} />
      </Paper>

      <Paper sx={{ p: 1 }}>
        <Stack direction="row" sx={{ p: 1.5, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h3">Score por cliente</Typography>
          <Chip label={`${hidratados.length} registros`} />
        </Stack>
        <DataGrid
          rows={filasScore}
          columns={columnasScore}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/clientes/${params.id}`)}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none', cursor: 'pointer' }}
        />
      </Paper>

      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        <Button component={RouterLink} to="/autorizaciones" variant="contained">Ver autorizaciones</Button>
        <Button component={RouterLink} to="/clientes/nuevo" variant="outlined">Registrar cliente</Button>
      </Stack>
    </Stack>
  )
}
