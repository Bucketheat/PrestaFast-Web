import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { apiUrl } from '../api/http'
import { cuerpoLoginCifrado } from '../api/loginCifrado'
import { AUTH_STORAGE_KEY, type UsuarioSesion } from '../domain/auth'
import { useUsuarios } from './UsuariosProvider'

type AuthContextValue = {
  usuario: UsuarioSesion | null
  login: (usuario: string, clave: string) => Promise<UsuarioSesion>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function leerSesion(): UsuarioSesion | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { autenticar, registrarRemoto } = useUsuarios()
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(leerSesion)

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      async login(nombreUsuario, clave) {
        const apiRemota = Boolean(String(import.meta.env.VITE_API_URL ?? '').trim())
        let encontrado = apiRemota ? null : await autenticar(nombreUsuario, clave)

        try {
          const res = await fetch(apiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(await cuerpoLoginCifrado(nombreUsuario, clave)),
          })
          if (res.ok) {
            const data = (await res.json()) as { usuario: UsuarioSesion; token: string }
            sessionStorage.setItem('prestamos.token', data.token)
            encontrado = data.usuario
            registrarRemoto(data.usuario)
          } else if (apiRemota) {
            const cuerpo = (await res.json().catch(() => ({}))) as { message?: string }
            throw new Error(cuerpo.message || 'Usuario o contraseña incorrectos')
          }
        } catch (err) {
          if (apiRemota) throw err
        }

        if (!encontrado) throw new Error('Usuario o contraseña incorrectos')
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(encontrado))
        setUsuario(encontrado)
        return encontrado
      },
      logout() {
        sessionStorage.removeItem(AUTH_STORAGE_KEY)
        sessionStorage.removeItem('prestamos.token')
        setUsuario(null)
      },
    }),
    [usuario, autenticar, registrarRemoto],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
