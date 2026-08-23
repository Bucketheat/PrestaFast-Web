export function descargarCsv(nombreArchivo: string, encabezados: string[], filas: Array<Array<string | number>>) {
  const lineas = [encabezados, ...filas].map((fila) =>
    fila
      .map((celda) => `"${String(celda).replaceAll('"', '""')}"`)
      .join(','),
  )
  const blob = new Blob([`\uFEFF${lineas.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`
  enlace.click()
  URL.revokeObjectURL(url)
}
