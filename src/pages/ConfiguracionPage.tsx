import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { TabuladorPreview } from '../components/TabuladorPreview'
import { parametrosSchema, planSchema, type ParametrosFormValues, type PlanFormValues } from '../domain/schemas'
import type { PlanCobro } from '../domain/types'
import { useConfig } from '../store/ConfigProvider'

function nuevoId() {
  return `plan-${crypto.randomUUID().slice(0, 8)}`
}

export function ConfiguracionPage() {
  const { config, guardarParametros, guardarPlan, eliminarPlan, restaurar } = useConfig()
  const defaultPlan = config.planes.find((plan) => plan.esDefault) ?? config.planes[0]

  const parametrosForm = useForm<ParametrosFormValues>({
    resolver: zodResolver(parametrosSchema),
    defaultValues: config.parametros,
  })

  const planForm = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: defaultPlan,
  })

  const parametrosVivos = useWatch({ control: parametrosForm.control })
  const planVivo = useWatch({ control: planForm.control })

  useEffect(() => {
    parametrosForm.reset(config.parametros)
  }, [config.parametros, parametrosForm])

  const previewPlan = useMemo<PlanCobro>(
    () => ({
      id: planVivo.id ?? 'preview',
      codigo: planVivo.codigo || 'PREVIEW',
      nombre: planVivo.nombre || 'Vista previa',
      cuotaPorMil: Number(planVivo.cuotaPorMil) || 0,
      plazoPagos: Number(planVivo.plazoPagos) || 1,
      cobraDomingo: Boolean(planVivo.cobraDomingo),
      activo: Boolean(planVivo.activo),
      esDefault: Boolean(planVivo.esDefault),
    }),
    [planVivo],
  )

  const previewParametros = {
    cupoInicial: Number(parametrosVivos.cupoInicial) || config.parametros.cupoInicial,
    topePagare: Number(parametrosVivos.topePagare) || config.parametros.topePagare,
    desembolsoMultiplo: Number(parametrosVivos.desembolsoMultiplo) || 1000,
    milesMinimos: Number(parametrosVivos.milesMinimos) || 1,
    milesMaximos: Number(parametrosVivos.milesMaximos) || 10,
    horaCierre: parametrosVivos.horaCierre || '21:00',
  }

  function cargarPlan(plan: PlanCobro) {
    planForm.reset(plan)
  }

  function crearPlan() {
    planForm.reset({
      id: nuevoId(),
      codigo: '',
      nombre: '',
      cuotaPorMil: 55,
      plazoPagos: 30,
      cobraDomingo: false,
      activo: true,
      esDefault: false,
    })
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Stack>
          <Typography variant="h1">Planes y parámetros</Typography>
          <Typography color="text.secondary">
            Cambia la cuota por mil, el plazo o si se cobra domingo. A la derecha ves cómo queda el tabulador.
          </Typography>
        </Stack>
        <Button color="inherit" onClick={restaurar}>
          Restaurar valores iniciales
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Parámetros del sistema
              </Typography>
              <Box
                component="form"
                onSubmit={parametrosForm.handleSubmit((values) => guardarParametros(values))}
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Cupo inicial"
                      type="number"
                      fullWidth
                      {...parametrosForm.register('cupoInicial')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Tope de pagaré"
                      type="number"
                      fullWidth
                      {...parametrosForm.register('topePagare')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Múltiplo de desembolso"
                      type="number"
                      fullWidth
                      {...parametrosForm.register('desembolsoMultiplo')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Hora de cierre"
                      type="time"
                      fullWidth
                      {...parametrosForm.register('horaCierre')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Miles mínimos"
                      type="number"
                      fullWidth
                      {...parametrosForm.register('milesMinimos')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Miles máximos"
                      type="number"
                      fullWidth
                      {...parametrosForm.register('milesMaximos')}
                    />
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                  Guardar parámetros
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 2.5 }}>
              <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h3">Planes de cobro</Typography>
                <Button onClick={crearPlan}>Nuevo plan</Button>
              </Stack>
              <Stack direction="row" sx={{ mb: 2, gap: 1, flexWrap: 'wrap' }}>
                {config.planes.map((plan) => (
                  <Button
                    key={plan.id}
                    size="small"
                    variant={planForm.getValues('id') === plan.id ? 'contained' : 'outlined'}
                    onClick={() => cargarPlan(plan)}
                  >
                    {plan.nombre} ${plan.cuotaPorMil}
                  </Button>
                ))}
              </Stack>
              <Box component="form" onSubmit={planForm.handleSubmit((values) => {
                guardarPlan({
                  id: values.id ?? nuevoId(),
                  codigo: values.codigo,
                  nombre: values.nombre,
                  cuotaPorMil: values.cuotaPorMil,
                  plazoPagos: values.plazoPagos,
                  cobraDomingo: values.cobraDomingo,
                  activo: values.activo,
                  esDefault: values.esDefault,
                })
              })}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Nombre" fullWidth {...planForm.register('nombre')} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Código" fullWidth {...planForm.register('codigo')} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Cuota por cada mil"
                      type="number"
                      fullWidth
                      {...planForm.register('cuotaPorMil')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Número de pagos"
                      type="number"
                      fullWidth
                      {...planForm.register('plazoPagos')}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Controller
                      name="cobraDomingo"
                      control={planForm.control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Checkbox checked={field.value} onChange={field.onChange} />}
                          label="Cobrar los domingos"
                        />
                      )}
                    />
                    <Controller
                      name="esDefault"
                      control={planForm.control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Checkbox checked={field.value} onChange={field.onChange} />}
                          label="Plan por defecto"
                        />
                      )}
                    />
                    <Controller
                      name="activo"
                      control={planForm.control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Checkbox checked={field.value} onChange={field.onChange} />}
                          label="Activo"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" sx={{ mt: 2, gap: 1 }}>
                  <Button type="submit" variant="contained">
                    Guardar plan
                  </Button>
                  {planForm.getValues('id') && config.planes.length > 1 ? (
                    <Button color="error" onClick={() => eliminarPlan(String(planForm.getValues('id')))}>
                      Eliminar
                    </Button>
                  ) : null}
                </Stack>
              </Box>
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <TabuladorPreview
            plan={previewPlan}
            parametros={previewParametros}
            title="Así quedaría el tabulador"
          />
        </Grid>
      </Grid>
    </Stack>
  )
}
