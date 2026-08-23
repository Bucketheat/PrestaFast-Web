import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { ChangeEvent } from 'react'
import { archivoADataUrl } from '../domain/archivo'
import type { DocumentoCliente, TipoDocumento } from '../domain/cliente'

type Props = {
  etiqueta: string
  tipo: TipoDocumento
  documento?: DocumentoCliente
  onChange: (documento: DocumentoCliente) => void
}

export function CargaArchivo({ etiqueta, tipo, documento, onChange }: Props) {
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await archivoADataUrl(file)
    onChange({ tipo, nombre: file.name, dataUrl })
    event.target.value = ''
  }

  return (
    <Stack spacing={1}>
      <Button component="label" variant="outlined" startIcon={<CloudUploadOutlinedIcon />}>
        {etiqueta}
        <input hidden type="file" accept="image/*,.pdf" onChange={handleChange} />
      </Button>
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
              sx={{ display: 'block', mt: 1, maxHeight: 120, maxWidth: '100%', borderRadius: 1 }}
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
