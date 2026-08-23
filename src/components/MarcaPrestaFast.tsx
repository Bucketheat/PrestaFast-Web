import { Box, Stack, Typography } from '@mui/material'
import { MARCA } from '../branding'

type Props = {
  variante?: 'login' | 'barra' | 'compacta'
}

export function MarcaPrestaFast({ variante = 'compacta' }: Props) {
  if (variante === 'login') {
    return (
      <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box
          component="img"
          src={MARCA.logo}
          alt={MARCA.nombre}
          sx={{ width: 88, height: 88, borderRadius: 2, objectFit: 'cover', bgcolor: '#0f3d3e' }}
        />
        <Typography variant="h1">{MARCA.nombre}</Typography>
        <Typography color="text.secondary">{MARCA.eslogan}</Typography>
      </Stack>
    )
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        component="img"
        src={MARCA.logo}
        alt=""
        sx={{
          width: variante === 'barra' ? 36 : 28,
          height: variante === 'barra' ? 36 : 28,
          borderRadius: 1,
          objectFit: 'cover',
          bgcolor: '#0b2f30',
          flexShrink: 0,
        }}
      />
      <Typography
        variant={variante === 'barra' ? 'h6' : 'subtitle1'}
        sx={{ fontWeight: 700, lineHeight: 1.1, color: variante === 'barra' ? 'inherit' : undefined }}
      >
        {MARCA.nombre}
      </Typography>
    </Stack>
  )
}
