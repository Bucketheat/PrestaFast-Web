import type { ConfiguracionSistema } from './types'

export const STORAGE_KEY = 'prestamos.config.v1'

export const configuracionInicial: ConfiguracionSistema = {
  parametros: {
    cupoInicial: 2000,
    topePagare: 10000,
    desembolsoMultiplo: 1000,
    milesMinimos: 1,
    milesMaximos: 10,
    horaCierre: '21:00',
  },
  planes: [
    {
      id: 'plan-55',
      codigo: '55_30',
      nombre: 'Ligero',
      cuotaPorMil: 55,
      plazoPagos: 30,
      cobraDomingo: false,
      activo: true,
      esDefault: true,
    },
    {
      id: 'plan-60',
      codigo: '60_30',
      nombre: 'Intermedio',
      cuotaPorMil: 60,
      plazoPagos: 30,
      cobraDomingo: false,
      activo: true,
      esDefault: false,
    },
    {
      id: 'plan-65',
      codigo: '65_30',
      nombre: 'Clásico',
      cuotaPorMil: 65,
      plazoPagos: 30,
      cobraDomingo: false,
      activo: true,
      esDefault: false,
    },
  ],
}
