import { Alert, Box, Typography } from '@mui/material'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { money } from '../domain/calculo'
import type { Cliente } from '../domain/cliente'
import { hidratarCliente } from '../domain/operacion'
import { direccionCompleta, tieneCoordenadas } from '../domain/ubicacion'
import 'leaflet/dist/leaflet.css'

type Props = {
  clientes: Cliente[]
  geocodificando?: boolean
}

export function MapaClientes({ clientes, geocodificando }: Props) {
  const navigate = useNavigate()
  const hidratados = clientes.map(hidratarCliente)
  const conMapa = hidratados.filter(tieneCoordenadas)
  const sinMapa = hidratados.filter((cliente) => !tieneCoordenadas(cliente))
  const centro = centroDe(conMapa)

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Clientes en el mapa
      </Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
        Cada globo usa el domicilio capturado. Toca uno para ver desembolso, score, estatus y pagos.
      </Typography>
      {sinMapa.length > 0 ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {geocodificando
            ? `Localizando ${sinMapa.length} domicilio(s)…`
            : `${sinMapa.length} cliente(s) aún sin coordenadas. Se localizan solos con la dirección.`}
        </Alert>
      ) : null}
      <Box sx={{ height: { xs: 360, md: 480 }, borderRadius: 2, overflow: 'hidden', border: '1px solid #e7e5e4' }}>
        <MapContainer center={centro} zoom={conMapa.length ? 13 : 5} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <AjustarVista puntos={conMapa.map((c) => [c.latitud as number, c.longitud as number])} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {conMapa.map((cliente) => {
            const pagadas = cliente.prestamo.cuotas.filter((cuota) => cuota.estado === 'pagada').length
            const total = cliente.prestamo.plazoPagos
            const vencidas = cliente.prestamo.cuotas.some((cuota) => cuota.estado === 'vencida')
            const color = colorMarcador(cliente, vencidas)
            return (
              <CircleMarker
                key={cliente.id}
                center={[cliente.latitud as number, cliente.longitud as number]}
                radius={11}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
                eventHandlers={{ click: () => undefined }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  {cliente.nombreCompleto}
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: 180, fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif' }}>
                    <strong>{cliente.nombreCompleto}</strong>
                    <div>{cliente.numeroControl}</div>
                    <div style={{ marginTop: 6 }}>{direccionCompleta(cliente)}</div>
                    <div style={{ marginTop: 8 }}>Desembolso: {money(cliente.prestamo.desembolso)}</div>
                    <div>Score: {cliente.score} · {cliente.nivel}</div>
                    <div>Estatus: {etiquetaEstado(cliente)}</div>
                    <div>
                      Pagos: {pagadas} / {total}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/clientes/${cliente.id}`)}
                      style={{
                        marginTop: 8,
                        border: 0,
                        background: '#0f3d3e',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      Ver expediente
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </Box>
    </Box>
  )
}

function AjustarVista({ puntos }: { puntos: Array<[number, number]> }) {
  const map = useMap()
  const clave = puntos.map((p) => p.join(',')).join('|')
  useEffect(() => {
    if (puntos.length === 0) return
    if (puntos.length === 1) {
      map.setView(puntos[0], 15)
      return
    }
    map.fitBounds(puntos, { padding: [36, 36], maxZoom: 15 })
  }, [map, clave, puntos])
  return null
}

function centroDe(clientes: Array<{ latitud?: number; longitud?: number }>): [number, number] {
  if (clientes.length === 0) return [23.6345, -102.5528]
  const lat = clientes.reduce((suma, c) => suma + (c.latitud ?? 0), 0) / clientes.length
  const lng = clientes.reduce((suma, c) => suma + (c.longitud ?? 0), 0) / clientes.length
  return [lat, lng]
}

function colorMarcador(cliente: Cliente, vencidas: boolean) {
  if (cliente.estado === 'rechazado') return '#a8a29e'
  if (cliente.prestamo.estado === 'liquidado') return '#78716c'
  if (cliente.estado === 'pendiente_autorizacion') return '#c45c26'
  if (vencidas) return '#b91c1c'
  return '#0f3d3e'
}

function etiquetaEstado(cliente: Cliente) {
  if (cliente.prestamo.estado === 'liquidado') return 'Liquidado'
  if (cliente.estado === 'pendiente_autorizacion') return 'Por autorizar'
  if (cliente.estado === 'bloqueado') return 'Bloqueado'
  if (cliente.estado === 'rechazado') return 'Rechazado'
  return 'Activo'
}
