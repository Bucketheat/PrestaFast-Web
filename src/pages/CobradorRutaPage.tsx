import { Alert, Button, Card, CardActions, CardContent, Chip, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import { BotonWhatsAppCliente } from '../components/BotonWhatsAppCliente'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hoyIso } from '../domain/calendario'
import { money } from '../domain/calculo'
import { cuentaCierreCaja, guardarCambioRuta, leerCambioRuta, resumenRutaDia } from '../domain/cierre'
import { ultimaCuotaCobrada } from '../domain/recibo'
import { useAuth } from '../store/AuthProvider'
import { useCierres } from '../store/CierresProvider'
import { useClientes } from '../store/ClientesProvider'

export function CobradorRutaPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { clientes, cobrar } = useClientes()
  const { cerrarRuta, cierreDeHoy } = useCierres()
  const hoy = hoyIso()
  const resumen = resumenRutaDia(clientes, usuario?.id, hoy)
  const cierre = usuario ? cierreDeHoy(usuario.id, hoy) : undefined
  const [notas, setNotas] = useState('')
  const [cambio, setCambio] = useState(() => (usuario ? leerCambioRuta(usuario.id, hoy) : 0))
  const [errorCierre, setErrorCierre] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const cuenta = cuentaCierreCaja(resumen.cobrado, resumen.desembolsado, cierre?.cambio ?? cambio)

  useEffect(() => {
    if (usuario) setCambio(leerCambioRuta(usuario.id, hoy))
  }, [usuario, hoy])

  async function onCobrar(clienteId: string) {
    const actualizado = await cobrar(clienteId)
    const cuota = ultimaCuotaCobrada(actualizado)
    if (cuota) navigate(`/recibo/${actualizado.id}/${cuota.numero}`)
  }

  async function onCerrar() {
    if (!usuario) return
    setErrorCierre('')
    setCerrando(true)
    try {
      await cerrarRuta({
        id: crypto.randomUUID(),
        fecha: hoy,
        cobradorId: usuario.id,
        cobradorNombre: usuario.nombre,
        visitasPendientes: resumen.visitasPendientes,
        esperado: resumen.esperado,
        cobrado: resumen.cobrado,
        desembolsado: resumen.desembolsado,
        cambio: cuenta.cambio,
        aEntregar: cuenta.aEntregar,
        notas,
        cerradoEn: new Date().toISOString(),
      })
    } catch (err) {
      setErrorCierre(err instanceof Error ? err.message : 'No se pudo cerrar la ruta')
    } finally {
      setCerrando(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack>
        <Typography variant="h1">Mi ruta</Typography>
        <Typography color="text.secondary">
          {resumen.visitas} visitas · {money(resumen.esperado)} por cobrar hoy
        </Typography>
      </Stack>

      <Grid container spacing={1.5}>
        {[
          ['Esperado', money(resumen.esperado)],
          ['Cobrado', money(resumen.cobrado)],
          ['Cambio', money(cuenta.cambio)],
          ['A entregar', money(cuenta.aEntregar)],
        ].map(([label, value]) => (
          <Grid key={label} size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="h3">{value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {resumen.pendientesAuth > 0 ? (
        <Alert severity="info">{resumen.pendientesAuth} alta(s) esperan autorización del administrador.</Alert>
      ) : null}

      <Button variant="contained" size="large" onClick={() => navigate('/clientes/nuevo')}>
        Registrar cliente
      </Button>

      {resumen.ruta.length === 0 ? (
        <Alert severity="success">No tienes pendientes de cobro en este momento.</Alert>
      ) : (
        resumen.ruta.map(({ cliente, vencidas, deHoy }) => (
          <Card key={cliente.id}>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h3">{cliente.nombreCompleto}</Typography>
                <Chip size="small" label={cliente.numeroControl} />
              </Stack>
              <Typography variant="body2">{cliente.domicilio}</Typography>
              <Typography sx={{ mt: 1 }}>
                Score {cliente.score} · {cliente.nivel}
              </Typography>
              {vencidas.length > 0 ? (
                <Typography color="error">{vencidas.length} vencida(s)</Typography>
              ) : null}
              {deHoy ? <Typography>Hoy: {money(deHoy.monto)}</Typography> : null}
            </CardContent>
            <CardActions>
              <Button variant="contained" onClick={() => void onCobrar(cliente.id)}>
                Cobrar
              </Button>
              <BotonWhatsAppCliente cliente={cliente} compacto />
              <Button onClick={() => navigate(`/clientes/${cliente.id}`)}>Ver control</Button>
            </CardActions>
          </Card>
        ))
      )}

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h3">Cambio para cobrar</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Billetes chicos que te da la oficina para dar cambio. Sin eso, un cliente que paga con $200 y debe $110 no se puede atender.
        </Typography>
        {cierre ? (
          <Typography variant="h2">{money(cierre.cambio)}</Typography>
        ) : (
          <TextField
            label="Cambio que te entregaron"
            type="number"
            value={cambio || ''}
            onChange={(event) => {
              const monto = Math.max(0, Number(event.target.value) || 0)
              setCambio(monto)
              if (usuario) guardarCambioRuta(usuario.id, hoy, monto)
            }}
            helperText="Efectivo de cambio. Se suma al cierre y lo devuelves al final."
            fullWidth
          />
        )}
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h3">Cierre del día</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Cuenta de caja: cambio + cobrado − desembolsado = lo que entregas.
        </Typography>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography>Cambio que llevaste: {money(cuenta.cambio)}</Typography>
          <Typography>+ Cobrado: {money(cuenta.cobrado)}</Typography>
          <Typography>− Desembolsado: {money(cuenta.desembolsado)}</Typography>
          <Typography variant="h3">Debes entregar {money(cuenta.aEntregar)}</Typography>
        </Stack>
        {cierre ? (
          <Alert severity="success">
            Ruta cerrada. Cambio {money(cierre.cambio)} · cobrado {money(cierre.cobrado)} · a entregar {money(cierre.aEntregar)}.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <TextField
              label="Notas (faltantes, promesas, etc.)"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            {errorCierre ? <Alert severity="error">{errorCierre}</Alert> : null}
            <Button variant="contained" color="secondary" disabled={cerrando} onClick={() => void onCerrar()}>
              {cerrando ? 'Cerrando…' : 'Cerrar ruta y entregar caja'}
            </Button>
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}
