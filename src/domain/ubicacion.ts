import { apiUrl } from '../api/http'
import type { Cliente } from './cliente'

export type Coordenadas = {
  latitud: number
  longitud: number
}

export function direccionCompleta(cliente: Pick<Cliente, 'domicilio' | 'colonia' | 'municipio' | 'entidadFederativa' | 'codigoPostal'>) {
  return [
    cliente.domicilio,
    cliente.colonia,
    cliente.municipio,
    cliente.entidadFederativa,
    cliente.codigoPostal,
    'México',
  ]
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join(', ')
}

export function tieneCoordenadas(cliente: Pick<Cliente, 'latitud' | 'longitud'>): cliente is Cliente & Coordenadas {
  return Number.isFinite(cliente.latitud) && Number.isFinite(cliente.longitud)
}

export async function geocodificarDireccion(direccion: string): Promise<Coordenadas | null> {
  const q = direccion.trim()
  if (q.length < 8) return null
  return (await desdeApi(q)) ?? (await desdePhoton(q)) ?? (await desdeNominatim(q))
}

async function desdeApi(q: string): Promise<Coordenadas | null> {
  try {
    const res = await fetch(apiUrl(`/api/catalogos/geocodificar?q=${encodeURIComponent(q)}`))
    if (!res.ok) return null
    const data = (await res.json()) as { latitud?: number; longitud?: number }
    if (Number.isFinite(data.latitud) && Number.isFinite(data.longitud)) {
      return { latitud: data.latitud as number, longitud: data.longitud as number }
    }
    return null
  } catch {
    return null
  }
}

async function desdePhoton(q: string): Promise<Coordenadas | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=es&limit=1`)
    if (!res.ok) return null
    const data = (await res.json()) as { features?: Array<{ geometry?: { coordinates?: number[] } }> }
    const coords = data.features?.[0]?.geometry?.coordinates
    if (!coords || coords.length < 2) return null
    return { longitud: coords[0], latitud: coords[1] }
  } catch {
    return null
  }
}

async function desdeNominatim(q: string): Promise<Coordenadas | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=mx&q=${encodeURIComponent(q)}`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>
    if (!data[0]?.lat || !data[0]?.lon) return null
    return { latitud: Number(data[0].lat), longitud: Number(data[0].lon) }
  } catch {
    return null
  }
}
