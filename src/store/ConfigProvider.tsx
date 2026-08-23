import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiJson, haySesionApi } from '../api/http'
import { configuracionInicial, STORAGE_KEY } from '../domain/defaults'
import type { ConfiguracionSistema, ParametrosSistema, PlanCobro } from '../domain/types'
import { useAuth } from './AuthProvider'

type ConfigContextValue = {
  config: ConfiguracionSistema
  guardarParametros: (parametros: ParametrosSistema) => void
  guardarPlan: (plan: PlanCobro) => void
  eliminarPlan: (id: string) => void
  restaurar: () => void
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

function leerConfig(): ConfiguracionSistema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return configuracionInicial
    const parsed = JSON.parse(raw) as ConfiguracionSistema
    if (!parsed.parametros || !Array.isArray(parsed.planes) || parsed.planes.length === 0) {
      return configuracionInicial
    }
    return parsed
  } catch {
    return configuracionInicial
  }
}

function persistir(config: ConfiguracionSistema) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [config, setConfig] = useState<ConfiguracionSistema>(leerConfig)

  useEffect(() => {
    let vivo = true
    void (async () => {
      if (!usuario || !haySesionApi()) return
      try {
        const [parametros, planes] = await Promise.all([
          apiJson<ParametrosSistema>('/api/parametros'),
          apiJson<PlanCobro[]>('/api/planes'),
        ])
        if (!vivo || !parametros || !Array.isArray(planes) || planes.length === 0) return
        const siguiente = { parametros, planes }
        persistir(siguiente)
        setConfig(siguiente)
      } catch {
        // Sin API se queda lo local.
      }
    })()
    return () => {
      vivo = false
    }
  }, [usuario])

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      guardarParametros(parametros) {
        setConfig((actual) => {
          const siguiente = { ...actual, parametros }
          persistir(siguiente)
          return siguiente
        })
        if (haySesionApi()) {
          void apiJson('/api/parametros', { method: 'PUT', body: JSON.stringify(parametros) }).catch(() => undefined)
        }
      },
      guardarPlan(plan) {
        setConfig((actual) => {
          const existe = actual.planes.some((item) => item.id === plan.id)
          let planes = existe
            ? actual.planes.map((item) => (item.id === plan.id ? plan : item))
            : [...actual.planes, plan]

          if (plan.esDefault) {
            planes = planes.map((item) => ({ ...item, esDefault: item.id === plan.id }))
          }

          const siguiente = { ...actual, planes }
          persistir(siguiente)
          if (haySesionApi()) {
            const metodo = existe ? 'PUT' : 'POST'
            const ruta = existe ? `/api/planes/${plan.id}` : '/api/planes'
            void apiJson(ruta, { method: metodo, body: JSON.stringify(plan) }).catch(() => undefined)
          }
          return siguiente
        })
      },
      eliminarPlan(id) {
        setConfig((actual) => {
          if (actual.planes.length <= 1) return actual
          const planes = actual.planes.filter((item) => item.id !== id)
          if (!planes.some((item) => item.esDefault) && planes[0]) {
            planes[0] = { ...planes[0], esDefault: true }
          }
          const siguiente = { ...actual, planes }
          persistir(siguiente)
          if (haySesionApi()) {
            void apiJson(`/api/planes/${id}`, { method: 'DELETE' }).catch(() => undefined)
          }
          return siguiente
        })
      },
      restaurar() {
        persistir(configuracionInicial)
        setConfig(configuracionInicial)
        if (haySesionApi()) {
          void apiJson('/api/parametros', {
            method: 'PUT',
            body: JSON.stringify(configuracionInicial.parametros),
          }).catch(() => undefined)
        }
      },
    }),
    [config],
  )

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig debe usarse dentro de ConfigProvider')
  return ctx
}
