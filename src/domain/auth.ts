export type RolUsuario = 'admin' | 'cobrador'

export type UsuarioSesion = {
  id: string
  usuario: string
  nombre: string
  rol: RolUsuario
}

export type UsuarioSistema = UsuarioSesion & {
  claveHash: string
  activo: boolean
  telefono?: string
  creadoEn: string
}

export const AUTH_STORAGE_KEY = 'prestamos.sesion.v1'
export const USUARIOS_STORAGE_KEY = 'prestamos.usuarios.v1'

export async function hashClave(clave: string): Promise<string> {
  const data = new TextEncoder().encode(`prestamos|${clave}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function publicoDeUsuario(usuario: UsuarioSistema): UsuarioSesion {
  return {
    id: usuario.id,
    usuario: usuario.usuario,
    nombre: usuario.nombre,
    rol: usuario.rol,
  }
}
