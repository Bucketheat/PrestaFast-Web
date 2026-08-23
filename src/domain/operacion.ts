import { hoyIso } from './calendario'
import { anioFinIne } from './ine'
import type { Cliente, CuotaCliente, NivelConfianza, PrestamoCliente } from './cliente'

export type Severidad = 'alta' | 'media' | 'baja'

export type Alerta = {
  id: string
  tipo: string
  severidad: Severidad
  titulo: string
  detalle: string
  clienteId?: string
}

export function sincronizarCuotas(cuotas: CuotaCliente[], prestamoActivo: boolean): CuotaCliente[] {
  const hoy = hoyIso()
  return cuotas.map((cuota) => {
    if (cuota.estado === 'pagada' || cuota.pagado >= cuota.monto) {
      return { ...cuota, estado: 'pagada', pagado: cuota.monto, pagadoEn: cuota.pagadoEn, cobradoPor: cuota.cobradoPor }
    }
    if (!prestamoActivo) return cuota
    if (cuota.fecha < hoy) return { ...cuota, estado: 'vencida' }
    if (cuota.fecha === hoy) return { ...cuota, estado: cuota.pagado > 0 ? 'parcial' : 'pendiente' }
    return { ...cuota, estado: 'programada' }
  })
}

export function nivelDeScore(score: number): NivelConfianza {
  if (score >= 85) return 'excelente'
  if (score >= 75) return 'confiable'
  if (score >= 65) return 'bueno'
  if (score >= 55) return 'regular'
  return 'nuevo'
}

export function calcularPuntualidad(prestamo: PrestamoCliente): number {
  const exigibles = prestamo.cuotas.filter((cuota) => cuota.estado !== 'programada')
  if (exigibles.length === 0) return 100
  const aTiempo = exigibles.filter((cuota) => cuota.estado === 'pagada').length
  return Math.round((aTiempo / exigibles.length) * 100)
}

export function diasVencidos(prestamo: PrestamoCliente): number {
  return prestamo.cuotas.filter((cuota) => cuota.estado === 'vencida').length
}

export function calcularScore(cliente: Cliente): number {
  const prestamo = {
    ...cliente.prestamo,
    cuotas: sincronizarCuotas(cliente.prestamo.cuotas, cliente.estado === 'activo' && cliente.prestamo.estado === 'activo'),
  }
  let score = 50
  const pagadas = prestamo.cuotas.filter((cuota) => cuota.estado === 'pagada').length
  const parciales = prestamo.cuotas.filter((cuota) => cuota.estado === 'parcial').length
  const vencidas = diasVencidos(prestamo)

  score += pagadas * 0.4
  score -= parciales * 0.5
  score -= vencidas * 2
  if (vencidas >= 3) score -= 6
  if (vencidas >= 7) score -= 15
  if (prestamo.estado === 'liquidado' && vencidas === 0) score += 8
  if (prestamo.estado === 'liquidado' && vencidas > 0 && vencidas <= 2) score += 4

  const expedienteCompleto =
    Boolean(cliente.documentos.find((doc) => doc.tipo === 'ine_frente')) &&
    Boolean(cliente.documentos.find((doc) => doc.tipo === 'pagare')) &&
    Boolean(cliente.documentos.find((doc) => doc.tipo === 'evidencia_domicilio'))
  if (!expedienteCompleto) score = Math.min(score, 50)

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10))
}

export function hidratarCliente(cliente: Cliente): Cliente {
  const activo = (cliente.estado ?? 'activo') === 'activo' && (cliente.prestamo.estado ?? 'activo') === 'activo'
  const prestamo: PrestamoCliente = {
    ...cliente.prestamo,
    estado: cliente.prestamo.estado ?? 'activo',
    cuotas: sincronizarCuotas(cliente.prestamo.cuotas, activo),
  }
  const base: Cliente = {
    ...cliente,
    estado: cliente.estado ?? 'activo',
    prestamo,
    score: 50,
    nivel: 'nuevo',
  }
  const score = calcularScore(base)
  return { ...base, score, nivel: nivelDeScore(score) }
}

export function generarAlertas(clientes: Cliente[]): Alerta[] {
  const hoy = hoyIso()
  const alertas: Alerta[] = []

  for (const cliente of clientes.map(hidratarCliente)) {
    if (cliente.estado === 'pendiente_autorizacion') {
      alertas.push({
        id: `aprobar-${cliente.id}`,
        tipo: 'pendiente_autorizacion',
        severidad: 'alta',
        titulo: 'Alta por autorizar',
        detalle: `${cliente.nombreCompleto} · ${cliente.numeroControl} espera tu visto bueno.`,
        clienteId: cliente.id,
      })
    }

    const vencidas = cliente.prestamo.cuotas.filter((cuota) => cuota.estado === 'vencida')
    if (vencidas.length > 0) {
      const monto = vencidas.reduce((suma, cuota) => suma + (cuota.monto - cuota.pagado), 0)
      alertas.push({
        id: `vencido-${cliente.id}`,
        tipo: 'pago_vencido',
        severidad: vencidas.length >= 7 ? 'alta' : vencidas.length >= 3 ? 'media' : 'baja',
        titulo: `${vencidas.length} pago(s) vencido(s)`,
        detalle: `${cliente.nombreCompleto} debe ${monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })}.`,
        clienteId: cliente.id,
      })
    }

    const deHoy = cliente.prestamo.cuotas.find((cuota) => cuota.fecha === hoy && cuota.estado !== 'pagada')
    if (deHoy && cliente.estado === 'activo') {
      alertas.push({
        id: `hoy-${cliente.id}`,
        tipo: 'cuota_hoy',
        severidad: 'media',
        titulo: 'Cuota de hoy sin cobrar',
        detalle: `${cliente.nombreCompleto} · $${deHoy.monto}`,
        clienteId: cliente.id,
      })
    }

    const anioFin = cliente.ineVigencia ? anioFinIne(cliente.ineVigencia) : null
    const anioActual = new Date().getFullYear()
    if (anioFin != null && anioFin < anioActual) {
      alertas.push({
        id: `ine-vencida-${cliente.id}`,
        tipo: 'ine_vencida',
        severidad: 'alta',
        titulo: 'INE vencida',
        detalle: `${cliente.nombreCompleto} · vigencia ${cliente.ineVigencia}`,
        clienteId: cliente.id,
      })
    } else if (anioFin != null && anioFin === anioActual) {
      alertas.push({
        id: `ine-por-vencer-${cliente.id}`,
        tipo: 'ine_por_vencer',
        severidad: 'media',
        titulo: 'INE vence este año',
        detalle: `${cliente.nombreCompleto} · ${cliente.ineVigencia}`,
        clienteId: cliente.id,
      })
    }

    if (!cliente.documentos.some((doc) => doc.tipo === 'ine_frente')) {
      alertas.push({
        id: `sin-ine-${cliente.id}`,
        tipo: 'sin_ine',
        severidad: 'alta',
        titulo: 'Falta INE',
        detalle: cliente.nombreCompleto,
        clienteId: cliente.id,
      })
    }

    if (!cliente.documentos.some((doc) => doc.tipo === 'pagare')) {
      alertas.push({
        id: `sin-pagare-${cliente.id}`,
        tipo: 'sin_pagare',
        severidad: 'alta',
        titulo: 'Falta pagaré',
        detalle: cliente.nombreCompleto,
        clienteId: cliente.id,
      })
    }

    if (!cliente.documentos.some((doc) => doc.tipo === 'evidencia_domicilio')) {
      alertas.push({
        id: `sin-evidencia-${cliente.id}`,
        tipo: 'sin_evidencia_domicilio',
        severidad: 'alta',
        titulo: 'Falta evidencia frente a la casa',
        detalle: `${cliente.nombreCompleto} no tiene foto de registro en el domicilio.`,
        clienteId: cliente.id,
      })
    }

    if (cliente.latitud == null || cliente.longitud == null) {
      alertas.push({
        id: `sin-gps-${cliente.id}`,
        tipo: 'sin_gps',
        severidad: 'baja',
        titulo: 'Sin ubicación GPS',
        detalle: `${cliente.nombreCompleto} no está pinchado en el mapa.`,
        clienteId: cliente.id,
      })
    }

    if (cliente.score < 40 && cliente.estado === 'activo') {
      alertas.push({
        id: `score-${cliente.id}`,
        tipo: 'score_bajo',
        severidad: 'media',
        titulo: 'Score bajo',
        detalle: `${cliente.nombreCompleto} · ${cliente.score} · ${cliente.nivel}`,
        clienteId: cliente.id,
      })
    }

    if (cliente.prestamo.estado === 'liquidado') {
      alertas.push({
        id: `renovar-${cliente.id}`,
        tipo: 'listo_renovar',
        severidad: 'baja',
        titulo: 'Listo para renovar',
        detalle: `${cliente.nombreCompleto} ya liquidó. Score ${cliente.score}.`,
        clienteId: cliente.id,
      })
    }
  }

  const orden = { alta: 0, media: 1, baja: 2 }
  return alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad])
}

export function estadisticasCartera(clientes: Cliente[]) {
  const hidratados = clientes.map(hidratarCliente)
  const activos = hidratados.filter((c) => c.estado === 'activo' && c.prestamo.estado === 'activo')
  const hoy = hoyIso()
  const esperadoHoy = activos.reduce((suma, cliente) => {
    const cuota = cliente.prestamo.cuotas.find((item) => item.fecha === hoy)
    return suma + (cuota && cuota.estado !== 'pagada' ? cuota.monto - cuota.pagado : 0)
  }, 0)
  const cobradoHoy = hidratados.reduce((suma, cliente) => {
    return (
      suma +
      cliente.prestamo.cuotas
        .filter((cuota) =>
          cuota.pagadoEn === hoy || (cuota.fecha === hoy && cuota.estado === 'pagada'),
        )
        .reduce((acc, cuota) => acc + cuota.pagado, 0)
    )
  }, 0)
  const vencido = activos.reduce((suma, cliente) => {
    return suma + cliente.prestamo.cuotas.filter((c) => c.estado === 'vencida').reduce((acc, c) => acc + c.monto - c.pagado, 0)
  }, 0)
  const enCalle = activos.reduce((suma, cliente) => suma + (cliente.prestamo.total - cliente.prestamo.cuotas.reduce((acc, c) => acc + c.pagado, 0)), 0)
  const scorePromedio = hidratados.length
    ? Math.round((hidratados.reduce((suma, c) => suma + c.score, 0) / hidratados.length) * 10) / 10
    : 0

  return {
    clientes: hidratados.length,
    activos: activos.length,
    pendientes: hidratados.filter((c) => c.estado === 'pendiente_autorizacion').length,
    vencidos: hidratados.filter((c) => c.prestamo.cuotas.some((cuota) => cuota.estado === 'vencida')).length,
    esperadoHoy,
    cobradoHoy,
    vencido,
    enCalle,
    scorePromedio,
  }
}
