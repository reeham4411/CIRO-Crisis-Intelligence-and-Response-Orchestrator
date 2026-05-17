'use client'
import type { Crisis } from '@/lib/supabase'
import { useEffect, useRef } from 'react'
import type L from 'leaflet'

type Props = { crises: Crisis[] }

const CRISIS_COLORS: Record<string, string> = {
  flood: '#3b82f6', fire: '#ef4444', heatwave: '#f59e0b',
  accident: '#f97316', road_blockage: '#a78bfa', infrastructure_failure: '#06b6d4', unknown: '#64748b'
}
const SEV_RADIUS: Record<string, number> = { critical: 28, high: 22, medium: 16, low: 12 }

export default function CrisisMap({ crises }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstance.current || !mapRef.current) return

    import('leaflet').then(L => {
      if (!mapRef.current || mapInstance.current) return

      const map = L.map(mapRef.current, {
        center: [30.3753, 69.3451],
        zoom: 6,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map)

      mapInstance.current = map

      // Legend
      const LegendControl = L.Control.extend({
        onAdd() {
          const div = L.DomUtil.create('div')
          div.style.cssText = 'background:rgba(13,21,40,0.92);border:1px solid rgba(99,179,237,0.2);border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:12px;line-height:1.6;'
          div.innerHTML = `<div style="font-weight:700;margin-bottom:6px;color:#60a5fa;">Crisis Types</div>` +
            Object.entries(CRISIS_COLORS).map(([k, v]) =>
              `<div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:${v};display:inline-block;flex-shrink:0;"></span>${k}</div>`
            ).join('')
          return div
        }
      })
      new LegendControl({ position: 'bottomright' }).addTo(map)
    })
  }, [])

  useEffect(() => {
    if (!mapInstance.current) return

    import('leaflet').then(L => {
      const map = mapInstance.current!
      // Remove non-tile layers
      map.eachLayer((layer: L.Layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer)
      })

      crises.forEach(crisis => {
        if (!crisis.latitude || !crisis.longitude) return
        const color = CRISIS_COLORS[crisis.crisis_type] ?? '#64748b'
        const radius = SEV_RADIUS[crisis.severity] ?? 16

        const circle = L.circleMarker([crisis.latitude, crisis.longitude], {
          radius,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.35,
        }).addTo(map)

        const pulseIcon = L.divIcon({
          className: '',
          html: `<div style="width:${radius * 2 + 8}px;height:${radius * 2 + 8}px;border-radius:50%;border:2px solid ${color};animation:pulse-ring 1.5s ease-out infinite;position:absolute;top:-${radius + 4}px;left:-${radius + 4}px;"></div>`,
          iconSize: [0, 0],
        })
        L.marker([crisis.latitude, crisis.longitude], { icon: pulseIcon }).addTo(map)

        circle.bindPopup(`
          <div style="background:#0d1528;color:#e2e8f0;border-radius:8px;padding:10px 14px;min-width:220px;font-family:Inter,sans-serif;">
            <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:${color};">${crisis.title}</div>
            <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">📍 ${crisis.location_name}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
              <span style="background:${color}22;color:${color};border:1px solid ${color}44;border-radius:4px;padding:2px 8px;font-size:11px;">${crisis.severity.toUpperCase()}</span>
              <span style="background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3);border-radius:4px;padding:2px 8px;font-size:11px;">${crisis.status}</span>
            </div>
            <div style="font-size:11px;color:#64748b;">Confidence: ${crisis.confidence_label} (${Math.round(crisis.confidence * 100)}%)</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">📡 ${crisis.signal_count} signal(s)</div>
            ${crisis.impact_summary ? `<div style="font-size:11px;color:#94a3b8;margin-top:6px;line-height:1.4;">${crisis.impact_summary}</div>` : ''}
          </div>
        `, { maxWidth: 280 })
      })

      // Fit bounds
      const valid = crises.filter(c => c.latitude && c.longitude)
      if (valid.length === 1) {
        map.setView([valid[0].latitude!, valid[0].longitude!], 12)
      } else if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map(c => [c.latitude!, c.longitude!] as [number, number]))
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    })
  }, [crises])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>🗺️ Live Crisis Map</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{crises.filter(c => c.latitude && c.longitude).length} events plotted</span>
      </div>

      <div className="glass" style={{ overflow: 'hidden', position: 'relative' }}>
        <div ref={mapRef} style={{ height: 520, width: '100%', borderRadius: 12 }} />
        {crises.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,15,30,0.7)', borderRadius: 12, flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '3rem' }}>🗺️</div>
            <div style={{ color: 'var(--text)', fontWeight: 600 }}>No crisis events to display</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Submit a signal to plot crisis locations</div>
          </div>
        )}
      </div>

      {crises.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {crises.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: '0.75rem', color: 'var(--muted)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: CRISIS_COLORS[c.crisis_type] ?? '#64748b', flexShrink: 0 }} />
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{c.title}</span>
              <span>· {c.location_name}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .leaflet-popup-content-wrapper { background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important; }
        .leaflet-popup-tip { background:#0d1528!important; }
        .leaflet-container { border-radius:12px; }
        @keyframes pulse-ring { 0%{opacity:0.8;transform:scale(0.9)} 70%{opacity:0;transform:scale(1.4)} 100%{opacity:0;transform:scale(1.4)} }
      `}</style>
    </div>
  )
}
