import { apiJson } from './http'

function pemASpki(pem: string) {
  const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s/g, '')
  const crudo = atob(b64)
  const bytes = new Uint8Array(crudo.length)
  for (let i = 0; i < crudo.length; i += 1) bytes[i] = crudo.charCodeAt(i)
  return bytes.buffer
}

function bytesABase64(datos: ArrayBuffer) {
  const bytes = new Uint8Array(datos)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export async function cuerpoLoginCifrado(usuario: string, clave: string) {
  const meta = await apiJson<{ alg: string; clavePublica: string }>('/api/auth/clave-publica')
  const llave = await crypto.subtle.importKey(
    'spki',
    pemASpki(meta.clavePublica),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
  const cifrado = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    llave,
    new TextEncoder().encode(JSON.stringify({ usuario, clave })),
  )
  return { sobre: bytesABase64(cifrado) }
}
