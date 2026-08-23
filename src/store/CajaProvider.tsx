import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiJson, haySesionApi } from '../api/http'
import { CAJA_STORAGE_KEY, cajaInicial, type EstadoCaja } from '../domain/caja'
import { useAuth } from './AuthProvider'

type CajaContextValue = {
  caja: EstadoCaja
  guardar: (valores: Pick<EstadoCaja, 'capitalInicial' | 'capitalYaPrestada'>) => void
}

const CajaContext = createContext<CajaContextValue | null>(null)

function leerCaja(): EstadoCaja {
  try {
    const raw = localStorage.getItem(CAJA_STORAGE_KEY)
    if (!raw) return cajaInicial
    const parsed = JSON.parse(raw) as EstadoCaja
    if (typeof parsed.capitalInicial !== 'number') return cajaInicial
    return {
      capitalInicial: parsed.capitalInicial,
      capitalYaPrestada: parsed.capitalYaPrestada ?? 0,
      actualizadoEn: parsed.actualizadoEn ?? new Date().toISOString(),
    }
  } catch {
    return cajaInicial
  }
}

function persistirLocal(caja: EstadoCaja) {
  localStorage.setItem(CAJA_STORAGE_KEY, JSON.stringify(caja))
}

export function CajaProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [caja, setCaja] = useState<EstadoCaja>(leerCaja)

  useEffect(() => {
    let vivo = true
    void (async () => {
      if (!usuario || !haySesionApi()) return
      try {
        const remota = await apiJson<EstadoCaja>('/api/caja')
        if (vivo) {
          persistirLocal(remota)
          setCaja(remota)
        }
      } catch {
        // Sin API se queda lo local.
      }
    })()
    return () => {
      vivo = false
    }
  }, [usuario])

  const value = useMemo<CajaContextValue>(
    () => ({
      caja,
      guardar(valores) {
        const siguiente: EstadoCaja = {
          capitalInicial: Math.max(0, Number(valores.capitalInicial) || 0),
          capitalYaPrestada: Math.max(0, Number(valores.capitalYaPrestada) || 0),
          actualizadoEn: new Date().toISOString(),
        }
        persistirLocal(siguiente)
        setCaja(siguiente)
        if (haySesionApi()) {
          void apiJson<EstadoCaja>('/api/caja', {
            method: 'PUT',
            body: JSON.stringify(siguiente),
          }).then((remota) => {
            persistirLocal(remota)
            setCaja(remota)
          }).catch(() => undefined)
        }
      },
    }),
    [caja],
  )

  return <CajaContext.Provider value={value}>{children}</CajaContext.Provider>
}

export function useCaja() {
  const ctx = useContext(CajaContext)
  if (!ctx) throw new Error('useCaja debe usarse dentro de CajaProvider')
  return ctx
}
