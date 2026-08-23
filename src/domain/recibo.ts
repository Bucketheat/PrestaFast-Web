import { formatFechaLarga, hoyIso } from './calendario'
import { money } from './calculo'
import type { Cliente, CuotaCliente } from './cliente'
import { MARCA } from '../branding'

function escapar(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function ultimaCuotaCobrada(cliente: Cliente, fecha = hoyIso()): CuotaCliente | undefined {
  const deHoy = cliente.prestamo.cuotas.filter((cuota) => cuota.pagadoEn === fecha && cuota.pagado > 0)
  if (deHoy.length) return deHoy[deHoy.length - 1]
  return [...cliente.prestamo.cuotas].reverse().find((cuota) => cuota.estado === 'pagada')
}

export function textoReciboWhatsApp(cliente: Cliente, cuota: CuotaCliente) {
  const pendientes = cliente.prestamo.cuotas.filter((item) => item.estado !== 'pagada').length
  return [
    `${MARCA.nombre} · recibo de pago`,
    `${cliente.nombreCompleto}`,
    `Control ${cliente.numeroControl}`,
    `Pago ${cuota.numero} de ${cliente.prestamo.plazoPagos}: ${money(cuota.pagado || cuota.monto)}`,
    `Fecha: ${formatFechaLarga(cuota.pagadoEn || hoyIso())}`,
    pendientes ? `Quedan ${pendientes} pago(s).` : 'Préstamo liquidado. ¡Gracias!',
  ].join('\n')
}

export function enlaceWhatsApp(telefono: string, mensaje: string) {
  const digitos = telefono.replace(/\D/g, '')
  const destino = digitos.length === 10 ? `52${digitos}` : digitos
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`
}

export function yaPagoHoy(cliente: Cliente, fecha = hoyIso()) {
  return cliente.prestamo.cuotas.some((cuota) => {
    if (cuota.pagadoEn === fecha && cuota.pagado > 0) return true
    return cuota.fecha === fecha && (cuota.estado === 'pagada' || cuota.pagado >= cuota.monto)
  })
}

/** Aviso al cliente: sin total ni cargo, para no asustar. */
export function textoAvisoClienteWhatsApp(cliente: Cliente, fecha = hoyIso()) {
  const nombre = cliente.nombreCompleto.trim().split(/\s+/)[0] || cliente.nombreCompleto
  const deHoy = cliente.prestamo.cuotas.find((cuota) => cuota.fecha === fecha)
  const lineas = [
    `${MARCA.nombre}`,
    `Hola ${nombre}, tu préstamo ya quedó.`,
    `Control ${cliente.numeroControl}`,
    `Recibiste ${money(cliente.prestamo.desembolso)}`,
    `Tu cuota diaria es ${money(cliente.prestamo.cuotaDiaria)}`,
    `${cliente.prestamo.plazoPagos} pagos, lunes a sábado (no domingo)`,
  ]
  if (deHoy && deHoy.estado !== 'pagada' && deHoy.pagado < deHoy.monto) {
    lineas.push(`Hoy te toca el pago ${deHoy.numero} de ${cliente.prestamo.plazoPagos}: ${money(deHoy.monto - deHoy.pagado)}`)
  } else {
    lineas.push(`Primer cobro: ${formatFechaLarga(cliente.prestamo.fechaPrimerCobro)}`)
  }
  return lineas.join('\n')
}

export function generarReciboHtml(cliente: Cliente, cuota: CuotaCliente): string {
  const pagado = cuota.pagado || cuota.monto
  const restantes = cliente.prestamo.cuotas.filter((item) => item.estado !== 'pagada').length
  const recuperado = cliente.prestamo.cuotas.reduce((suma, item) => suma + item.pagado, 0)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo ${escapar(cliente.numeroControl)} · pago ${cuota.numero}</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; color: #1c1917; margin: 24px; }
    .card { max-width: 420px; border: 1px solid #d6d3d1; padding: 20px; }
    .brand { color: #0f3d3e; font-weight: 700; letter-spacing: 0.04em; }
    h1 { margin: 8px 0 4px; font-size: 22px; }
    .muted { color: #57534e; }
    .monto { font-size: 32px; font-weight: 700; color: #0f3d3e; margin: 12px 0; }
    .row { display: flex; justify-content: space-between; gap: 12px; margin: 6px 0; font-size: 14px; }
    .nota { margin-top: 16px; padding: 10px; background: #f4f1ea; font-size: 13px; }
    @media print { body { margin: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">${escapar(MARCA.nombre)}</div>
    <div class="muted">${escapar(MARCA.eslogan)}</div>
    <h1>Recibo de pago</h1>
    <div class="monto">${escapar(money(pagado))}</div>
    <div class="row"><span>Cliente</span><strong>${escapar(cliente.nombreCompleto)}</strong></div>
    <div class="row"><span>Control</span><strong>${escapar(cliente.numeroControl)}</strong></div>
    <div class="row"><span>Pago</span><strong>${cuota.numero} / ${cliente.prestamo.plazoPagos}</strong></div>
    <div class="row"><span>Fecha</span><strong>${escapar(formatFechaLarga(cuota.pagadoEn || hoyIso()))}</strong></div>
    <div class="row"><span>Recuperado</span><strong>${escapar(money(recuperado))} de ${escapar(money(cliente.prestamo.total))}</strong></div>
    <div class="row"><span>Pendientes</span><strong>${restantes}</strong></div>
    <div class="nota">Conserve este recibo. El cobro quedó registrado en ${escapar(MARCA.nombre)}.</div>
  </div>
</body>
</html>`
}
