export function formatearVigenciaIne(anioEmision: number, anioVigencia: number): string {
  return `${anioEmision}-${anioVigencia}`
}

export function anioFinIne(vigencia: string): number | null {
  const anios = vigencia.match(/\d{4}/g)?.map(Number) ?? []
  if (anios.length === 0) return null
  return Math.max(...anios)
}

export function anioInicioIne(vigencia: string): number | null {
  const anios = vigencia.match(/\d{4}/g)?.map(Number) ?? []
  if (anios.length === 0) return null
  return Math.min(...anios)
}
