import { hoyIso } from './calendario'
import type { Cliente } from './cliente'
import { hidratarCliente } from './operacion'

export type CierreRuta = {
  id: string
  fecha: string
  cobradorId: string
  cobradorNombre: string
  visitasPendientes: number
  esperado: number
  cobrado: number
  desembolsado: number
  cambio: number
  aEntregar: number
  notas: string
  cerradoEn: string
}

export const CIERRES_STORAGE_KEY = 'prestamos.cierres.v1'
export const CAMBIO_RUTA_KEY = 'prestamos.cambioRuta.v1'

export function cuentaCierreCaja(cobrado: number, desembolsado: number, cambio: number) {
  const fondo = Math.max(0, Number(cambio) || 0)
  return {
    cambio: fondo,
    cobrado,
    desembolsado,
    aEntregar: cobrado + fondo - desembolsado,
  }
}

export function leerCambioRuta(cobradorId: string, fecha: string) {
  try {
    const raw = localStorage.getItem(CAMBIO_RUTA_KEY)
    if (!raw) return 0
    const mapa = JSON.parse(raw) as Record<string, number>
    return Math.max(0, Number(mapa[`${cobradorId}:${fecha}`]) || 0)
  } catch {
    return 0
  }
}

export function guardarCambioRuta(cobradorId: string, fecha: string, monto: number) {
  const mapa = (() => {
    try {
      const raw = localStorage.getItem(CAMBIO_RUTA_KEY)
      return raw ? (JSON.parse(raw) as Record<string, number>) : {}
    } catch {
      return {}
    }
  })()
  mapa[`${cobradorId}:${fecha}`] = Math.max(0, Number(monto) || 0)
  localStorage.setItem(CAMBIO_RUTA_KEY, JSON.stringify(mapa))
}

export function cuotaCobradaEl(cuota: Cliente['prestamo']['cuotas'][number], fecha: string) {
  if (cuota.pagado <= 0 && cuota.estado !== 'pagada') return false
  if (cuota.pagadoEn) return cuota.pagadoEn === fecha
  return cuota.fecha === fecha && (cuota.estado === 'pagada' || cuota.pagado > 0)
}

export function montoCobradoEl(cliente: Cliente, fecha: string) {
  return cliente.prestamo.cuotas
    .filter((cuota) => cuotaCobradaEl(cuota, fecha))
    .reduce((suma, cuota) => suma + cuota.pagado, 0)
}

export function resumenRutaDia(clientes: Cliente[], cobradorId: string | undefined, fecha = hoyIso()) {
  const mios = clientes
    .map(hidratarCliente)
    .filter((cliente) => !cobradorId || !cliente.cobradorId || cliente.cobradorId === cobradorId)
    .filter((cliente) => cliente.estado !== 'rechazado')

  const activos = mios.filter((cliente) => cliente.estado === 'activo')
  const ruta = activos
    .map((cliente) => {
      const vencidas = cliente.prestamo.cuotas.filter((cuota) => cuota.estado === 'vencida')
      const deHoy = cliente.prestamo.cuotas.find((cuota) => cuota.fecha === fecha && cuota.estado !== 'pagada')
      return { cliente, vencidas, deHoy }
    })
    .filter((item) => item.deHoy || item.vencidas.length)

  const esperado = ruta.reduce((suma, item) => {
    const hoyMonto = item.deHoy ? item.deHoy.monto - item.deHoy.pagado : 0
    const vencido = item.vencidas.reduce((acc, cuota) => acc + cuota.monto - cuota.pagado, 0)
    return suma + hoyMonto + vencido
  }, 0)

  const cobrado = mios.reduce((suma, cliente) => suma + montoCobradoEl(cliente, fecha), 0)

  const desembolsado = mios
    .filter((cliente) => cliente.prestamo.fechaDesembolso === fecha)
    .filter((cliente) => cliente.estado === 'activo' || cliente.estado === 'pendiente_autorizacion')
    .reduce((suma, cliente) => suma + cliente.prestamo.desembolso, 0)

  return {
    fecha,
    visitas: ruta.length,
    visitasPendientes: ruta.length,
    esperado,
    cobrado,
    desembolsado,
    aEntregar: cobrado,
    ruta,
    pendientesAuth: mios.filter((cliente) => cliente.estado === 'pendiente_autorizacion').length,
  }
}
