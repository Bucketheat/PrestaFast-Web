import { useEffect, useMemo, useRef, useState } from 'react'
import type { Cliente } from '../domain/cliente'
import { direccionCompleta, geocodificarDireccion, tieneCoordenadas } from '../domain/ubicacion'

const intentados = new Set<string>()

export function useGeocodificarClientes(clientes: Cliente[], actualizar: (cliente: Cliente) => void) {
  const [geocodificando, setGeocodificando] = useState(false)
  const actualizarRef = useRef(actualizar)
  const clientesRef = useRef(clientes)
  actualizarRef.current = actualizar
  clientesRef.current = clientes
  const pendientesKey = useMemo(
    () =>
      clientes
        .filter((cliente) => !tieneCoordenadas(cliente) && !intentados.has(cliente.id))
        .map((cliente) => cliente.id)
        .join('|'),
    [clientes],
  )

  useEffect(() => {
    const pendientes = clientesRef.current.filter((cliente) => !tieneCoordenadas(cliente) && !intentados.has(cliente.id))
    if (pendientes.length === 0) {
      setGeocodificando(false)
      return
    }

    let cancelado = false
    setGeocodificando(true)

    void (async () => {
      for (const cliente of pendientes) {
        if (cancelado) return
        const coords = await geocodificarDireccion(direccionCompleta(cliente))
        intentados.add(cliente.id)
        if (coords && !cancelado) {
          actualizarRef.current({ ...cliente, ...coords })
        }
        await esperar(1100)
      }
      if (!cancelado) setGeocodificando(false)
    })()

    return () => {
      cancelado = true
    }
  }, [pendientesKey])

  return geocodificando
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
