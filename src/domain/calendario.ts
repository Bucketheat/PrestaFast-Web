import type { PlanCobro } from './types'
import type { CuotaCliente } from './cliente'

export function parseFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1)
}

export function formatFecha(date: Date): string {
  const anio = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function hoyIso(): string {
  return formatFecha(new Date())
}

export function formatFechaLarga(iso: string): string {
  return parseFecha(iso).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function esDomingo(date: Date): boolean {
  return date.getDay() === 0
}

export function siguienteDiaCobro(desde: Date, cobraDomingo: boolean): Date {
  const fecha = new Date(desde)
  fecha.setDate(fecha.getDate() + 1)
  if (!cobraDomingo) {
    while (esDomingo(fecha)) {
      fecha.setDate(fecha.getDate() + 1)
    }
  }
  return fecha
}

export function generarCalendarioPagos(
  fechaDesembolsoIso: string,
  plan: PlanCobro,
  cuotaDiaria: number,
): CuotaCliente[] {
  const cuotas: CuotaCliente[] = []
  let actual = parseFecha(fechaDesembolsoIso)

  for (let numero = 1; numero <= plan.plazoPagos; numero += 1) {
    actual = siguienteDiaCobro(actual, plan.cobraDomingo)
    cuotas.push({
      numero,
      fecha: formatFecha(actual),
      monto: cuotaDiaria,
      estado: 'programada',
      pagado: 0,
    })
  }

  return cuotas
}

export function siguienteFolio(prefijo: string, existentes: string[]): string {
  const anio = new Date().getFullYear()
  const marca = `${prefijo}-${anio}-`
  let maximo = 0
  for (const folio of existentes) {
    if (!folio.startsWith(marca)) continue
    const n = Number(folio.slice(marca.length))
    if (Number.isFinite(n) && n > maximo) maximo = n
  }
  return `${marca}${String(maximo + 1).padStart(5, '0')}`
}
