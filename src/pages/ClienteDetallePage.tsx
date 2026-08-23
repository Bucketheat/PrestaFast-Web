import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import { Alert, Box, Button, Chip, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarioPreview } from '../components/CalendarioPreview'
import { formatFechaLarga, generarCalendarioPagos, hoyIso, siguienteFolio } from '../domain/calendario'
import { money, planPorDefecto, simularPrestamo } from '../domain/calculo'
import { descargarControl } from '../domain/controlDigital'
import type { EstadoPrestamo } from '../domain/cliente'
import { ultimaCuotaCobrada } from '../domain/recibo'
import { useAuth } from '../store/AuthProvider'
import { useClientes } from '../store/ClientesProvider'
import { useConfig } from '../store/ConfigProvider'

export function ClienteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { clientes, buscarPorId, cargarDetalle, aprobar, rechazar, cobrar, renovar } = useClientes()
  const { config } = useConfig()
  const cliente = id ? buscarPorId(id) : undefined
  const planInicial = planPorDefecto(config.planes)
  const [planId, setPlanId] = useState(planInicial.id)
  const [desembolso, setDesembolso] = useState(config.parametros.cupoInicial)
  const [errorRenovacion, setErrorRenovacion] = useState('')

  useEffect(() => {
    if (id) void cargarDetalle(id)
    // Solo al abrir el expediente; evita recargar en cada hidratación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const plan = config.planes.find((item) => item.id === planId) ?? planInicial
  const simulacion = useMemo(() => simularPrestamo(Number(desembolso) || 0, plan), [desembolso, plan])

  if (!cliente) {
    return (
      <Stack spacing={2}>
        <Typography variant="h1">Cliente no encontrado</Typography>
        <Button onClick={() => navigate('/clientes')}>Volver</Button>
      </Stack>
    )
  }

  const expediente = cliente
  const ine = expediente.documentos.find((doc) => doc.tipo === 'ine_frente')
  const pagare = expediente.documentos.find((doc) => doc.tipo === 'pagare')
  const evidencia = expediente.documentos.find((doc) => doc.tipo === 'evidencia_domicilio')
  const liquidado = expediente.prestamo.estado === 'liquidado'

  async function onCobrar() {
    const actualizado = await cobrar(expediente.id)
    const cuota = ultimaCuotaCobrada(actualizado)
    if (cuota) navigate(`/recibo/${actualizado.id}/${cuota.numero}`)
  }

  async function onRenovar() {
    setErrorRenovacion('')
    if (desembolso % config.parametros.desembolsoMultiplo !== 0) {
      setErrorRenovacion(`Debe ser múltiplo de ${config.parametros.desembolsoMultiplo}`)
      return
    }
    if (desembolso > config.parametros.topePagare) {
      setErrorRenovacion('No puede pasar el tope del pagaré')
      return
    }
    const calendario = generarCalendarioPagos(hoyIso(), plan, simulacion.cuotaDiaria)
    const estadoNuevo: EstadoPrestamo = usuario?.rol === 'cobrador' ? 'pendiente_autorizacion' : 'activo'
    const folios = [
      ...clientes.map((item) => item.prestamo.folio),
      ...clientes.flatMap((item) => (item.prestamosAnteriores ?? []).map((prestamo) => prestamo.folio)),
    ]
    try {
      await renovar(
        expediente.id,
        {
          id: crypto.randomUUID(),
          folio: siguienteFolio('PRE', folios),
          planId: plan.id,
          planNombre: plan.nombre,
          cuotaPorMil: plan.cuotaPorMil,
          plazoPagos: plan.plazoPagos,
          cobraDomingo: plan.cobraDomingo,
          desembolso: simulacion.desembolso,
          cuotaDiaria: simulacion.cuotaDiaria,
          total: simulacion.total,
          cargo: simulacion.cargo,
          fechaDesembolso: hoyIso(),
          fechaPrimerCobro: calendario[0]?.fecha ?? hoyIso(),
          estado: estadoNuevo,
          cuotas: calendario,
        },
        { pagareMonto: Math.max(expediente.pagareMonto, simulacion.desembolso), pagareFecha: hoyIso() },
      )
    } catch (err) {
      setErrorRenovacion(err instanceof Error ? err.message : 'No se pudo renovar')
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Stack>
          <Typography color="text.secondary">Número de control</Typography>
          <Typography variant="h1">{cliente.numeroControl}</Typography>
          <Typography>{cliente.nombreCompleto}</Typography>
          <Stack direction="row" sx={{ gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Chip label={`Score ${cliente.score}`} color={cliente.score >= 65 ? 'success' : cliente.score < 40 ? 'error' : 'warning'} />
            <Chip label={cliente.nivel} />
            <Chip label={cliente.estado} color={cliente.estado === 'pendiente_autorizacion' ? 'warning' : 'default'} />
          </Stack>
        </Stack>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {usuario?.rol === 'admin' && cliente.estado === 'pendiente_autorizacion' ? (
            <>
              <Button variant="contained" onClick={() => aprobar(cliente.id)}>Aprobar alta</Button>
              <Button color="error" onClick={() => rechazar(cliente.id)}>Rechazar</Button>
            </>
          ) : null}
          {cliente.estado === 'activo' ? (
            <Button variant="contained" color="secondary" onClick={() => void onCobrar()}>
              Registrar cobro
            </Button>
          ) : null}
          <Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={() => descargarControl(cliente)}>
            Descargar control
          </Button>
          <Button variant="outlined" startIcon={<PrintOutlinedIcon />} onClick={() => navigate(`/control/${cliente.id}`)}>
            Imprimir / PDF
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Stack spacing={1}>
              <Chip label={cliente.prestamo.estado} color="primary" sx={{ alignSelf: 'flex-start' }} />
              <Typography><strong>Teléfono:</strong> {cliente.telefono}</Typography>
              <Typography><strong>INE:</strong> {cliente.ineNumero}</Typography>
              <Typography>
                <strong>Domicilio:</strong>{' '}
                {[cliente.domicilio, cliente.colonia, cliente.municipio, cliente.entidadFederativa, cliente.codigoPostal ? `CP ${cliente.codigoPostal}` : '']
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
              <Typography><strong>Ruta:</strong> {cliente.zona}</Typography>
              <Typography><strong>Pagaré:</strong> {money(cliente.pagareMonto)}</Typography>
              <Typography><strong>Desembolso:</strong> {formatFechaLarga(cliente.prestamo.fechaDesembolso)}</Typography>
              <Typography><strong>Cuota:</strong> {money(cliente.prestamo.cuotaDiaria)} × {cliente.prestamo.plazoPagos}</Typography>
              <Typography><strong>Total:</strong> {money(cliente.prestamo.total)}</Typography>
              <Typography variant="body2" color="text.secondary">
                El admin lo sigue aquí. El cobrador lo verá en la app con el mismo número de control.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="h3" sx={{ mb: 1 }}>INE</Typography>
            {ine?.dataUrl.startsWith('data:image') ? (
              <Box component="img" src={ine.dataUrl} alt="INE" sx={{ width: '100%', borderRadius: 1 }} />
            ) : (
              <Typography color="text.secondary">Sin imagen</Typography>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Pagaré</Typography>
            {pagare?.dataUrl.startsWith('data:image') ? (
              <Box component="img" src={pagare.dataUrl} alt="Pagaré" sx={{ width: '100%', borderRadius: 1 }} />
            ) : (
              <Typography color="text.secondary">Archivo cargado en el expediente</Typography>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Evidencia frente a la casa</Typography>
            {evidencia?.dataUrl.startsWith('data:image') ? (
              <Box component="img" src={evidencia.dataUrl} alt="Cliente frente a su casa" sx={{ width: '100%', borderRadius: 1 }} />
            ) : (
              <Typography color="text.secondary">Sin foto de registro en el domicilio</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {liquidado ? (
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h3">Renovar préstamo</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Ya liquidó. Mismo cliente y número de control; nuevo folio y 30 pagos.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select label="Plan" value={planId} onChange={(event) => setPlanId(String(event.target.value))}>
                  {config.planes.filter((item) => item.activo).map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nombre} · ${item.cuotaPorMil}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Nuevo desembolso"
                type="number"
                fullWidth
                value={desembolso}
                onChange={(event) => setDesembolso(Number(event.target.value))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Alert severity="info">
                Cuota {money(simulacion.cuotaDiaria)} · total {money(simulacion.total)}
              </Alert>
            </Grid>
          </Grid>
          {errorRenovacion ? <Alert severity="error" sx={{ mt: 2 }}>{errorRenovacion}</Alert> : null}
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => void onRenovar()}>
            {usuario?.rol === 'cobrador' ? 'Enviar renovación' : 'Renovar y desembolsar'}
          </Button>
        </Paper>
      ) : null}

      {(cliente.prestamosAnteriores?.length ?? 0) > 0 ? (
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h3">Préstamos anteriores</Typography>
          {cliente.prestamosAnteriores?.map((prestamo) => (
            <Typography key={prestamo.id} sx={{ mt: 1 }}>
              {prestamo.folio} · {money(prestamo.desembolso)} · {prestamo.estado}
            </Typography>
          ))}
        </Paper>
      ) : null}

      <CalendarioPreview cuotas={cliente.prestamo.cuotas} title="Calendario de pagos diarios" />
    </Stack>
  )
}
