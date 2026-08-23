import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { ChangeEvent } from 'react'
import { archivoADataUrl } from '../domain/archivo'
import type { DocumentoCliente, TipoDocumento } from '../domain/cliente'

type Props = {
  etiqueta: string
  tipo: TipoDocumento
  documento?: DocumentoCliente
  onChange: (documento: DocumentoCliente) => void
  camara?: boolean
  soloImagen?: boolean
  ayuda?: string
}

export function CargaArchivo({ etiqueta, tipo, documento, onChange, camara, soloImagen, ayuda }: Props) {
  const accept = soloImagen || camara ? 'image/*' : 'image/*,.pdf'

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await archivoADataUrl(file)
    onChange({ tipo, nombre: file.name, dataUrl })
    event.target.value = ''
  }

  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>
        {camara ? (
          <Button component="label" variant="contained" startIcon={<PhotoCameraOutlinedIcon />}>
            Tomar foto
            <input hidden type="file" accept="image/*" capture="environment" onChange={handleChange} />
          </Button>
        ) : null}
        <Button component="label" variant="outlined" startIcon={<CloudUploadOutlinedIcon />}>
          {camara ? 'Elegir de galería' : etiqueta}
          <input hidden type="file" accept={accept} onChange={handleChange} />
        </Button>
      </Stack>
      {ayuda ? (
        <Typography variant="caption" color="text.secondary">
          {ayuda}
        </Typography>
      ) : null}
      {documento ? (
        <Box>
          <Typography variant="caption" color="text.secondary">
            {documento.nombre}
          </Typography>
          {documento.dataUrl.startsWith('data:image') ? (
            <Box
              component="img"
              src={documento.dataUrl}
              alt={etiqueta}
              sx={{ display: 'block', mt: 1, maxHeight: 180, maxWidth: '100%', borderRadius: 1 }}
            />
          ) : (
            <Typography variant="body2">Archivo cargado</Typography>
          )}
        </Box>
      ) : (
        <Typography variant="caption" color="error">
          Obligatorio
        </Typography>
      )}
    </Stack>
  )
}
