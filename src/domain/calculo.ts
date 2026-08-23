import type { FilaTabulador, PlanCobro, ParametrosSistema, SimulacionPrestamo } from './types'

export function money(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  })
}

export function simularPrestamo(desembolso: number, plan: PlanCobro): SimulacionPrestamo {
  const miles = desembolso / 1000
  const cuotaDiaria = miles * plan.cuotaPorMil
  const total = cuotaDiaria * plan.plazoPagos

  return {
    desembolso,
    cuotaDiaria,
    pagos: plan.plazoPagos,
    total,
    cargo: total - desembolso,
    cobraDomingo: plan.cobraDomingo,
  }
}

export function generarTabulador(plan: PlanCobro, parametros: ParametrosSistema): FilaTabulador[] {
  const filas: FilaTabulador[] = []

  for (let miles = parametros.milesMinimos; miles <= parametros.milesMaximos; miles += 1) {
    const desembolso = miles * parametros.desembolsoMultiplo
    const simulacion = simularPrestamo(desembolso, plan)
    filas.push({
      id: miles,
      miles,
      desembolso,
      cuotaDiaria: simulacion.cuotaDiaria,
      pagos: simulacion.pagos,
      total: simulacion.total,
      cargo: simulacion.cargo,
    })
  }

  return filas
}

export function planPorDefecto(planes: PlanCobro[]): PlanCobro {
  return planes.find((plan) => plan.esDefault && plan.activo) ?? planes[0]
}
