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
  const href = listo ? enlaceWhatsApp(cliente.telefono, textoAvisoClienteWhatsApp(cliente)) : undefined

  return (
    <Button
      size={compacto ? 'small' : 'medium'}
      variant="outlined"
      color="success"
      startIcon={<WhatsAppIcon />}
      href={href}
      target="_blank"
      rel="noreferrer"
      disabled={!listo}
      onClick={(event) => event.stopPropagation()}
      title={pagadoHoy ? 'Ya pagó hoy' : !telefono ? 'Sin teléfono' : 'Enviar aviso por WhatsApp'}
    >
      {pagadoHoy ? 'Pagó hoy' : 'WhatsApp'}
    </Button>
  )
}
