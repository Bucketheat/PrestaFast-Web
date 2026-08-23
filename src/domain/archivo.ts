export async function archivoADataUrl(file: File, maxLado = 1280): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return leerComoDataUrl(file)
  }

  const original = await leerComoDataUrl(file)
  const imagen = await cargarImagen(original)
  const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height))
  const ancho = Math.round(imagen.width * escala)
  const alto = Math.round(imagen.height * escala)
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')
  if (!ctx) return original
  ctx.drawImage(imagen, 0, 0, ancho, alto)
  return canvas.toDataURL('image/jpeg', 0.72)
}

function leerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen'))
    imagen.src = src
  })
}
