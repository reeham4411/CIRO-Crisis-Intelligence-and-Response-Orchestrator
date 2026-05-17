'use client'
import type { Simulation, Crisis } from '@/lib/supabase'

type Props = { simulations: Simulation[]; crises: Crisis[] }

type MetricState = {
  traffic_congestion_pct?: number
  vehicles_stranded?: number
  response_teams_deployed?: number
  alerts_sent?: number
  estimated_affected_people?: number
}

type ImpactMetrics = {
  congestion_reduced_pct?: number
  vehicles_rescued?: number
  people_reached_by_alerts?: number
  response_teams_on_ground?: number
  actions_executed?: number
  execution_log?: string[]
}

export default function SimulationPanel({ simulations, crises }: Props) {
  const getCrisisTitle = (id: string) => crises.find(c => c.id === id)?.title ?? id

  if (!simulations.length) return (
    <div className="glass" style={{ padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:12 }}>🔬</div>
      <div style={{ fontWeight:600, color:'var(--text)', marginBottom:6 }}>No Simulations Yet</div>
      <div style={{ color:'var(--muted)', fontSize:'0.875rem' }}>Run the agent pipeline on a signal to trigger a simulation.</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {simulations.map(sim => {
        const before = sim.before_state as MetricState
        const after  = sim.after_state as MetricState
        const impact = sim.impact_metrics as ImpactMetrics

        const metrics = [
          { label:'Traffic Congestion', before: before.traffic_congestion_pct, after: after.traffic_congestion_pct, unit:'%', lower_is_better: true },
          { label:'Vehicles Stranded',  before: before.vehicles_stranded, after: after.vehicles_stranded, unit:'', lower_is_better: true },
          { label:'People Affected',    before: before.estimated_affected_people, after: after.estimated_affected_people, unit:'', lower_is_better: true },
          { label:'Teams Deployed',     before: before.response_teams_deployed, after: after.response_teams_deployed, unit:'', lower_is_better: false },
          { label:'Alerts Sent',        before: before.alerts_sent, after: after.alerts_sent, unit:'', lower_is_better: false },
        ]

        return (
          <div key={sim.id} className="glass" style={{ padding:24, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#a78bfa,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>🔬</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'var(--text)' }}>{sim.simulation_name}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{getCrisisTitle(sim.crisis_id)}</div>
              </div>
              <span className={`badge badge-${sim.status === 'completed' ? 'resolved' : sim.status === 'running' ? 'monitoring' : 'active'}`}>
                {sim.status}
              </span>
            </div>

            {/* Before vs After grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
              {/* BEFORE */}
              <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:16 }}>
                <div style={{ fontWeight:700, color:'#ef4444', marginBottom:14, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.07em' }}>⚠️ Before Response</div>
                {metrics.map(m => m.before !== undefined && (
                  <div key={m.label} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', marginBottom:4 }}>
                      <span style={{ color:'var(--muted)' }}>{m.label}</span>
                      <strong style={{ color:'#ef4444' }}>{(m.before ?? 0).toLocaleString()}{m.unit}</strong>
                    </div>
                    {m.label === 'Traffic Congestion' && (
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width:`${m.before}%`, background:'linear-gradient(90deg,#ef4444,#f59e0b)' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* AFTER */}
              <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, padding:16 }}>
                <div style={{ fontWeight:700, color:'#22c55e', marginBottom:14, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.07em' }}>✅ After Response</div>
                {metrics.map(m => m.after !== undefined && (
                  <div key={m.label} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', marginBottom:4 }}>
                      <span style={{ color:'var(--muted)' }}>{m.label}</span>
                      <strong style={{ color:'#22c55e' }}>{(m.after ?? 0).toLocaleString()}{m.unit}</strong>
                    </div>
                    {m.label === 'Traffic Congestion' && (
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width:`${m.after}%`, background:'linear-gradient(90deg,#22c55e,#06b6d4)' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Impact metrics */}
            {impact && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.07em' }}>📈 Impact Metrics</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
                  {[
                    { label:'Congestion Reduced', value:`${impact.congestion_reduced_pct ?? 0}%`, icon:'🚦', color:'#22c55e' },
                    { label:'Vehicles Rescued',   value:impact.vehicles_rescued ?? 0, icon:'🚗', color:'#3b82f6' },
                    { label:'Citizens Alerted',   value:(impact.people_reached_by_alerts ?? 0).toLocaleString(), icon:'📢', color:'#06b6d4' },
                    { label:'Teams Deployed',     value:impact.response_teams_on_ground ?? 0, icon:'🚑', color:'#f59e0b' },
                    { label:'Actions Executed',   value:impact.actions_executed ?? 0, icon:'⚡', color:'#a78bfa' },
                  ].map(m => (
                    <div key={m.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', textAlign:'center' }}>
                      <div style={{ fontSize:'1.3rem', marginBottom:4 }}>{m.icon}</div>
                      <div style={{ fontSize:'1.4rem', fontWeight:800, color:m.color }}>{m.value}</div>
                      <div style={{ fontSize:'0.68rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution log */}
            {impact?.execution_log && impact.execution_log.length > 0 && (
              <div>
                <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em' }}>📋 Execution Log</div>
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:14, maxHeight:200, overflowY:'auto' }}>
                  {impact.execution_log.map((log, i) => (
                    <div key={i} style={{ fontSize:'0.8rem', color:'var(--text)', padding:'4px 0', borderBottom: i < impact.execution_log!.length-1 ? '1px solid var(--border)' : 'none' }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sim.summary && (
              <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:8, fontSize:'0.83rem', color:'var(--text)', lineHeight:1.6 }}>
                📊 {sim.summary}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
