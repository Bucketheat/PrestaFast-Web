import { FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from '@mui/material'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMemo, useState } from 'react'
import { TabuladorPreview } from '../components/TabuladorPreview'
import { generarTabulador, money, planPorDefecto } from '../domain/calculo'
import { useConfig } from '../store/ConfigProvider'

export function TabuladorPage() {
  const { config } = useConfig()
  const [planId, setPlanId] = useState(planPorDefecto(config.planes).id)
  const plan = config.planes.find((item) => item.id === planId) ?? config.planes[0]
  const rows = useMemo(
    () => generarTabulador(plan, config.parametros),
    [plan, config.parametros],
  )

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Stack>
          <Typography variant="h1">Tabulador</Typography>
          <Typography color="text.secondary">
            Vista previa de cómo queda cada cuota según el plan parametrizado.
          </Typography>
        </Stack>
        <FormControl sx={{ minWidth: 260 }}>
          <InputLabel>Plan</InputLabel>
          <Select
            label="Plan"
            value={plan.id}
            onChange={(event) => setPlanId(event.target.value)}
          >
            {config.planes.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.nombre} · ${item.cuotaPorMil} / {item.plazoPagos} pagos
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Paper sx={{ p: 2.5, height: 320 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Comparativo de cuota diaria
        </Typography>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="desembolso" tickFormatter={(value: number) => money(value)} />
            <YAxis tickFormatter={(value: number) => money(value)} />
            <Tooltip
              formatter={(value) => money(Number(value))}
              labelFormatter={(label) => `Desembolso ${money(Number(label))}`}
            />
            <Bar dataKey="cuotaDiaria" name="Cuota diaria" fill="#0f3d3e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <TabuladorPreview plan={plan} parametros={config.parametros} />
    </Stack>
  )
}
