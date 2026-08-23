import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiUrl } from '../api/http'
import {
  hashClave,
  publicoDeUsuario,
  USUARIOS_STORAGE_KEY,
  type RolUsuario,
  type UsuarioSesion,
  type UsuarioSistema,
} from '../domain/auth'

export type UsuarioAlta = {
  nombre: string
  usuario: string
  rol: RolUsuario
  clave: string
  telefono?: string
  activo?: boolean
}

export type UsuarioEdicion = {
  id: string
  nombre: string
  usuario: string
  rol: RolUsuario
  telefono?: string
  activo: boolean
  clave?: string
}

type UsuarioRemoto = {
  id: string
  usuario: string
  nombre: string
  rol: RolUsuario
  telefono?: string
  activo: boolean
}

type UsuariosContextValue = {
  usuarios: UsuarioSistema[]
  listos: boolean
  autenticar: (usuario: string, clave: string) => Promise<UsuarioSesion | null>
  crear: (alta: UsuarioAlta) => Promise<UsuarioSistema>
  actualizar: (edicion: UsuarioEdicion) => Promise<UsuarioSistema>
  cambiarEstado: (id: string, activo: boolean) => void
  eliminar: (id: string, actorId: string) => void
  registrarRemoto: (sesion: UsuarioSesion) => void
  hidratarDesdeApi: () => Promise<void>
}

const UsuariosContext = createContext<UsuariosContextValue | null>(null)

function leerUsuarios(): UsuarioSistema[] {
  try {
    const raw = localStorage.getItem(USUARIOS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as UsuarioSistema[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistir(usuarios: UsuarioSistema[]) {
  localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(usuarios))
}

function normalizarUsuario(valor: string) {
  return valor.trim().toLowerCase()
}

async function semillaInicial(): Promise<UsuarioSistema[]> {
  const ahora = new Date().toISOString()
  return [
    {
      id: 'user-admin',
      usuario: 'admin',
      nombre: 'Administrador',
      rol: 'admin',
      claveHash: await hashClave('Admin#2026Prestamos'),
      activo: true,
      creadoEn: ahora,
    },
    {
      id: 'user-cobrador',
      usuario: 'cobrador',
      nombre: 'Cobrador de ruta',
      rol: 'cobrador',
      claveHash: await hashClave('Cobra#2026Ruta'),
      activo: true,
      creadoEn: ahora,
    },
  ]
}

function adminsActivos(usuarios: UsuarioSistema[], exceptId?: string) {
  return usuarios.filter((item) => item.rol === 'admin' && item.activo && item.id !== exceptId)
}

async function sincronizarApi(ruta: string, metodo: string, cuerpo?: unknown) {
  const token = sessionStorage.getItem('prestamos.token')
  if (!token) return
  try {
    await fetch(apiUrl(`/api/usuarios${ruta}`), {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    // El listado local sigue siendo la fuente si el API no está arriba.
  }
}

export function UsuariosProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(leerUsuarios)
  const [listos, setListos] = useState(leerUsuarios().length > 0)

  useEffect(() => {
    let vivo = true
    void (async () => {
      const actual = leerUsuarios()
      if (actual.length > 0) {
        if (vivo) setListos(true)
        return
      }
      const semilla = await semillaInicial()
      persistir(semilla)
      if (vivo) {
        setUsuarios(semilla)
        setListos(true)
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  const value = useMemo<UsuariosContextValue>(
    () => ({
      usuarios,
      listos,
      async autenticar(nombreUsuario, clave) {
        let lista = usuarios
        if (lista.length === 0) {
          lista = leerUsuarios()
          if (lista.length === 0) {
            lista = await semillaInicial()
            persistir(lista)
            setUsuarios(lista)
          }
        }
        const hash = await hashClave(clave)
        const encontrado = lista.find(
          (item) => item.usuario === normalizarUsuario(nombreUsuario) && item.activo && item.claveHash === hash,
        )
        return encontrado ? publicoDeUsuario(encontrado) : null
      },
      async crear(alta) {
        const usuario = normalizarUsuario(alta.usuario)
        if (usuarios.some((item) => item.usuario === usuario)) {
          throw new Error('Ese usuario ya existe')
        }
        if (!alta.clave || alta.clave.length < 8) {
          throw new Error('La contraseña debe tener al menos 8 caracteres')
        }
        const nuevo: UsuarioSistema = {
          id: `user-${crypto.randomUUID().slice(0, 8)}`,
          usuario,
          nombre: alta.nombre.trim(),
          rol: alta.rol,
          telefono: alta.telefono?.trim() || undefined,
          claveHash: await hashClave(alta.clave),
          activo: alta.activo ?? true,
          creadoEn: new Date().toISOString(),
        }
        setUsuarios((actual) => {
          const siguiente = [...actual, nuevo]
          persistir(siguiente)
          return siguiente
        })
        void sincronizarApi('', 'POST', {
          id: nuevo.id,
          usuario: nuevo.usuario,
          nombre: nuevo.nombre,
          rol: nuevo.rol,
          telefono: nuevo.telefono,
          clave: alta.clave,
          activo: nuevo.activo,
        })
        return nuevo
      },
      async actualizar(edicion) {
        const usuario = normalizarUsuario(edicion.usuario)
        if (usuarios.some((item) => item.usuario === usuario && item.id !== edicion.id)) {
          throw new Error('Ese usuario ya existe')
        }
        const actual = usuarios.find((item) => item.id === edicion.id)
        if (!actual) throw new Error('Usuario no encontrado')
        if (actual.rol === 'admin' && (edicion.rol !== 'admin' || !edicion.activo) && adminsActivos(usuarios, edicion.id).length === 0) {
          throw new Error('Debe quedar al menos un administrador activo')
        }
        if (edicion.clave && edicion.clave.length < 8) {
          throw new Error('La contraseña debe tener al menos 8 caracteres')
        }
        const claveHash = edicion.clave ? await hashClave(edicion.clave) : actual.claveHash
        const siguienteUsuario: UsuarioSistema = {
          ...actual,
          usuario,
          nombre: edicion.nombre.trim(),
          rol: edicion.rol,
          telefono: edicion.telefono?.trim() || undefined,
          activo: edicion.activo,
          claveHash,
        }
        setUsuarios((lista) => {
          const siguiente = lista.map((item) => (item.id === edicion.id ? siguienteUsuario : item))
          persistir(siguiente)
          return siguiente
        })
        void sincronizarApi(`/${edicion.id}`, 'PUT', {
          usuario,
          nombre: siguienteUsuario.nombre,
          rol: siguienteUsuario.rol,
          telefono: siguienteUsuario.telefono,
          activo: siguienteUsuario.activo,
          clave: edicion.clave || undefined,
        })
        return siguienteUsuario
      },
      cambiarEstado(id, activo) {
        const actual = usuarios.find((item) => item.id === id)
        if (!actual) return
        if (actual.rol === 'admin' && !activo && adminsActivos(usuarios, id).length === 0) {
          throw new Error('Debe quedar al menos un administrador activo')
        }
        setUsuarios((lista) => {
          const siguiente = lista.map((item) => (item.id === id ? { ...item, activo } : item))
          persistir(siguiente)
          return siguiente
        })
        void sincronizarApi(`/${id}`, 'PUT', { activo })
      },
      eliminar(id, actorId) {
        if (id === actorId) throw new Error('No puedes eliminar tu propio usuario')
        const actual = usuarios.find((item) => item.id === id)
        if (!actual) return
        if (actual.rol === 'admin' && adminsActivos(usuarios, id).length === 0) {
          throw new Error('Debe quedar al menos un administrador')
        }
        setUsuarios((lista) => {
          const siguiente = lista.filter((item) => item.id !== id)
          persistir(siguiente)
          return siguiente
        })
        void sincronizarApi(`/${id}`, 'DELETE')
      },
      async hidratarDesdeApi() {
        const token = sessionStorage.getItem('prestamos.token')
        if (!token) return
        try {
          const res = await fetch(apiUrl('/api/usuarios'), {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) return
          const remotos = (await res.json()) as UsuarioRemoto[]
          setUsuarios((lista) => {
            const porUsuario = new Map(lista.map((item) => [item.usuario, item]))
            for (const remoto of remotos) {
              const local = porUsuario.get(remoto.usuario) ?? lista.find((item) => item.id === remoto.id)
              porUsuario.set(remoto.usuario, {
                id: remoto.id,
                usuario: remoto.usuario,
                nombre: remoto.nombre,
                rol: remoto.rol,
                telefono: remoto.telefono,
                activo: remoto.activo,
                claveHash: local?.claveHash ?? '',
                creadoEn: local?.creadoEn ?? new Date().toISOString(),
              })
            }
            const siguiente = [...porUsuario.values()]
            persistir(siguiente)
            return siguiente
          })
        } catch {
          // Sin API se sigue usando el listado local.
        }
      },
      registrarRemoto(sesion) {
        setUsuarios((lista) => {
          if (lista.some((item) => item.id === sesion.id || item.usuario === sesion.usuario)) return lista
          const siguiente = [
            ...lista,
            {
              ...sesion,
              claveHash: '',
              activo: true,
              creadoEn: new Date().toISOString(),
            },
          ]
          persistir(siguiente)
          return siguiente
        })
      },
    }),
    [usuarios, listos],
  )

  return <UsuariosContext.Provider value={value}>{children}</UsuariosContext.Provider>
}

export function useUsuarios() {
  const ctx = useContext(UsuariosContext)
  if (!ctx) throw new Error('useUsuarios debe usarse dentro de UsuariosProvider')
  return ctx
}
