import { Paper, Stack, Typography } from '@mui/material'

type Props = {
  titulo: string
  detalle: string
}

export function PlaceholderPage({ titulo, detalle }: Props) {
  return (
    <Stack spacing={2}>
      <Typography variant="h1">{titulo}</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">{detalle}</Typography>
      </Paper>
    </Stack>
  )
}
