import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { RolUsuario } from '../domain/auth'
import { usuarioSchema, type UsuarioFormValues } from '../domain/schemas'
import { useAuth } from '../store/AuthProvider'
import { useUsuarios } from '../store/UsuariosProvider'

const vacio: UsuarioFormValues = {
  nombre: '',
  usuario: '',
  telefono: '',
  rol: 'cobrador',
  activo: true,
  clave: '',
}

export function UsuariosPage() {
  const { usuario: sesion } = useAuth()
  const { usuarios, crear, actualizar, cambiarEstado, eliminar, hidratarDesdeApi } = useUsuarios()

  useEffect(() => {
    void hidratarDesdeApi()
    // Una sola lectura al abrir la pantalla; el listado local sigue siendo la fuente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [abierto, setAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: vacio,
  })

  function abrirNuevo() {
    setError('')
    setEditandoId(null)
    form.reset(vacio)
    setAbierto(true)
  }

  function abrirEdicion(id: string) {
    const actual = usuarios.find((item) => item.id === id)
    if (!actual) return
    setError('')
    setEditandoId(id)
    form.reset({
      nombre: actual.nombre,
      usuario: actual.usuario,
      telefono: actual.telefono ?? '',
      rol: actual.rol,
      activo: actual.activo,
      clave: '',
    })
    setAbierto(true)
  }

  async function onGuardar(values: UsuarioFormValues) {
    setError('')
    try {
      if (!editandoId && (!values.clave || values.clave.length < 8)) {
        setError('La contraseña debe tener al menos 8 caracteres')
        return
      }
      if (editandoId) {
        await actualizar({
          id: editandoId,
          nombre: values.nombre,
          usuario: values.usuario,
          rol: values.rol,
          telefono: values.telefono,
          activo: values.activo,
          clave: values.clave || undefined,
        })
      } else {
        await crear({
          nombre: values.nombre,
          usuario: values.usuario,
          rol: values.rol,
          telefono: values.telefono,
          clave: values.clave ?? '',
          activo: values.activo,
        })
      }
      setAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 160 },
    { field: 'usuario', headerName: 'Usuario', width: 140 },
    {
      field: 'rol',
      headerName: 'Rol',
      width: 130,
      renderCell: (params) => (
        <Chip size="small" label={params.value === 'admin' ? 'Administrador' : 'Cobrador'} color={params.value === 'admin' ? 'primary' : 'default'} />
      ),
    },
    { field: 'telefono', headerName: 'Teléfono', width: 140 },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => <Chip size="small" label={params.value ? 'Activo' : 'Inactivo'} color={params.value ? 'success' : 'default'} />,
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 280,
      sortable: false,
      renderCell: (params) => {
        const esYo = params.id === sesion?.id
        return (
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center', height: '100%' }}>
            <Button size="small" onClick={() => abrirEdicion(String(params.id))}>
              Editar
            </Button>
            <Button
              size="small"
              onClick={() => {
                try {
                  cambiarEstado(String(params.id), !params.row.activo)
                } catch (err) {
                  window.alert(err instanceof Error ? err.message : 'No se pudo cambiar el estado')
                }
              }}
              disabled={esYo}
            >
              {params.row.activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              size="small"
              color="error"
              disabled={esYo}
              onClick={() => {
                if (window.confirm(`¿Eliminar a ${params.row.nombre}? Ya no podrá entrar.`)) {
                  try {
                    eliminar(String(params.id), sesion?.id ?? '')
                  } catch (err) {
                    window.alert(err instanceof Error ? err.message : 'No se pudo eliminar')
                  }
                }
              }}
            >
              Eliminar
            </Button>
          </Stack>
        )
      },
    },
  ]

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Stack>
          <Typography variant="h1">Usuarios</Typography>
          <Typography color="text.secondary">
            Da de alta administradores y cobradores, cambia contraseñas y desactiva cuentas.
          </Typography>
        </Stack>
        <Button variant="contained" onClick={abrirNuevo}>
          Nuevo usuario
        </Button>
      </Stack>

      <Paper sx={{ p: 1 }}>
        <DataGrid
          rows={usuarios.map((item) => ({
            id: item.id,
            nombre: item.nombre,
            usuario: item.usuario,
            rol: item.rol,
            telefono: item.telefono ?? '—',
            activo: item.activo,
          }))}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none', minHeight: 280 }}
        />
      </Paper>

      <Dialog open={abierto} onClose={() => setAbierto(false)} fullWidth maxWidth="sm">
        <form onSubmit={form.handleSubmit(onGuardar)}>
          <DialogTitle>{editandoId ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Nombre" fullWidth {...form.register('nombre')} error={Boolean(form.formState.errors.nombre)} helperText={form.formState.errors.nombre?.message} />
              <TextField
                label="Usuario"
                fullWidth
                {...form.register('usuario')}
                error={Boolean(form.formState.errors.usuario)}
                helperText={form.formState.errors.usuario?.message ?? 'Con este nombre entra al sistema'}
              />
              <TextField label="Teléfono" fullWidth {...form.register('telefono')} />
              <Controller
                name="rol"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Rol</InputLabel>
                    <Select {...field} label="Rol">
                      <MenuItem value={'admin' satisfies RolUsuario}>Administrador</MenuItem>
                      <MenuItem value={'cobrador' satisfies RolUsuario}>Cobrador</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <TextField
                label={editandoId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                type="password"
                fullWidth
                {...form.register('clave')}
                helperText={editandoId ? 'Déjala vacía para no cambiarla' : 'Mínimo 8 caracteres'}
              />
              <Controller
                name="activo"
                control={form.control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />} label="Usuario activo" />
                )}
              />
              {error ? <Alert severity="error">{error}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  )
}
