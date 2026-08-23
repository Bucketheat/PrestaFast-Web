import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiJson, haySesionApi } from '../api/http'
import { GASTOS_STORAGE_KEY, type EstadoGasto, type Gasto } from '../domain/gasto'
import { useAuth } from './AuthProvider'

type GastosContextValue = {
  gastos: Gasto[]
  registrar: (gasto: Omit<Gasto, 'id' | 'creadoEn' | 'capturadoPor' | 'estado'> & { id?: string }) => Promise<Gasto>
  aprobar: (id: string) => Promise<void>
  rechazar: (id: string) => Promise<void>
  eliminar: (id: string) => Promise<void>
}

const GastosContext = createContext<GastosContextValue | null>(null)

function leerGastos(): Gasto[] {
  try {
    const raw = localStorage.getItem(GASTOS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Gasto[]
    return Array.isArray(parsed)
      ? parsed.map((item) => ({ ...item, estado: item.estado ?? 'aprobado' }))
      : []
  } catch {
    return []
  }
}

export function GastosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [gastos, setGastos] = useState<Gasto[]>(leerGastos)

  useEffect(() => {
    let vivo = true
    void (async () => {
      if (!usuario || !haySesionApi()) return
      try {
        const remotos = await apiJson<Gasto[]>('/api/gastos')
        if (vivo) {
          setGastos(remotos)
          localStorage.setItem(GASTOS_STORAGE_KEY, JSON.stringify(remotos))
        }
      } catch {
        // Sin API se queda lo local.
      }
    })()
    return () => {
      vivo = false
    }
  }, [usuario])

  const value = useMemo<GastosContextValue>(() => {
    async function decidir(id: string, estado: EstadoGasto) {
      if (haySesionApi()) {
        const ruta = estado === 'aprobado' ? 'aprobar' : 'rechazar'
        const guardado = await apiJson<Gasto>(`/api/gastos/${id}/${ruta}`, { method: 'PATCH' })
        setGastos((actual) => actual.map((item) => (item.id === id ? { ...item, ...guardado } : item)))
        return
      }
      setGastos((actual) => {
        const siguiente = actual.map((item) => (item.id === id ? { ...item, estado } : item))
        localStorage.setItem(GASTOS_STORAGE_KEY, JSON.stringify(siguiente))
        return siguiente
      })
    }

    return {
      gastos,
      async registrar(entrada) {
        const gasto: Gasto = {
          id: entrada.id || crypto.randomUUID(),
          fecha: entrada.fecha,
          tipo: entrada.tipo,
          concepto: entrada.concepto.trim(),
          monto: Math.max(0, Number(entrada.monto) || 0),
          usuarioId: usuario?.rol === 'cobrador' ? usuario.id : entrada.usuarioId,
          capturadoPor: usuario?.nombre || 'Administrador',
          evidenciaNombre: entrada.evidenciaNombre,
          evidenciaDataUrl: entrada.evidenciaDataUrl,
          estado: usuario?.rol === 'cobrador' ? 'pendiente_autorizacion' : 'aprobado',
          creadoEn: new Date().toISOString(),
        }
        if (haySesionApi()) {
          const guardado = await apiJson<Gasto>('/api/gastos', {
            method: 'POST',
            body: JSON.stringify(gasto),
          })
          setGastos((actual) => [guardado, ...actual.filter((item) => item.id !== guardado.id)])
          return guardado
        }
        setGastos((actual) => {
          const siguiente = [gasto, ...actual]
          localStorage.setItem(GASTOS_STORAGE_KEY, JSON.stringify(siguiente))
          return siguiente
        })
        return gasto
      },
      async aprobar(id) {
        await decidir(id, 'aprobado')
      },
      async rechazar(id) {
        await decidir(id, 'rechazado')
      },
      async eliminar(id) {
        if (haySesionApi()) {
          await apiJson(`/api/gastos/${id}`, { method: 'DELETE' })
        }
        setGastos((actual) => {
          const siguiente = actual.filter((item) => item.id !== id)
          localStorage.setItem(GASTOS_STORAGE_KEY, JSON.stringify(siguiente))
          return siguiente
        })
      },
    }
  }, [gastos, usuario])

  return <GastosContext.Provider value={value}>{children}</GastosContext.Provider>
}

export function useGastos() {
  const ctx = useContext(GastosContext)
  if (!ctx) throw new Error('useGastos debe usarse dentro de GastosProvider')
  return ctx
}
