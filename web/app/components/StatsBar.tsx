'use client'
import type { DashboardData } from '../page'

type Props = { data: DashboardData; loading: boolean }

const STAT_CONFIG = [
  { key: 'crises',   icon: '🚨', label: 'Total Events',    color: '#ef4444', filter: (d: DashboardData) => d.crises.length },
  { key: 'active',  icon: '⚡', label: 'Active Crises',   color: '#f59e0b', filter: (d: DashboardData) => d.crises.filter(c => c.status === 'active').length },
  { key: 'signals', icon: '📡', label: 'Signals Ingested', color: '#3b82f6', filter: (d: DashboardData) => d.signals.length },
  { key: 'alerts',  icon: '📢', label: 'Alerts Sent',     color: '#06b6d4', filter: (d: DashboardData) => d.alerts.length },
  { key: 'sims',    icon: '🔬', label: 'Simulations Run', color: '#a78bfa', filter: (d: DashboardData) => d.simulations.length },
  { key: 'res',     icon: '🚑', label: 'Resources Ready', color: '#22c55e', filter: (d: DashboardData) => d.resources.filter(r => r.status === 'available').length },
]

export default function StatsBar({ data, loading }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
      {STAT_CONFIG.map(s => {
        const val = s.filter(data)
        return (
          <div key={s.key} className="glass" style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: s.color, borderRadius: '4px 0 0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
            </div>
            {loading ? (
              <div className="skeleton" style={{ width: 40, height: 28 }} />
            ) : (
              <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{val}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
