'use client'
import type { Crisis, Signal } from '@/lib/supabase'

type Props = { crises: Crisis[]; signals: Signal[]; loading: boolean; selected: Crisis | null; onSelect: (c: Crisis) => void }

const CRISIS_ICONS: Record<string, string> = { flood:'🌊', fire:'🔥', heatwave:'🌡️', accident:'🚗', road_blockage:'🚧', infrastructure_failure:'⚡', unknown:'⚠️' }
const SEV: Record<string, string> = { critical:'#ef4444', high:'#f59e0b', medium:'#3b82f6', low:'#22c55e' }
const STATUS_CLS: Record<string, string> = { active:'badge-active', monitoring:'badge-monitoring', resolved:'badge-resolved', false_alarm:'badge-low' }

export default function CrisisList({ crises, signals, loading, selected, onSelect }: Props) {
  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:80}} />)}
    </div>
  )
  if (!crises.length) return (
    <div className="glass" style={{ padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:12 }}>🟢</div>
      <div style={{ fontWeight:600, color:'var(--text)', marginBottom:6 }}>No Crisis Events Detected</div>
      <div style={{ color:'var(--muted)', fontSize:'0.875rem' }}>Submit a signal above to start the detection pipeline.</div>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text)' }}>🚨 Crisis Events ({crises.length})</h2>
        <div style={{ display:'flex', gap:8 }}>
          <span className="badge badge-active">{crises.filter(c=>c.status==='active').length} Active</span>
          <span className="badge badge-resolved">{crises.filter(c=>c.status!=='active').length} Monitored</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {crises.map(crisis => {
            const sev = SEV[crisis.severity] ?? '#64748b'
            const relSigs = signals.filter(s=>s.crisis_id===crisis.id)
            return (
              <div key={crisis.id} onClick={()=>onSelect(crisis)} className="glass" style={{
                padding:'16px 18px', cursor:'pointer', transition:'all 0.2s',
                borderLeft:`3px solid ${sev}`, background: selected?.id===crisis.id ? sev+'11' : undefined
              }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ fontSize:'1.5rem' }}>{CRISIS_ICONS[crisis.crisis_type]??'⚠️'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                      <strong style={{ color:'var(--text)', fontSize:'0.9rem' }}>{crisis.title}</strong>
                      <span className={`badge ${STATUS_CLS[crisis.status]??''}`}>{crisis.status}</span>
                      <span className="badge" style={{ background:sev+'22', color:sev, border:`1px solid ${sev}44` }}>{crisis.severity.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:6 }}>📍 {crisis.location_name}{crisis.affected_area && ` · ${crisis.affected_area}`}</div>
                    {crisis.impact_summary && <div style={{ fontSize:'0.8rem', color:'#94a3b8', lineHeight:1.5, marginBottom:6 }}>{crisis.impact_summary}</div>}
                    <div style={{ display:'flex', gap:12, fontSize:'0.73rem', color:'var(--muted)', flexWrap:'wrap' }}>
                      <span>📡 {crisis.signal_count} signals</span>
                      <span>🎯 {crisis.confidence_label} ({Math.round(crisis.confidence*100)}%)</span>
                      <span>🕐 {new Date(crisis.created_at).toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ width:6, height:50, background:'var(--surface2)', borderRadius:3, overflow:'hidden', position:'relative' }}>
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${crisis.confidence*100}%`, background:`linear-gradient(to top,${sev},${sev}88)`, borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:'0.6rem', color:'var(--muted)' }}>{Math.round(crisis.confidence*100)}%</span>
                  </div>
                </div>
                {relSigs.length>0 && (
                  <div style={{ marginTop:8, borderTop:'1px solid var(--border)', paddingTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                    {relSigs.slice(0,2).map(s=>(
                      <span key={s.id} style={{ fontSize:'0.7rem', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px', color:'var(--muted)' }}>
                        {s.source==='social_media'?'📱':s.source==='weather'?'🌤️':'📡'} {s.raw_text?.slice(0,35)}…
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {selected && (
          <div className="glass" style={{ padding:20, maxHeight:600, overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:'1.8rem' }}>{CRISIS_ICONS[selected.crisis_type]??'⚠️'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'var(--text)' }}>{selected.title}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{selected.location_name}</div>
              </div>
              <button onClick={()=>onSelect(null!)} style={{ background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'1.3rem' }}>×</button>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'0.78rem', color:'var(--muted)' }}>
                <span>Confidence</span><strong style={{ color:'var(--text)' }}>{selected.confidence_label} ({Math.round(selected.confidence*100)}%)</strong>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width:`${selected.confidence*100}%`, background:`linear-gradient(90deg,${SEV[selected.severity]},${SEV[selected.severity]}88)` }} />
              </div>
            </div>
            {selected.situation_analysis && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>Situation Analysis</div>
                <div style={{ fontSize:'0.83rem', color:'var(--text)', lineHeight:1.6, background:'var(--surface)', padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)' }}>{selected.situation_analysis}</div>
              </div>
            )}
            {selected.recommendations?.length>0 && (
              <div>
                <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em' }}>Recommended Actions</div>
                {selected.recommendations.map((r,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                    <span style={{ color:'var(--accent)', fontWeight:700 }}>{i+1}.</span>
                    <span style={{ fontSize:'0.82rem', color:'var(--text)', lineHeight:1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
