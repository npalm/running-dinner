import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Course, Participant, Schedule } from '../../types'

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface DinnerMapProps {
  participants: Participant[]
  schedule: Schedule | null
  showHostsOnly?: boolean
}

type MarkerColor = 'green' | 'orange' | 'purple' | 'gray'

function coloredDivIcon(color: MarkerColor): L.DivIcon {
  const colorMap: Record<MarkerColor, string> = {
    green: '#22c55e',
    orange: '#f97316',
    purple: '#8b5cf6',
    gray: '#9ca3af',
  }
  const hex = colorMap[color]
  return L.divIcon({
    className: '',
    html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${hex}" stroke="white" stroke-width="2"/>
    </svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function getParticipantRole(
  participantId: string,
  schedule: Schedule | null,
): { isHost: boolean; course: Course | null } {
  if (!schedule) return { isHost: false, course: null }
  for (const table of schedule.tables) {
    if (table.hostId === participantId) {
      return { isHost: true, course: table.course }
    }
  }
  return { isHost: false, course: null }
}

function getMarkerColor(course: Course | null, isHost: boolean): MarkerColor {
  if (!isHost) return 'gray'
  if (course === 'starter') return 'green'
  if (course === 'main') return 'orange'
  if (course === 'dessert') return 'purple'
  return 'gray'
}

const EINDHOVEN: L.LatLngTuple = [51.4416, 5.4697]

export function DinnerMap({ participants, schedule, showHostsOnly = false }: DinnerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current).setView(EINDHOVEN, 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove existing markers
    for (const m of markersRef.current) m.remove()
    markersRef.current = []

    const withCoords = participants.filter((p) => p.coordinates !== null)
    const toShow = showHostsOnly
      ? withCoords.filter((p) => {
          const { isHost } = getParticipantRole(p.id, schedule)
          return isHost
        })
      : withCoords

    if (toShow.length === 0) return

    const newMarkers: L.Marker[] = []

    for (const p of toShow) {
      const { isHost, course } = getParticipantRole(p.id, schedule)
      const color = getMarkerColor(course, isHost)
      const icon = coloredDivIcon(color)

      const roleText = isHost && course
        ? `Host: ${course}`
        : 'Guest'

      const marker = L.marker([p.coordinates!.lat, p.coordinates!.lng], { icon })
        .bindPopup(`<strong>${p.name}</strong><br/>${p.address}<br/><em>${roleText}</em>`)
        .addTo(map)

      newMarkers.push(marker)
    }

    markersRef.current = newMarkers

    // Fit map to all visible markers
    const latLngs = toShow.map((p) => [p.coordinates!.lat, p.coordinates!.lng] as L.LatLngTuple)
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 15)
    } else {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] })
    }
  }, [participants, schedule, showHostsOnly])

  return <div ref={containerRef} className="h-full w-full rounded-xl" />
}
