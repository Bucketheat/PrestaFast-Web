export type TipoDocumento = 'ine_frente' | 'ine_reverso' | 'pagare' | 'foto_viva'

export type DocumentoCliente = {
  tipo: TipoDocumento
  nombre: string
  dataUrl: string
}

export type ReferenciaCliente = {
  nombre: string
  parentesco: string
  telefono: string
}

export type EstadoCuota = 'programada' | 'pendiente' | 'pagada' | 'parcial' | 'vencida'

export type CuotaCliente = {
  numero: number
  fecha: string
  monto: number
  estado: EstadoCuota
  pagado: number
  pagadoEn?: string
  cobradoPor?: string
}

export type EstadoPrestamo = 'pendiente_autorizacion' | 'activo' | 'liquidado' | 'rechazado'
export type EstadoCliente = 'pendiente_autorizacion' | 'activo' | 'bloqueado' | 'rechazado'
export type NivelConfianza = 'nuevo' | 'regular' | 'bueno' | 'confiable' | 'excelente'

export type PrestamoCliente = {
  id: string
  folio: string
  planId: string
  planNombre: string
  cuotaPorMil: number
  plazoPagos: number
  cobraDomingo: boolean
  desembolso: number
  cuotaDiaria: number
  total: number
  cargo: number
  fechaDesembolso: string
  fechaPrimerCobro: string
  estado: EstadoPrestamo
  cuotas: CuotaCliente[]
}

export type Cliente = {
  id: string
  numeroControl: string
  nombreCompleto: string
  fechaNacimiento: string
  telefono: string
  codigoPostal?: string
  entidadFederativa?: string
  municipio?: string
  colonia?: string
  domicilio: string
  referenciasUbicacion: string
  zona: string
  latitud?: number
  longitud?: number
  ineNumero: string
  ineVigencia: string
  pagareMonto: number
  pagareFecha: string
  documentos: DocumentoCliente[]
  referencias: ReferenciaCliente[]
  prestamo: PrestamoCliente
  prestamosAnteriores?: PrestamoCliente[]
  estado: EstadoCliente
  score: number
  nivel: NivelConfianza
  cobradorId?: string
  capturadoPor?: string
  creadoEn: string
}

export const CLIENTES_STORAGE_KEY = 'prestamos.clientes.v1'
