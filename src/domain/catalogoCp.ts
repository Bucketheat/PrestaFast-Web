import { apiUrl } from '../api/http'

export type CatalogoCp = {
  cp: string
  estado: string
  municipio: string
  ciudad?: string
  colonias: string[]
}

export async function consultarCodigoPostal(cp: string): Promise<CatalogoCp> {
  const clave = cp.replace(/\D/g, '').padStart(5, '0')
  const errores: string[] = []

  try {
    const local = await fetch(apiUrl(`/api/catalogos/cp/${clave}`))
    if (local.ok) return (await local.json()) as CatalogoCp
    if (local.status === 404) throw new Error('CP no encontrado')
  } catch (error) {
    errores.push(error instanceof Error ? error.message : 'API local')
  }

  const remoto = await consultarPostali(clave)
  if (remoto) return remoto

  throw new Error(errores.includes('CP no encontrado') ? 'Ese código postal no existe' : 'No se pudo consultar el CP')
}

async function consultarPostali(cp: string): Promise<CatalogoCp | null> {
  try {
    const res = await fetch(`https://postali.app/api/v1/mx/cp/${cp}`)
    if (!res.ok) return null
    const data = (await res.json()) as {
      estado?: string
      municipio?: string
      asentamientos?: Array<{ nombre?: string }>
    }
    const colonias = [...new Set((data.asentamientos ?? []).map((item) => item.nombre?.trim() ?? '').filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, 'es'),
    )
    if (!data.estado || !data.municipio || colonias.length === 0) return null
    return { cp, estado: data.estado, municipio: data.municipio, colonias }
  } catch {
    return null
  }
}
