import { z } from 'zod'

export const planSchema = z.object({
  id: z.string().optional(),
  codigo: z.string().min(2, 'Escribe un código'),
  nombre: z.string().min(2, 'Escribe un nombre'),
  cuotaPorMil: z.coerce.number().positive('Debe ser mayor a 0'),
  plazoPagos: z.coerce.number().int().min(1, 'Mínimo 1 pago').max(90, 'Máximo 90 pagos'),
  cobraDomingo: z.boolean(),
  activo: z.boolean(),
  esDefault: z.boolean(),
})

export const parametrosSchema = z.object({
  cupoInicial: z.coerce.number().positive(),
  topePagare: z.coerce.number().positive(),
  desembolsoMultiplo: z.coerce.number().positive(),
  milesMinimos: z.coerce.number().int().min(1),
  milesMaximos: z.coerce.number().int().min(1).max(50),
  horaCierre: z.string().min(4),
})

export const clienteAltaSchema = z.object({
  nombreCompleto: z.string().min(5, 'Escribe el nombre completo'),
  fechaNacimiento: z.string().min(8, 'Captura la fecha de nacimiento'),
  telefono: z.string().min(8, 'Captura el teléfono'),
  codigoPostal: z.string().regex(/^\d{5}$/, 'El CP debe tener 5 dígitos'),
  entidadFederativa: z.string().min(2, 'Captura o espera el estado'),
  municipio: z.string().min(2, 'Captura o espera el municipio'),
  colonia: z.string().min(2, 'Elige o escribe la colonia'),
  domicilio: z.string().min(3, 'Captura calle y número'),
  referenciasUbicacion: z.string().min(3, 'Agrega una referencia de ubicación'),
  zona: z.string().min(2, 'Asigna zona o ruta'),
  ineNumero: z.string().min(6, 'Captura el número de INE'),
  ineAnioEmision: z.coerce.number().int().min(2000, 'Año de emisión').max(2100),
  ineAnioVigencia: z.coerce.number().int().min(2000, 'Año de vigencia').max(2100),
  pagareMonto: z.coerce.number().positive(),
  pagareFecha: z.string().min(8, 'Captura la fecha del pagaré'),
  referencia1Nombre: z.string(),
  referencia1Parentesco: z.string(),
  referencia1Telefono: z.string(),
  referencia2Nombre: z.string(),
  referencia2Parentesco: z.string(),
  referencia2Telefono: z.string(),
  planId: z.string().min(1, 'Elige un plan'),
  desembolso: z.coerce.number().positive('El desembolso debe ser mayor a 0'),
  fechaDesembolso: z.string().min(8, 'Captura la fecha de desembolso'),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
}).refine((data) => data.ineAnioVigencia >= data.ineAnioEmision, {
  message: 'El año de vigencia no puede ser menor al de emisión',
  path: ['ineAnioVigencia'],
}).refine((data) => Number.isFinite(data.latitud) && Number.isFinite(data.longitud), {
  message: 'Fija el pin en el mapa del domicilio antes de desembolsar',
  path: ['latitud'],
})

export const usuarioSchema = z.object({
  nombre: z.string().min(3, 'Escribe el nombre'),
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-z0-9._-]+$/, 'Solo minúsculas, números, punto, guion o guion bajo'),
  telefono: z.string().optional(),
  rol: z.enum(['admin', 'cobrador']),
  activo: z.boolean(),
  clave: z.string().optional(),
})

export type PlanFormValues = z.infer<typeof planSchema>
export type ParametrosFormValues = z.infer<typeof parametrosSchema>
export type ClienteAltaValues = z.infer<typeof clienteAltaSchema>
export type UsuarioFormValues = z.infer<typeof usuarioSchema>
