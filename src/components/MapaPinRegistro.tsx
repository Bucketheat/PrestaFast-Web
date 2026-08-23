import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { direccionCompleta, geocodificarDireccion } from '../domain/ubicacion'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const icono = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const MEXICO: [number, number] = [23.6345, -102.5528]

type Props = {
  latitud?: number
  longitud?: number
  domicilio: string
  colonia: string
  municipio: string
  entidadFederativa: string
  codigoPostal: string
  error?: string
  onChange: (coords: { latitud: number; longitud: number }) => void
}

export function MapaPinRegistro({
  latitud,
  longitud,
  domicilio,
  colonia,
  municipio,
  entidadFederativa,
  codigoPostal,
  error,
  onChange,
}: Props) {
  const [gpsError, setGpsError] = useState('')
  const [buscando, setBuscando] = useState(false)
  const movidoAMano = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const hayPin = Number.isFinite(latitud) && Number.isFinite(longitud)
  const punto: [number, number] | undefined = hayPin ? [latitud as number, longitud as number] : undefined
  const direccion = direccionCompleta({ domicilio, colonia, municipio, entidadFederativa, codigoPostal })

  useEffect(() => {
    if (movidoAMano.current) return
    if ((codigoPostal ?? '').length !== 5 || !colonia || domicilio.trim().length < 3) return
    let cancelado = false
    setBuscando(true)
    void geocodificarDireccion(direccion)
      .then((coords) => {
        if (cancelado || !coords || movidoAMano.current) return
        onChangeRef.current(coords)
      })
      .finally(() => {
        if (!cancelado) setBuscando(false)
      })
    return () => {
      cancelado = true
    }
  }, [direccion, codigoPostal, colonia, domicilio])

  function fijar(lat: number, lng: number, manual = true) {
    if (manual) movidoAMano.current = true
    setGpsError('')
    onChange({ latitud: lat, longitud: lng })
  }

  function usarGps() {
    setGpsError('')
    if (!navigator.geolocation) {
      setGpsError('Este teléfono no permite GPS en el navegador.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fijar(pos.coords.latitude, pos.coords.longitude),
      () => setGpsError('No se pudo leer el GPS. Permite la ubicación o toca el mapa.'),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  return (
    <Stack spacing={1.25}>
      <Typography variant="h3">Ubicación en el mapa</Typography>
      <Typography color="text.secondary" variant="body2">
        Toca el mapa o arrastra el pin hasta la casa. Si estás en el domicilio, usa tu GPS.
      </Typography>
      <Button type="button" variant="outlined" startIcon={<MyLocationOutlinedIcon />} onClick={usarGps} sx={{ alignSelf: 'flex-start' }}>
        Usar mi ubicación
      </Button>
      <Box sx={{ height: { xs: 280, md: 340 }, borderRadius: 2, overflow: 'hidden', border: error ? '1px solid #c45c26' : '1px solid #e7e5e4' }}>
        <MapContainer center={punto ?? MEXICO} zoom={punto ? 16 : 5} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClicParaPinear onPick={(lat, lng) => fijar(lat, lng)} />
          <Recentrar punto={punto} />
          {punto ? (
            <Marker
              position={punto}
              icon={icono}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const { lat, lng } = event.target.getLatLng()
                  fijar(lat, lng)
                },
              }}
            />
          ) : null}
        </MapContainer>
      </Box>
      {hayPin ? (
        <Typography variant="caption" color="text.secondary">
          Pin: {latitud?.toFixed(6)}, {longitud?.toFixed(6)}
          {buscando ? ' · Ajustando con la dirección…' : ''}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          {buscando ? 'Buscando la dirección en el mapa…' : 'Aún no hay pin. Toca el mapa o usa el GPS.'}
        </Typography>
      )}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {gpsError ? <Alert severity="warning">{gpsError}</Alert> : null}
    </Stack>
  )
}

function ClicParaPinear({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function Recentrar({ punto }: { punto?: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (punto) map.setView(punto, Math.max(map.getZoom(), 16))
  }, [map, punto])
  return null
}
