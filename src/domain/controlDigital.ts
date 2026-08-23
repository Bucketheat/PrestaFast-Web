import { MARCA } from '../branding'
import { formatFechaLarga } from './calendario'
import { money } from './calculo'
import type { Cliente } from './cliente'

function escapar(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function generarControlHtml(cliente: Cliente): string {
  const { prestamo } = cliente
  const ineFrente = cliente.documentos.find((doc) => doc.tipo === 'ine_frente')
  const pagare = cliente.documentos.find((doc) => doc.tipo === 'pagare')
  const filas = prestamo.cuotas
    .map(
      (cuota) => `
      <tr>
        <td>${cuota.numero}</td>
        <td>${escapar(formatFechaLarga(cuota.fecha))}</td>
        <td class="num">${escapar(money(cuota.monto))}</td>
        <td class="check"></td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Control ${escapar(cliente.numeroControl)}</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; color: #1c1917; margin: 24px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    h2 { font-size: 16px; margin: 24px 0 8px; }
    .muted { color: #57534e; }
    .folio { font-size: 28px; font-weight: 700; letter-spacing: 0.04em; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d6d3d1; padding: 6px 8px; font-size: 13px; }
    th { background: #0f3d3e; color: #fff; text-align: left; }
    .num { text-align: right; }
    .check { width: 70px; }
    .docs img { max-width: 100%; max-height: 180px; border: 1px solid #e7e5e4; }
    .nota { margin-top: 20px; padding: 12px; background: #f4f1ea; font-size: 13px; }
    @media print { body { margin: 12px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <p class="muted">${escapar(MARCA.nombre)} · Ficha de control digital</p>
  <h1>${escapar(cliente.nombreCompleto)}</h1>
  <div class="folio">${escapar(cliente.numeroControl)}</div>
  <p class="muted">Este control lo lleva el administrador en el sistema y el cobrador en la app. Esta descarga es la copia digital de respaldo.</p>

  <div class="grid">
    <div><strong>Teléfono:</strong> ${escapar(cliente.telefono)}</div>
    <div><strong>INE:</strong> ${escapar(cliente.ineNumero)}</div>
    <div><strong>Domicilio:</strong> ${escapar(cliente.domicilio)}</div>
    <div><strong>Zona / ruta:</strong> ${escapar(cliente.zona || 'Sin asignar')}</div>
    <div><strong>Pagaré:</strong> ${escapar(money(cliente.pagareMonto))} · ${escapar(formatFechaLarga(cliente.pagareFecha))}</div>
    <div><strong>Desembolso:</strong> ${escapar(formatFechaLarga(prestamo.fechaDesembolso))}</div>
    <div><strong>Plan:</strong> ${escapar(prestamo.planNombre)} · $${prestamo.cuotaPorMil} por mil</div>
    <div><strong>Primer cobro:</strong> ${escapar(formatFechaLarga(prestamo.fechaPrimerCobro))}</div>
    <div><strong>Entregado:</strong> ${escapar(money(prestamo.desembolso))}</div>
    <div><strong>Cuota diaria:</strong> ${escapar(money(prestamo.cuotaDiaria))}</div>
    <div><strong>Pagos:</strong> ${prestamo.plazoPagos} · ${prestamo.cobraDomingo ? 'incluye domingo' : 'sin domingo'}</div>
    <div><strong>Total a recuperar:</strong> ${escapar(money(prestamo.total))} · cargo ${escapar(money(prestamo.cargo))}</div>
  </div>

  <div class="docs grid">
    <div>
      <h2>INE</h2>
      ${ineFrente ? `<img src="${ineFrente.dataUrl}" alt="INE" />` : '<p class="muted">Sin archivo</p>'}
    </div>
    <div>
      <h2>Pagaré</h2>
      ${pagare?.dataUrl.startsWith('data:image') ? `<img src="${pagare.dataUrl}" alt="Pagaré" />` : '<p class="muted">Pagaré cargado en el expediente</p>'}
    </div>
  </div>

  <h2>Calendario de pagos diarios</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Fecha</th><th>Cuota</th><th>Cobrado</th></tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  <div class="nota">
    Folio del préstamo: ${escapar(prestamo.folio)}. El cobro del día lo registra el cobrador en la app;
    el administrador lo ve al momento en la web. No se cobra el día del desembolso.
  </div>
</body>
</html>`
}

export function descargarControl(cliente: Cliente) {
  const html = generarControlHtml(cliente)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `control-${cliente.numeroControl}.html`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
