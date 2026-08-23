import { Button, Stack } from '@mui/material'
import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ControlFicha } from '../components/ControlFicha'
import { useAuth } from '../store/AuthProvider'
import { useClientes } from '../store/ClientesProvider'

export function ControlPrintPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { buscarPorId, cargarDetalle } = useClientes()

  useEffect(() => {
    if (id && usuario) void cargarDetalle(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, usuario])

  if (!usuario) return <Navigate to="/login" replace />
  const cliente = id ? buscarPorId(id) : undefined

  if (!cliente) {
    return (
      <Stack sx={{ p: 3 }}>
        <Button onClick={() => navigate('/clientes')}>Volver a clientes</Button>
      </Stack>
    )
  }

  return (
    <Stack>
      <Stack className="no-print" direction="row" sx={{ p: 2, gap: 1 }}>
        <Button variant="contained" onClick={() => window.print()}>
          Imprimir o guardar PDF
        </Button>
        <Button onClick={() => navigate(`/clientes/${cliente.id}`)}>Volver al expediente</Button>
      </Stack>
      <ControlFicha cliente={cliente} />
    </Stack>
  )
}
