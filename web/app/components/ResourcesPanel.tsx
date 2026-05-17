'use client'
import type { Resource } from '@/lib/supabase'
type Props = { resources: Resource[] }
const RES_ICONS: Record<string,string> = { ambulance:'🚑', fire_truck:'🚒', police:'🚔', rescue_team:'⛑️', flood_boat:'🚤', helicopter:'🚁', water_pump:'💧', generator:'⚡', other:'🔧' }
const STATUS_COLORS: Record<string,string> = { available:'#22c55e', dispatched:'#f59e0b', maintenance:'#3b82f6', offline:'#64748b' }

export default function ResourcesPanel({ resources }: Props) {
  const byStatus = (s: string) => resources.filter(r => r.status === s).length
  if (!resources.length) return (
    <div className="glass" style={{ padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:12 }}>🚑</div>
      <div style={{ fontWeight:600, color:'var(--text)' }}>No Resources Found</div>
      <div style={{ color:'var(--muted)', fontSize:'0.875rem', marginTop:6 }}>Run the schema SQL in Supabase to seed resources.</div>
    </div>
  )
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text)' }}>🚑 Emergency Resources ({resources.length})</h2>
        <div style={{ display:'flex', gap:8 }}>
          <span className="badge badge-resolved">{byStatus('available')} Available</span>
          <span className="badge badge-high">{byStatus('dispatched')} Dispatched</span>
          <span className="badge badge-medium">{byStatus('maintenance')} Maintenance</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
        {resources.map(res => {
          const c = STATUS_COLORS[res.status] ?? '#64748b'
          return (
            <div key={res.id} className="glass" style={{ padding:'16px', borderTop:`2px solid ${c}`, transition:'all 0.2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:c+'22', border:`1px solid ${c}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>
                  {RES_ICONS[res.resource_type] ?? '🔧'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:'var(--text)', fontSize:'0.88rem' }}>{res.name}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{res.resource_type.replace('_',' ')}</div>
                </div>
                <span className="badge" style={{ background:c+'22', color:c, border:`1px solid ${c}44` }}>{res.status}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:'0.78rem', color:'var(--muted)' }}>
                {res.current_location && <div>📍 {res.current_location}</div>}
                {res.contact && <div>📞 {res.contact}</div>}
                {res.assigned_crisis && <div style={{ color:'var(--warning)' }}>🚨 Assigned to active crisis</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
