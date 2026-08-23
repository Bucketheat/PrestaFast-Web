import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { CalendarioPreview } from '../components/CalendarioPreview'
import { CamposDomicilio } from '../components/CamposDomicilio'
import { CargaArchivo } from '../components/CargaArchivo'
import { MapaPinRegistro } from '../components/MapaPinRegistro'
import { generarCalendarioPagos, hoyIso, siguienteFolio } from '../domain/calendario'
import { money, planPorDefecto, simularPrestamo } from '../domain/calculo'
import type { Cliente, DocumentoCliente, EstadoCliente, EstadoPrestamo } from '../domain/cliente'
import { formatearVigenciaIne } from '../domain/ine'
import { clienteAltaSchema, type ClienteAltaValues } from '../domain/schemas'
import { useAuth } from '../store/AuthProvider'
import { direccionCompleta, geocodificarDireccion } from '../domain/ubicacion'
import { useClientes } from '../store/ClientesProvider'
import { useConfig } from '../store/ConfigProvider'

export function ClienteNuevoPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { config } = useConfig()
  const { clientes, registrar, ineDuplicada } = useClientes()
  const esCobrador = usuario?.rol === 'cobrador'
  const planInicial = planPorDefecto(config.planes)
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([])
  const [errorDocs, setErrorDocs] = useState('')

  const form = useForm<ClienteAltaValues>({
    resolver: zodResolver(clienteAltaSchema),
    defaultValues: {
      nombreCompleto: '',
      fechaNacimiento: '',
      telefono: '',
      codigoPostal: '',
      entidadFederativa: '',
      municipio: '',
      colonia: '',
      domicilio: '',
      referenciasUbicacion: '',
      zona: '',
      ineNumero: '',
      ineAnioEmision: 2023,
      ineAnioVigencia: 2033,
      pagareMonto: config.parametros.topePagare,
      pagareFecha: hoyIso(),
      referencia1Nombre: '',
      referencia1Parentesco: '',
      referencia1Telefono: '',
      referencia2Nombre: '',
      referencia2Parentesco: '',
      referencia2Telefono: '',
      planId: planInicial.id,
      desembolso: config.parametros.cupoInicial,
      fechaDesembolso: hoyIso(),
      latitud: undefined,
      longitud: undefined,
    },
  })

  const valores = useWatch({ control: form.control })
  const plan = config.planes.find((item) => item.id === valores.planId) ?? planInicial
  const desembolso = Number(valores.desembolso) || 0
  const simulacion = simularPrestamo(desembolso, plan)
  const cuotas = useMemo(
    () =>
      valores.fechaDesembolso
        ? generarCalendarioPagos(valores.fechaDesembolso, plan, simulacion.cuotaDiaria)
        : [],
    [valores.fechaDesembolso, plan, simulacion.cuotaDiaria],
  )

  function setDocumento(documento: DocumentoCliente) {
    setDocumentos((actual) => [...actual.filter((item) => item.tipo !== documento.tipo), documento])
    setErrorDocs('')
  }

  async function onSubmit(values: ClienteAltaValues) {
    const ineFrente = documentos.find((doc) => doc.tipo === 'ine_frente')
    const pagare = documentos.find((doc) => doc.tipo === 'pagare')
    if (!ineFrente || !pagare) {
      setErrorDocs('Carga la INE (frente) y el pagaré antes de desembolsar.')
      return
    }
    if (ineDuplicada(values.ineNumero)) {
      form.setError('ineNumero', { message: 'Esa INE ya está registrada' })
      return
    }
    if (values.desembolso % config.parametros.desembolsoMultiplo !== 0) {
      form.setError('desembolso', { message: `Debe ser múltiplo de ${config.parametros.desembolsoMultiplo}` })
      return
    }
    if (values.desembolso > config.parametros.topePagare) {
      form.setError('desembolso', { message: 'No puede pasar el tope del pagaré' })
      return
    }

    const id = crypto.randomUUID()
    const numeroControl = siguienteFolio('NC', clientes.map((item) => item.numeroControl))
    const folioPrestamo = siguienteFolio('PRE', clientes.map((item) => item.prestamo.folio))
    const calendario = generarCalendarioPagos(values.fechaDesembolso, plan, simulacion.cuotaDiaria)
    const estadoAlta: EstadoCliente & EstadoPrestamo = esCobrador ? 'pendiente_autorizacion' : 'activo'
    const coords =
      Number.isFinite(values.latitud) && Number.isFinite(values.longitud)
        ? { latitud: values.latitud as number, longitud: values.longitud as number }
        : await geocodificarDireccion(
            direccionCompleta({
              domicilio: values.domicilio,
              colonia: values.colonia,
              municipio: values.municipio,
              entidadFederativa: values.entidadFederativa,
              codigoPostal: values.codigoPostal,
            }),
          )

    const nuevo: Cliente = {
      id,
      numeroControl,
      nombreCompleto: values.nombreCompleto,
      fechaNacimiento: values.fechaNacimiento,
      telefono: values.telefono,
      codigoPostal: values.codigoPostal,
      entidadFederativa: values.entidadFederativa,
      municipio: values.municipio,
      colonia: values.colonia,
      domicilio: values.domicilio,
      referenciasUbicacion: values.referenciasUbicacion,
      zona: values.zona,
      latitud: coords?.latitud,
      longitud: coords?.longitud,
      ineNumero: values.ineNumero,
      ineVigencia: formatearVigenciaIne(values.ineAnioEmision, values.ineAnioVigencia),
      pagareMonto: values.pagareMonto,
      pagareFecha: values.pagareFecha,
      documentos,
      referencias: [
        {
          nombre: values.referencia1Nombre ?? '',
          parentesco: values.referencia1Parentesco ?? '',
          telefono: values.referencia1Telefono ?? '',
        },
        {
          nombre: values.referencia2Nombre ?? '',
          parentesco: values.referencia2Parentesco ?? '',
          telefono: values.referencia2Telefono ?? '',
        },
      ].filter((ref) => ref.nombre.trim()),
      prestamo: {
        id: crypto.randomUUID(),
        folio: folioPrestamo,
        planId: plan.id,
        planNombre: plan.nombre,
        cuotaPorMil: plan.cuotaPorMil,
        plazoPagos: plan.plazoPagos,
        cobraDomingo: plan.cobraDomingo,
        desembolso: simulacion.desembolso,
        cuotaDiaria: simulacion.cuotaDiaria,
        total: simulacion.total,
        cargo: simulacion.cargo,
        fechaDesembolso: values.fechaDesembolso,
        fechaPrimerCobro: calendario[0]?.fecha ?? values.fechaDesembolso,
        estado: estadoAlta,
        cuotas: calendario,
      },
      estado: estadoAlta,
      score: 50,
      nivel: 'nuevo',
      cobradorId: usuario?.id,
      capturadoPor: usuario?.nombre,
      creadoEn: new Date().toISOString(),
    }

    try {
      await registrar(nuevo)
      navigate(esCobrador ? '/ruta' : `/clientes/${id}`)
    } catch (err) {
      setErrorDocs(err instanceof Error ? err.message : 'No se pudo guardar el cliente cifrado')
    }
  }

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h1">Registrar cliente</Typography>
        <Typography color="text.secondary">
          {esCobrador
            ? 'El alta llegará al administrador para que la autorice. Fija el pin en el mapa, carga INE, pagaré y la fecha de desembolso.'
            : 'Fija el pin del domicilio, carga INE y pagaré. El sistema arma los pagos diarios y el número de control.'}
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.5 }}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Stack spacing={2.5}>
                <Typography variant="h3">Datos del cliente</Typography>
                <TextField label="Nombre completo" fullWidth {...form.register('nombreCompleto')} error={Boolean(form.formState.errors.nombreCompleto)} helperText={form.formState.errors.nombreCompleto?.message} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Fecha de nacimiento" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} {...form.register('fechaNacimiento')} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Teléfono" fullWidth {...form.register('telefono')} />
                  </Grid>
                </Grid>
                <CamposDomicilio control={form.control} setValue={form.setValue} />
                <MapaPinRegistro
                  latitud={valores.latitud}
                  longitud={valores.longitud}
                  domicilio={valores.domicilio ?? ''}
                  colonia={valores.colonia ?? ''}
                  municipio={valores.municipio ?? ''}
                  entidadFederativa={valores.entidadFederativa ?? ''}
                  codigoPostal={valores.codigoPostal ?? ''}
                  error={form.formState.errors.latitud?.message}
                  onChange={(coords) => {
                    form.setValue('latitud', coords.latitud, { shouldValidate: true, shouldDirty: true })
                    form.setValue('longitud', coords.longitud, { shouldValidate: true, shouldDirty: true })
                  }}
                />

                <Typography variant="h3">INE y pagaré</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Número de INE" fullWidth {...form.register('ineNumero')} error={Boolean(form.formState.errors.ineNumero)} helperText={form.formState.errors.ineNumero?.message} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="INE desde"
                      type="number"
                      fullWidth
                      helperText="Año de registro"
                      {...form.register('ineAnioEmision')}
                      onBlur={(event) => {
                        const emision = Number(event.target.value)
                        if (!Number.isFinite(emision)) return
                        const actual = Number(form.getValues('ineAnioVigencia'))
                        if (!actual || actual === emision || actual < emision) {
                          form.setValue('ineAnioVigencia', emision + 10)
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="INE hasta"
                      type="number"
                      fullWidth
                      error={Boolean(form.formState.errors.ineAnioVigencia)}
                      helperText={form.formState.errors.ineAnioVigencia?.message ?? 'Ej. 2023 – 2033'}
                      {...form.register('ineAnioVigencia')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CargaArchivo etiqueta="Cargar INE frente" tipo="ine_frente" documento={documentos.find((d) => d.tipo === 'ine_frente')} onChange={setDocumento} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CargaArchivo etiqueta="Cargar INE reverso" tipo="ine_reverso" documento={documentos.find((d) => d.tipo === 'ine_reverso')} onChange={setDocumento} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Pagaré" type="number" fullWidth {...form.register('pagareMonto')} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Fecha del pagaré" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} {...form.register('pagareFecha')} />
                  </Grid>
                  <Grid size={12}>
                    <CargaArchivo etiqueta="Cargar pagaré" tipo="pagare" documento={documentos.find((d) => d.tipo === 'pagare')} onChange={setDocumento} />
                  </Grid>
                </Grid>

                <Typography variant="h3">Referencias (opcional)</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Referencia 1" fullWidth {...form.register('referencia1Nombre')} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Parentesco" fullWidth {...form.register('referencia1Parentesco')} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Teléfono" fullWidth {...form.register('referencia1Telefono')} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Referencia 2" fullWidth {...form.register('referencia2Nombre')} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Parentesco" fullWidth {...form.register('referencia2Parentesco')} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Teléfono" fullWidth {...form.register('referencia2Telefono')} /></Grid>
                </Grid>

                <Typography variant="h3">Desembolso</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name="planId"
                      control={form.control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Plan</InputLabel>
                          <Select label="Plan" {...field}>
                            {config.planes.filter((item) => item.activo).map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.nombre} · ${item.cuotaPorMil} / {item.plazoPagos}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Monto a desembolsar" type="number" fullWidth {...form.register('desembolso')} error={Boolean(form.formState.errors.desembolso)} helperText={form.formState.errors.desembolso?.message} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Fecha de desembolso" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} {...form.register('fechaDesembolso')} />
                  </Grid>
                </Grid>

                <Alert severity="info">
                  Cuota diaria {money(simulacion.cuotaDiaria)} · {simulacion.pagos} pagos · total {money(simulacion.total)} · cargo {money(simulacion.cargo)}
                  {cuotas[0] ? ` · primer cobro ${cuotas[0].fecha}` : ''}
                </Alert>
                {errorDocs ? <Alert severity="error">{errorDocs}</Alert> : null}

                <Stack direction="row" sx={{ gap: 1 }}>
                  <Button type="submit" variant="contained">
                    {esCobrador ? 'Enviar a autorización' : 'Registrar y desembolsar'}
                  </Button>
                  <Button onClick={() => navigate(esCobrador ? '/ruta' : '/clientes')}>Cancelar</Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <CalendarioPreview cuotas={cuotas} title="Así quedarían sus pagos diarios" />
        </Grid>
      </Grid>
    </Stack>
  )
}
