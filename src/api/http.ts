const API_BASE = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export function apiUrl(ruta: string) {
  if (/^https?:\/\//.test(ruta)) return ruta
  const camino = ruta.startsWith('/') ? ruta : `/${ruta}`
  return `${API_BASE}${camino}`
}

export function authHeaders(): HeadersInit {
  const token = sessionStorage.getItem('prestamos.token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
export function haySesionApi() {
  return Boolean(sessionStorage.getItem('prestamos.token'))
}

export function hayApiRemota() {
  return Boolean(API_BASE)
}

export async function apiJson<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(ruta), {
    ...init,
    headers: {
      ...authHeaders(),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const cuerpo = (await res.json().catch(() => ({}))) as { message?: string | string[] }
    const mensaje = Array.isArray(cuerpo.message) ? cuerpo.message.join(', ') : cuerpo.message
    throw new Error(mensaje || 'No se pudo completar la operación')
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
