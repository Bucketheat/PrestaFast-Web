import {
  Alert,
  Autocomplete,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, type Control, type UseFormSetValue, useWatch } from 'react-hook-form'
import { consultarCodigoPostal, type CatalogoCp } from '../domain/catalogoCp'
import type { ClienteAltaValues } from '../domain/schemas'

type Props = {
  control: Control<ClienteAltaValues>
  setValue: UseFormSetValue<ClienteAltaValues>
}

const OTRA = '__otra__'

export function CamposDomicilio({ control, setValue }: Props) {
  const codigoPostal = useWatch({ control, name: 'codigoPostal' })
  const colonia = useWatch({ control, name: 'colonia' })
  const [catalogo, setCatalogo] = useState<CatalogoCp | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const cp = (codigoPostal ?? '').replace(/\D/g, '')
    if (cp.length !== 5) {
      setCatalogo(null)
      setError('')
      return
    }

    let cancelado = false
    setCargando(true)
    setError('')
    consultarCodigoPostal(cp)
      .then((data) => {
        if (cancelado) return
        setCatalogo(data)
        setValue('entidadFederativa', data.estado)
        setValue('municipio', data.municipio)
        if (data.colonias.length === 1) {
          setValue('colonia', data.colonias[0])
        } else {
          setValue('colonia', '')
        }
      })
      .catch((err: unknown) => {
        if (cancelado) return
        setCatalogo(null)
        setError(err instanceof Error ? err.message : 'No se encontró el CP')
        setValue('entidadFederativa', '')
        setValue('municipio', '')
        setValue('colonia', '')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [codigoPostal, setValue])

  const colonias = catalogo?.colonias ?? []
  const coloniaEnCatalogo = colonias.includes(colonia)
  const mostrarOtra = colonia === OTRA || (Boolean(colonia) && colonias.length > 0 && !coloniaEnCatalogo)

  return (
    <>
      <Typography variant="h3">Domicilio por código postal</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="codigoPostal"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Código postal"
                fullWidth
                onChange={(event) => field.onChange(event.target.value.replace(/\D/g, '').slice(0, 5))}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? 'Al escribir 5 dígitos se cargan estado, municipio y colonias'}
                slotProps={{
                  htmlInput: { maxLength: 5, inputMode: 'numeric' },
                  input: { endAdornment: cargando ? <CircularProgress size={18} /> : undefined },
                }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="entidadFederativa"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Estado" fullWidth slotProps={{ input: { readOnly: Boolean(catalogo) } }} />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="municipio"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Municipio / alcaldía" fullWidth slotProps={{ input: { readOnly: Boolean(catalogo) } }} />
            )}
          />
        </Grid>
        <Grid size={12}>
          {colonias.length > 0 ? (
            <FormControl fullWidth>
              <InputLabel>Colonia</InputLabel>
              <Select
                label="Colonia"
                value={coloniaEnCatalogo ? colonia : colonia ? OTRA : ''}
                onChange={(event) => {
                  const valor = String(event.target.value)
                  setValue('colonia', valor === OTRA ? '' : valor)
                }}
              >
                {colonias.map((nombre) => (
                  <MenuItem key={nombre} value={nombre}>
                    {nombre}
                  </MenuItem>
                ))}
                <MenuItem value={OTRA}>Otra colonia…</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Controller
              name="colonia"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  freeSolo
                  options={[]}
                  inputValue={field.value}
                  onInputChange={(_e, value) => field.onChange(value)}
                  renderInput={(params) => <TextField {...params} label="Colonia" fullWidth />}
                />
              )}
            />
          )}
        </Grid>
        {mostrarOtra && colonias.length > 0 ? (
          <Grid size={12}>
            <Controller
              name="colonia"
              control={control}
              render={({ field }) => <TextField {...field} label="Escribe la colonia" fullWidth />}
            />
          </Grid>
        ) : null}
        <Grid size={12}>
          <Controller
            name="domicilio"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Calle y número"
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="referenciasUbicacion"
            control={control}
            render={({ field }) => <TextField {...field} label="Referencias (portón, piso, color)" fullWidth />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="zona"
            control={control}
            render={({ field }) => <TextField {...field} label="Zona / ruta" fullWidth />}
          />
        </Grid>
      </Grid>
      {error ? <Alert severity="warning">{error}. Puedes capturar estado, municipio y colonia a mano.</Alert> : null}
      {catalogo ? (
        <Alert severity="success">
          CP {catalogo.cp}: {catalogo.colonias.length} colonia(s) en {catalogo.municipio}, {catalogo.estado}.
        </Alert>
      ) : null}
    </>
  )
}
