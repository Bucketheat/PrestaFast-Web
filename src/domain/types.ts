export type PlanCobro = {
  id: string
  codigo: string
  nombre: string
  cuotaPorMil: number
  plazoPagos: number
  cobraDomingo: boolean
  activo: boolean
  esDefault: boolean
}

export type ParametrosSistema = {
  cupoInicial: number
  topePagare: number
  desembolsoMultiplo: number
  milesMinimos: number
  milesMaximos: number
  horaCierre: string
}

export type ConfiguracionSistema = {
  parametros: ParametrosSistema
  planes: PlanCobro[]
}

export type FilaTabulador = {
  id: number
  miles: number
  desembolso: number
  cuotaDiaria: number
  pagos: number
  total: number
  cargo: number
}

export type SimulacionPrestamo = {
  desembolso: number
  cuotaDiaria: number
  pagos: number
  total: number
  cargo: number
  cobraDomingo: boolean
}
