import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { CargaImagen, type ImagenCargada } from '../components/CargaImagen'
import { formatFechaLarga, hoyIso } from '../domain/calendario'
import { money } from '../domain/calculo'
import { etiquetaEstadoGasto, etiquetaTipoGasto, resumenGastos, TIPOS_GASTO, type EstadoGasto, type TipoGasto } from '../domain/gasto'
import { useAuth } from '../store/AuthProvider'
import { useGastos } from '../store/GastosProvider'
import { useUsuarios } from '../store/UsuariosProvider'

export function GastosPage() {
  const { usuario } = useAuth()
  const { gastos, registrar, aprobar, rechazar, eliminar } = useGastos()
  const { usuarios, hidratarDesdeApi } = useUsuarios()
  const esCobrador = usuario?.rol === 'cobrador'

  useEffect(() => {
    if (!esCobrador) void hidratarDesdeApi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esCobrador])

  const hoy = hoyIso()
  const resumen = resumenGastos(gastos, hoy.slice(0, 7))
  const pendientes = gastos.filter((item) => item.estado === 'pendiente_autorizacion')
  const tipos = esCobrador ? TIPOS_GASTO.filter((item) => item !== 'nomina') : TIPOS_GASTO
  const [fecha, setFecha] = useState(hoy)
  const [tipo, setTipo] = useState<TipoGasto>('gasolina')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [evidencia, setEvidencia] = useState<ImagenCargada | undefined>()
  const [vista, setVista] = useState<{ nombre: string; dataUrl: string } | null>(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const columnas: GridColDef[] = useMemo(
    () => [
      { field: 'fecha', headerName: 'Fecha', width: 140, valueFormatter: (v: string) => formatFechaLarga(v) },
      { field: 'tipo', headerName: 'Tipo', width: 130, valueFormatter: (v: TipoGasto) => etiquetaTipoGasto[v] ?? v },
      { field: 'concepto', headerName: 'Concepto', flex: 1, minWidth: 160 },
      { field: 'persona', headerName: 'Para', width: 140 },
      { field: 'monto', headerName: 'Monto', width: 110, valueFormatter: (v: number) => money(v) },
      {
        field: 'estado',
        headerName: 'Estado',
        width: 140,
        renderCell: (params) => (
          <Chip size="small" color={colorEstado(params.row.estado)} label={etiquetaEstadoGasto[params.row.estado as EstadoGasto] ?? params.row.estado} />
        ),
      },
      {
        field: 'evidencia',
        headerName: 'Foto',
        width: 90,
        sortable: false,
        renderCell: (params) =>
          params.row.evidenciaDataUrl ? (
            <Button size="small" onClick={() => setVista({ nombre: params.row.evidenciaNombre || 'Evidencia', dataUrl: params.row.evidenciaDataUrl })}>
              Ver
            </Button>
          ) : (
            '—'
          ),
      },
      {
        field: 'acciones',
        headerName: '',
        width: esCobrador ? 110 : 220,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" sx={{ gap: 0.5 }}>
            {!esCobrador && params.row.estado === 'pendiente_autorizacion' ? (
              <>
                <Button size="small" variant="contained" onClick={() => void aprobar(String(params.id))}>
                  Aprobar
                </Button>
                <Button size="small" color="error" onClick={() => void rechazar(String(params.id))}>
                  Rechazar
                </Button>
              </>
            ) : null}
            {(esCobrador && params.row.estado === 'pendiente_autorizacion') || !esCobrador ? (
              <Button size="small" color="error" onClick={() => void eliminar(String(params.id))}>
                Borrar
              </Button>
            ) : null}
          </Stack>
        ),
      },
    ],
    [aprobar, eliminar, esCobrador, rechazar],
  )

  async function onRegistrar() {
    setError('')
    const cantidad = Number(monto)
    if (!concepto.trim()) {
      setError('Escribe el concepto, por ejemplo “Gasolina ruta sur”.')
      return
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }
    if (!esCobrador && tipo === 'nomina' && !usuarioId) {
      setError('Elige a quién se le paga la nómina.')
      return
    }
    if ((tipo === 'gasolina' || esCobrador) && !evidencia) {
      setError('Sube la foto del ticket o del gasto.')
      return
    }
    setGuardando(true)
    try {
      await registrar({
        fecha,
        tipo,
        concepto,
        monto: cantidad,
        usuarioId: usuarioId || undefined,
        evidenciaNombre: evidencia?.nombre,
        evidenciaDataUrl: evidencia?.dataUrl,
      })
      setConcepto('')
      setMonto('')
      setEvidencia(undefined)
      if (tipo !== 'nomina') setUsuarioId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el gasto')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack>
        <Typography variant="h1">{esCobrador ? 'Mis gastos' : 'Gastos y nómina'}</Typography>
        <Typography color="text.secondary">
          {esCobrador
            ? 'Toma foto del ticket y mándalo. El administrador lo revisa y aprueba.'
            : 'Revisa lo que manda el cobrador. Solo lo aprobado cuenta en caja.'}
        </Typography>
      </Stack>

      {!esCobrador && pendientes.length > 0 ? (
        <Alert severity="warning">{pendientes.length} gasto(s) del cobrador esperan tu visto bueno.</Alert>
      ) : null}

      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
        {(esCobrador
          ? [
              ['Enviados', String(gastos.length)],
              ['Por autorizar', String(pendientes.length)],
              ['Aprobados', money(resumen.total)],
            ]
          : [
              ['Gastos del mes', money(resumen.total)],
              ['Nómina', money(resumen.nomina)],
              ['Gasolina', money(resumen.gasolina)],
              ['Por autorizar', String(pendientes.length)],
            ]
        ).map(([label, value]) => (
          <Card key={label} sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                {label}
              </Typography>
              <Typography variant="h2">{value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          {esCobrador ? 'Enviar gasto con foto' : 'Registrar'}
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 180 }} />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Tipo</InputLabel>
              <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoGasto)}>
                {tipos.map((item) => (
                  <MenuItem key={item} value={item}>
                    {etiquetaTipoGasto[item]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Monto" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} sx={{ minWidth: 140 }} />
          </Stack>
          {!esCobrador && tipo === 'nomina' ? (
            <FormControl fullWidth>
              <InputLabel>Se paga a</InputLabel>
              <Select label="Se paga a" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
                {usuarios.filter((item) => item.activo).map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nombre} · {item.rol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          <TextField
            label="Concepto"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder={tipo === 'nomina' ? 'Semana 34 · cobrador ruta sur' : 'Gasolina Honda, ruta sur'}
            fullWidth
          />
          <CargaImagen
            etiqueta="Subir imagen"
            imagen={evidencia}
            onChange={setEvidencia}
            obligatorio={tipo === 'gasolina' || esCobrador}
            ayuda={esCobrador ? 'Obligatorio. Foto del ticket o de la bomba para que el admin lo apruebe.' : tipo === 'nomina' ? 'Opcional: foto del comprobante.' : 'Foto del ticket, bomba o comprobante.'}
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button variant="contained" disabled={guardando} onClick={() => void onRegistrar()} sx={{ alignSelf: 'flex-start' }}>
            {guardando ? 'Enviando…' : esCobrador ? 'Enviar a autorización' : tipo === 'nomina' ? 'Registrar nómina' : 'Registrar gasto'}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 1 }}>
        <DataGrid
          rows={gastos.map((item) => ({
            ...item,
            persona: item.usuarioId ? usuarios.find((u) => u.id === item.usuarioId)?.nombre ?? item.capturadoPor : 'Caja',
          }))}
          columns={columnas}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none', minHeight: 280 }}
        />
      </Paper>

      <Dialog open={Boolean(vista)} onClose={() => setVista(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{vista?.nombre}</DialogTitle>
        <DialogContent>
          {vista?.dataUrl.startsWith('data:image') ? (
            <Box component="img" src={vista.dataUrl} alt={vista.nombre} sx={{ width: '100%', borderRadius: 1 }} />
          ) : (
            <Typography>Sin imagen</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

function colorEstado(estado: EstadoGasto): 'warning' | 'success' | 'error' | 'default' {
  if (estado === 'pendiente_autorizacion') return 'warning'
  if (estado === 'aprobado') return 'success'
  if (estado === 'rechazado') return 'error'
  return 'default'
}
