import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { ChangeEvent } from 'react'
import { archivoADataUrl } from '../domain/archivo'

export type ImagenCargada = {
  nombre: string
  dataUrl: string
}

type Props = {
  etiqueta?: string
  imagen?: ImagenCargada
  onChange: (imagen: ImagenCargada) => void
  obligatorio?: boolean
  ayuda?: string
}

export function CargaImagen({ etiqueta = 'Subir imagen', imagen, onChange, obligatorio, ayuda }: Props) {
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await archivoADataUrl(file, 960)
    onChange({ nombre: file.name, dataUrl })
    event.target.value = ''
  }

  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
        <Button component="label" variant="contained" startIcon={<PhotoCameraOutlinedIcon />}>
          Tomar foto
          <input hidden type="file" accept="image/*" capture="environment" onChange={handleChange} />
        </Button>
        <Button component="label" variant="outlined" startIcon={<CloudUploadOutlinedIcon />}>
          {etiqueta}
          <input hidden type="file" accept="image/*" onChange={handleChange} />
        </Button>
      </Stack>
      {ayuda ? (
        <Typography variant="caption" color="text.secondary">
          {ayuda}
        </Typography>
      ) : null}
      {imagen ? (
        <Box>
          <Typography variant="caption" color="text.secondary">
            {imagen.nombre}
          </Typography>
          {imagen.dataUrl.startsWith('data:image') ? (
            <Box component="img" src={imagen.dataUrl} alt={etiqueta} sx={{ display: 'block', mt: 1, maxHeight: 160, maxWidth: '100%', borderRadius: 1 }} />
          ) : (
            <Typography variant="body2">Imagen cargada</Typography>
          )}
        </Box>
      ) : obligatorio ? (
        <Typography variant="caption" color="error">
          Sube el ticket o una foto del gasto
        </Typography>
      ) : null}
    </Stack>
  )
}
