'use client'
import type { Alert, Crisis } from '@/lib/supabase'

type Props = { alerts: Alert[]; crises: Crisis[] }
const SEV: Record<string, string> = { critical:'#ef4444', danger:'#f97316', warning:'#f59e0b', info:'#3b82f6' }

export default function AlertsPanel({ alerts, crises }: Props) {
  const getCrisis = (id: string) => crises.find(c => c.id === id)
  if (!alerts.length) return (
    <div className="glass" style={{ padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:12 }}>📢</div>
      <div style={{ fontWeight:600, color:'var(--text)', marginBottom:6 }}>No Alerts Issued</div>
      <div style={{ color:'var(--muted)', fontSize:'0.875rem' }}>Alerts are generated automatically during simulation.</div>
    </div>
  )
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text)' }}>📢 Emergency Alerts ({alerts.length})</h2>
        <div style={{ display:'flex', gap:8 }}>
          <span className="badge badge-resolved">{alerts.filter(a=>a.delivered).length} Delivered</span>
          <span className="badge badge-active">{alerts.filter(a=>!a.delivered).length} Pending</span>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {alerts.map(alert => {
          const c = SEV[alert.severity ?? 'info'] ?? '#3b82f6'
          const crisis = getCrisis(alert.crisis_id)
          return (
            <div key={alert.id} className="glass" style={{ padding:18, borderLeft:`3px solid ${c}` }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:6, alignItems:'center' }}>
                <strong style={{ color:'var(--text)', fontSize:'0.9rem' }}>{alert.title}</strong>
                <span className="badge" style={{ background:c+'22', color:c, border:`1px solid ${c}44` }}>{alert.severity?.toUpperCase()}</span>
                <span className={`badge ${alert.delivered ? 'badge-resolved' : 'badge-monitoring'}`}>{alert.delivered ? 'Delivered' : 'Pending'}</span>
              </div>
              {crisis && <div style={{ fontSize:'0.73rem', color:'var(--muted)', marginBottom:6 }}>🚨 {crisis.title}</div>}
              <div style={{ fontSize:'0.82rem', color:'var(--text)', lineHeight:1.5, marginBottom:8 }}>{alert.message}</div>
              {alert.message_ur && (
                <div style={{ fontSize:'0.9rem', color:'var(--accent)', lineHeight:1.8, textAlign:'right', direction:'rtl', background:'rgba(6,182,212,0.06)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:6, padding:'8px 12px', marginBottom:8 }}>
                  {alert.message_ur}
                </div>
              )}
              <div style={{ display:'flex', gap:14, fontSize:'0.73rem', color:'var(--muted)', flexWrap:'wrap' }}>
                <span>📍 {alert.target_area ?? 'N/A'}</span>
                <span>👥 {alert.recipients.toLocaleString()} recipients</span>
                <span>📡 {alert.alert_type}</span>
                <span>🕐 {new Date(alert.created_at).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
