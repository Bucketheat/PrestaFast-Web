import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiJson, haySesionApi } from '../api/http'
import { CIERRES_STORAGE_KEY, type CierreRuta } from '../domain/cierre'
import { useAuth } from './AuthProvider'

type CierresContextValue = {
  cierres: CierreRuta[]
  cerrarRuta: (cierre: CierreRuta) => Promise<CierreRuta>
  cierreDeHoy: (cobradorId: string, fecha: string) => CierreRuta | undefined
}

const CierresContext = createContext<CierresContextValue | null>(null)

function leerCierres(): CierreRuta[] {
  try {
    const raw = localStorage.getItem(CIERRES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CierreRuta[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CierresProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [cierres, setCierres] = useState<CierreRuta[]>(leerCierres)

  useEffect(() => {
    let vivo = true
    void (async () => {
      if (!usuario || !haySesionApi()) return
      try {
        const remotos = await apiJson<CierreRuta[]>('/api/cierres')
        if (vivo) {
          setCierres(remotos)
          localStorage.setItem(CIERRES_STORAGE_KEY, JSON.stringify(remotos))
        }
      } catch {
        // Sin API se queda lo local.
      }
    })()
    return () => {
      vivo = false
    }
  }, [usuario])

  const value = useMemo<CierresContextValue>(
    () => ({
      cierres,
      async cerrarRuta(cierre) {
        if (haySesionApi()) {
          const guardado = await apiJson<CierreRuta>('/api/cierres', {
            method: 'POST',
            body: JSON.stringify(cierre),
          })
          setCierres((actual) => [guardado, ...actual.filter((item) => item.id !== guardado.id)])
          return guardado
        }
        setCierres((actual) => {
          const siguiente = [cierre, ...actual]
          localStorage.setItem(CIERRES_STORAGE_KEY, JSON.stringify(siguiente))
          return siguiente
        })
        return cierre
      },
      cierreDeHoy(cobradorId, fecha) {
        return cierres.find((item) => item.cobradorId === cobradorId && item.fecha === fecha)
      },
    }),
    [cierres],
  )

  return <CierresContext.Provider value={value}>{children}</CierresContext.Provider>
}

export function useCierres() {
  const ctx = useContext(CierresContext)
  if (!ctx) throw new Error('useCierres debe usarse dentro de CierresProvider')
  return ctx
}
