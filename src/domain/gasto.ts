export const GASTOS_STORAGE_KEY = 'prestamos.gastos.v1'

export const TIPOS_GASTO = ['gasolina', 'nomina', 'comida', 'recarga', 'papeleria', 'renta', 'otro'] as const

export type TipoGasto = (typeof TIPOS_GASTO)[number]
export type EstadoGasto = 'pendiente_autorizacion' | 'aprobado' | 'rechazado'

export type Gasto = {
  id: string
  fecha: string
  tipo: TipoGasto
  concepto: string
  monto: number
  usuarioId?: string
  capturadoPor: string
  evidenciaNombre?: string
  evidenciaDataUrl?: string
  estado: EstadoGasto
  creadoEn: string
}

export const etiquetaTipoGasto: Record<TipoGasto, string> = {
  gasolina: 'Gasolina',
  nomina: 'Nómina',
  comida: 'Comida',
  recarga: 'Recarga / datos',
  papeleria: 'Papelería',
  renta: 'Renta',
  otro: 'Otro',
}

export const etiquetaEstadoGasto: Record<EstadoGasto, string> = {
  pendiente_autorizacion: 'Por autorizar',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

export function resumenGastos(gastos: Gasto[], anioMes: string) {
  const delMes = gastos.filter((item) => item.fecha.startsWith(anioMes) && item.estado === 'aprobado')
  const suma = (tipo?: TipoGasto) =>
    delMes.filter((item) => !tipo || item.tipo === tipo).reduce((acc, item) => acc + item.monto, 0)
  return {
    delMes,
    total: suma(),
    nomina: suma('nomina'),
    gasolina: suma('gasolina'),
    otros: suma() - suma('nomina') - suma('gasolina'),
  }
}
