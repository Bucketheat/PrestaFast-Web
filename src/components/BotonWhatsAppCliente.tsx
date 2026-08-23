import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { Button } from '@mui/material'
import type { Cliente } from '../domain/cliente'
import { enlaceWhatsApp, textoAvisoClienteWhatsApp, yaPagoHoy } from '../domain/recibo'

type Props = {
  cliente: Cliente
  compacto?: boolean
}

export function BotonWhatsAppCliente({ cliente, compacto }: Props) {
  const pagadoHoy = yaPagoHoy(cliente)
  const telefono = cliente.telefono.replace(/\D/g, '')
  const listo = telefono.length >= 10 && !pagadoHoy
  const size = compacto ? 'small' : 'medium'
  const title = pagadoHoy ? 'Ya pagó hoy' : !telefono ? 'Sin teléfono' : 'Enviar aviso por WhatsApp'

  if (!listo) {
    return (
      <Button size={size} variant="outlined" color="success" startIcon={<WhatsAppIcon />} disabled title={title}>
        {pagadoHoy ? 'Pagó hoy' : 'WhatsApp'}
      </Button>
    )
  }

  return (
    <Button
      size={size}
      variant="outlined"
      color="success"
      startIcon={<WhatsAppIcon />}
      href={enlaceWhatsApp(cliente.telefono, textoAvisoClienteWhatsApp(cliente))}
      target="_blank"
      rel="noreferrer"
      title={title}
      onClick={(event) => event.stopPropagation()}
    >
      WhatsApp
    </Button>
  )
}
