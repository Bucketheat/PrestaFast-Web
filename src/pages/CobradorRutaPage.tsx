import { Alert, Button, Card, CardActions, CardContent, Chip, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hoyIso } from '../domain/calendario'
import { money } from '../domain/calculo'
import { resumenRutaDia } from '../domain/cierre'
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
  const [errorCierre, setErrorCierre] = useState('')
  const [cerrando, setCerrando] = useState(false)

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
        aEntregar: resumen.aEntregar,
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
          ['Desembolsado', money(resumen.desembolsado)],
          ['A entregar', money(resumen.aEntregar)],
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
              <Button onClick={() => navigate(`/clientes/${cliente.id}`)}>Ver control</Button>
            </CardActions>
          </Card>
        ))
      )}

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h3">Cierre del día</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Al terminar la ruta, registra cuánto cobraste y cuánto debes entregar.
        </Typography>
        {cierre ? (
          <Alert severity="success">
            Ruta cerrada. Cobrado {money(cierre.cobrado)} · a entregar {money(cierre.aEntregar)}.
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
