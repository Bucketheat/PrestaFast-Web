import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiJson, haySesionApi } from '../api/http'
import { CLIENTES_STORAGE_KEY, type Cliente, type PrestamoCliente } from '../domain/cliente'
import { hidratarCliente } from '../domain/operacion'
import { useAuth } from './AuthProvider'

type ClientesContextValue = {
  clientes: Cliente[]
  registrar: (cliente: Cliente) => Promise<void>
  actualizar: (cliente: Cliente) => Promise<void>
  buscarPorId: (id: string) => Cliente | undefined
  cargarDetalle: (id: string) => Promise<Cliente | undefined>
  ineDuplicada: (ineNumero: string, exceptId?: string) => boolean
  aprobar: (id: string) => Promise<void>
  rechazar: (id: string) => Promise<void>
  cobrar: (id: string, cuotaNumero?: number) => Promise<Cliente>
  renovar: (
    id: string,
    prestamo: PrestamoCliente,
    extras?: { pagareMonto?: number; pagareFecha?: string },
  ) => Promise<Cliente>
}

const ClientesContext = createContext<ClientesContextValue | null>(null)

function leerClientes(): Cliente[] {
  try {
    const raw = localStorage.getItem(CLIENTES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Cliente[]
    return Array.isArray(parsed) ? parsed.map(hidratarCliente) : []
  } catch {
    return []
  }
}

function persistirLocal(clientes: Cliente[]) {
  localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(clientes))
}

function borrarLocal() {
  localStorage.removeItem(CLIENTES_STORAGE_KEY)
}

export function ClientesProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>(leerClientes)

  useEffect(() => {
    let vivo = true
    void (async () => {
      if (!usuario || !haySesionApi()) return
      const locales = leerClientes()
      try {
        if (locales.length > 0) {
          await apiJson('/api/clientes/importar', {
            method: 'POST',
            body: JSON.stringify({ clientes: locales }),
          })
          borrarLocal()
        }
        const remotos = await apiJson<Cliente[]>('/api/clientes')
        if (vivo) setClientes(remotos.map(hidratarCliente))
      } catch {
        // Sin API se sigue con lo que haya en memoria.
      }
    })()
    return () => {
      vivo = false
    }
  }, [usuario])

  const value = useMemo<ClientesContextValue>(
    () => ({
      clientes: clientes.map(hidratarCliente),
      async registrar(cliente) {
        const hidratado = hidratarCliente(cliente)
        if (haySesionApi()) {
          const guardado = await apiJson<Cliente>('/api/clientes', {
            method: 'POST',
            body: JSON.stringify(hidratado),
          })
          setClientes((actual) => [hidratarCliente(guardado), ...actual.filter((item) => item.id !== guardado.id)])
          return
        }
        setClientes((actual) => {
          const siguiente = [hidratado, ...actual]
          persistirLocal(siguiente)
          return siguiente
        })
      },
      async actualizar(cliente) {
        const hidratado = hidratarCliente(cliente)
        if (haySesionApi()) {
          const guardado = await apiJson<Cliente>(`/api/clientes/${cliente.id}`, {
            method: 'PUT',
            body: JSON.stringify(hidratado),
          })
          setClientes((actual) => actual.map((item) => (item.id === cliente.id ? hidratarCliente(guardado) : item)))
          return
        }
        setClientes((actual) => {
          const siguiente = actual.map((item) => (item.id === cliente.id ? hidratado : item))
          persistirLocal(siguiente)
          return siguiente
        })
      },
      buscarPorId(id) {
        const cliente = clientes.find((item) => item.id === id)
        return cliente ? hidratarCliente(cliente) : undefined
      },
      async cargarDetalle(id) {
        if (!haySesionApi()) return clientes.find((item) => item.id === id)
        const detalle = await apiJson<Cliente>(`/api/clientes/${id}`)
        const hidratado = hidratarCliente(detalle)
        setClientes((actual) => {
          const existe = actual.some((item) => item.id === id)
          return existe ? actual.map((item) => (item.id === id ? hidratado : item)) : [hidratado, ...actual]
        })
        return hidratado
      },
      ineDuplicada(ineNumero, exceptId) {
        const clave = ineNumero.trim().toUpperCase()
        return clientes.some((item) => item.ineNumero.trim().toUpperCase() === clave && item.id !== exceptId)
      },
      async aprobar(id) {
        if (haySesionApi()) {
          const guardado = await apiJson<Cliente>(`/api/clientes/${id}/aprobar`, { method: 'PATCH' })
          setClientes((actual) => actual.map((item) => (item.id === id ? hidratarCliente(guardado) : item)))
          return
        }
        setClientes((actual) => {
          const siguiente = actual.map((item) =>
            item.id === id
              ? hidratarCliente({ ...item, estado: 'activo', prestamo: { ...item.prestamo, estado: 'activo' } })
              : item,
          )
          persistirLocal(siguiente)
          return siguiente
        })
      },
      async rechazar(id) {
        if (haySesionApi()) {
          const guardado = await apiJson<Cliente>(`/api/clientes/${id}/rechazar`, { method: 'PATCH' })
          setClientes((actual) => actual.map((item) => (item.id === id ? hidratarCliente(guardado) : item)))
          return
        }
        setClientes((actual) => {
          const siguiente = actual.map((item) =>
            item.id === id
              ? hidratarCliente({ ...item, estado: 'rechazado', prestamo: { ...item.prestamo, estado: 'rechazado' } })
              : item,
          )
          persistirLocal(siguiente)
          return siguiente
        })
      },
      async cobrar(id, cuotaNumero) {
        if (haySesionApi()) {
          const guardado = await apiJson<Cliente>(`/api/clientes/${id}/cobrar`, {
            method: 'PATCH',
            body: JSON.stringify({ cuotaNumero }),
          })
          const hidratado = hidratarCliente(guardado)
          setClientes((actual) => actual.map((item) => (item.id === id ? hidratado : item)))
          return hidratado
        }
        let resultado: Cliente | undefined
        setClientes((actual) => {
          const siguiente = actual.map((item) => {
            if (item.id !== id) return item
            const hidratado = hidratarCliente(item)
            const objetivo =
              hidratado.prestamo.cuotas.find((cuota) => cuota.numero === cuotaNumero && cuota.estado !== 'pagada') ??
              hidratado.prestamo.cuotas.find((cuota) => cuota.estado === 'vencida') ??
              hidratado.prestamo.cuotas.find((cuota) => cuota.estado === 'pendiente' || cuota.estado === 'parcial')
            if (!objetivo) {
              resultado = hidratado
              return hidratado
            }
            const hoy = new Date().toLocaleDateString('en-CA')
            const cuotas = hidratado.prestamo.cuotas.map((cuota) =>
              cuota.numero === objetivo.numero
                ? { ...cuota, estado: 'pagada' as const, pagado: cuota.monto, pagadoEn: hoy }
                : cuota,
            )
            const liquidado = cuotas.every((cuota) => cuota.estado === 'pagada')
            resultado = hidratarCliente({
              ...hidratado,
              prestamo: {
                ...hidratado.prestamo,
                cuotas,
                estado: liquidado ? 'liquidado' : hidratado.prestamo.estado,
              },
            })
            return resultado
          })
          persistirLocal(siguiente)
          return siguiente
        })
        return resultado ?? clientes.map(hidratarCliente).find((item) => item.id === id)!
      },
      async renovar(id, prestamo, extras) {
        if (haySesionApi()) {
          const guardado = await apiJson<Cliente>(`/api/clientes/${id}/renovar`, {
            method: 'PATCH',
            body: JSON.stringify({ prestamo, ...extras }),
          })
          const hidratado = hidratarCliente(guardado)
          setClientes((actual) => actual.map((item) => (item.id === id ? hidratado : item)))
          return hidratado
        }
        let resultado: Cliente | undefined
        setClientes((actual) => {
          const siguiente = actual.map((item) => {
            if (item.id !== id) return item
            resultado = hidratarCliente({
              ...item,
              pagareMonto: extras?.pagareMonto ?? item.pagareMonto,
              pagareFecha: extras?.pagareFecha ?? item.pagareFecha,
              prestamosAnteriores: [...(item.prestamosAnteriores ?? []), item.prestamo],
              prestamo,
              estado: prestamo.estado === 'pendiente_autorizacion' ? 'pendiente_autorizacion' : 'activo',
            })
            return resultado
          })
          persistirLocal(siguiente)
          return siguiente
        })
        return resultado ?? clientes.map(hidratarCliente).find((item) => item.id === id)!
      },
    }),
    [clientes],
  )

  return <ClientesContext.Provider value={value}>{children}</ClientesContext.Provider>
}

export function useClientes() {
  const ctx = useContext(ClientesContext)
  if (!ctx) throw new Error('useClientes debe usarse dentro de ClientesProvider')
  return ctx
}
