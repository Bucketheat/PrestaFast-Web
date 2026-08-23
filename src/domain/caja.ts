import type { Cliente } from './cliente'
import { hidratarCliente } from './operacion'

export const CAJA_STORAGE_KEY = 'prestamos.caja.v1'

export type EstadoCaja = {
  capitalInicial: number
  capitalYaPrestada: number
  actualizadoEn: string
}

export const cajaInicial: EstadoCaja = {
  capitalInicial: 0,
  capitalYaPrestada: 0,
  actualizadoEn: new Date().toISOString(),
}

export function desembolsosSistema(clientes: Cliente[]) {
  const hidratados = clientes.map(hidratarCliente)
  const activos = hidratados.filter((c) => c.estado === 'activo' && c.prestamo.estado === 'activo')
  const pendientes = hidratados.filter((c) => c.estado === 'pendiente_autorizacion')
  const liquidados = hidratados.filter((c) => c.prestamo.estado === 'liquidado')

  const distribuidaActiva = activos.reduce((suma, cliente) => suma + cliente.prestamo.desembolso, 0)
  const comprometida = pendientes.reduce((suma, cliente) => suma + cliente.prestamo.desembolso, 0)
  const cobrado = hidratados.reduce(
    (suma, cliente) => suma + cliente.prestamo.cuotas.reduce((acc, cuota) => acc + cuota.pagado, 0),
    0,
  )
  const recuperada = liquidados.reduce((suma, cliente) => suma + cliente.prestamo.desembolso, 0)

  return { distribuidaActiva, comprometida, cobrado, recuperada, activos, pendientes }
}

export function resumenCaja(caja: EstadoCaja, clientes: Cliente[]) {
  const mov = desembolsosSistema(clientes)
  const capitalDistribuida = caja.capitalYaPrestada + mov.distribuidaActiva
  const capitalDisponible = caja.capitalInicial - capitalDistribuida - mov.comprometida
  return {
    capitalInicial: caja.capitalInicial,
    capitalYaPrestada: caja.capitalYaPrestada,
    capitalDistribuida,
    capitalDisponible,
    ...mov,
  }
}
