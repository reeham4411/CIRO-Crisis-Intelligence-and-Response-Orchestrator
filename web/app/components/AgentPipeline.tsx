'use client'
import type { AgentTrace, Crisis } from '@/lib/supabase'

type Props = { traces: AgentTrace[]; crises: Crisis[]; selected: Crisis | null; onSelect: (c: Crisis) => void }

const AGENT_META: Record<string, { icon: string; color: string; desc: string }> = {
  IngestionAgent:  { icon: '📥', color: '#3b82f6', desc: 'Normalize & classify signal' },
  DetectionAgent:  { icon: '🔍', color: '#a78bfa', desc: 'Cluster & raise crisis event' },
  AnalysisAgent:   { icon: '🧠', color: '#06b6d4', desc: 'Groq LLM situation analysis' },
  PlanningAgent:   { icon: '📋', color: '#f59e0b', desc: 'Generate response actions' },
  SimulationAgent: { icon: '🔬', color: '#22c55e', desc: 'Simulate execution' },
  ReportingAgent:  { icon: '📊', color: '#ec4899', desc: 'Outcome reporting' },
}
const STEPS = ['IngestionAgent','DetectionAgent','AnalysisAgent','PlanningAgent','SimulationAgent','ReportingAgent']

export default function AgentPipeline({ traces, crises, selected, onSelect }: Props) {
  const displayCrisis = selected ?? crises[0] ?? null
  const crisisTraces = displayCrisis
    ? traces.filter(t => t.crisis_id === displayCrisis.id).sort((a,b) => a.step_number - b.step_number)
    : traces.slice(0, 30).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div>
      {/* Crisis selector */}
      {crises.length > 0 && (
        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:6, display:'block', textTransform:'uppercase', letterSpacing:'0.07em' }}>
            View traces for crisis
          </label>
          <select className="input" style={{ maxWidth:420 }} value={displayCrisis?.id ?? ''} onChange={e => {
            const c = crises.find(x => x.id === e.target.value)
            if (c) onSelect(c)
          }}>
            {crises.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      )}

      {/* Pipeline stepper */}
      <div className="glass" style={{ padding:'20px', marginBottom:20 }}>
        <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.07em' }}>🤖 Agent Pipeline — 6 Agents</div>
        <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto', paddingBottom:4 }}>
          {STEPS.map((name, i) => {
            const meta = AGENT_META[name]
            const trace = crisisTraces.find(t => t.agent_name === name)
            const done = !!trace
            const isError = trace?.status === 'error'
            return (
              <div key={name} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 0 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:90 }}>
                  <div style={{
                    width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'1.2rem', border:`2px solid ${done ? meta.color : 'var(--border)'}`,
                    background: done ? meta.color+'22' : 'var(--surface)', transition:'all 0.4s',
                    boxShadow: done ? `0 0 12px ${meta.color}44` : 'none'
                  }}>
                    {isError ? '❌' : done ? '✅' : meta.icon}
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'0.68rem', fontWeight:600, color: done ? meta.color : 'var(--muted)', whiteSpace:'nowrap' }}>{name.replace('Agent','')}</div>
                    <div style={{ fontSize:'0.6rem', color:'var(--muted)', whiteSpace:'nowrap', maxWidth:88, overflow:'hidden', textOverflow:'ellipsis' }}>{meta.desc}</div>
                  </div>
                </div>
                {i < STEPS.length-1 && (
                  <div style={{ flex:1, height:2, background: done ? 'linear-gradient(90deg,'+meta.color+','+AGENT_META[STEPS[i+1]].color+')' : 'var(--border)', margin:'0 4px', minWidth:20, transition:'background 0.5s' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Trace logs */}
      <div className="glass" style={{ padding:20 }}>
        <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.07em' }}>
          📋 Execution Logs {crisisTraces.length > 0 && `(${crisisTraces.length} steps)`}
        </div>
        {crisisTraces.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'var(--muted)', fontSize:'0.875rem' }}>
            No traces yet — submit a signal to run the pipeline.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {crisisTraces.map((trace, i) => {
              const meta = AGENT_META[trace.agent_name] ?? { icon:'🤖', color:'#64748b', desc:'' }
              return (
                <div key={trace.id} className={`trace-step ${trace.status}`}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:meta.color+'22', border:`1px solid ${meta.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', flexShrink:0 }}>
                      {meta.icon}
                    </div>
                    <div style={{ fontWeight:700, fontSize:'0.82rem', color:meta.color }}>{trace.agent_name}</div>
                    <span style={{ fontSize:'0.72rem', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px', color:'var(--muted)', fontFamily:'monospace' }}>
                      {trace.action}
                    </span>
                    <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
                      {trace.duration_ms && <span style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{trace.duration_ms}ms</span>}
                      <span className={`badge badge-${trace.status === 'success' ? 'resolved' : 'active'}`}>{trace.status}</span>
                    </div>
                  </div>
                  {trace.reasoning && (
                    <div style={{ fontSize:'0.8rem', color:'var(--text)', lineHeight:1.5, marginBottom:6 }}>
                      💬 {trace.reasoning}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:16 }}>
                    {Object.keys(trace.output).length > 0 && (
                      <details style={{ flex:1 }}>
                        <summary style={{ fontSize:'0.7rem', color:'var(--muted)', cursor:'pointer', userSelect:'none' }}>Output ▶</summary>
                        <pre style={{ fontSize:'0.7rem', color:'var(--accent)', marginTop:4, overflowX:'auto', background:'var(--surface)', padding:'8px 10px', borderRadius:6 }}>
                          {JSON.stringify(trace.output, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div style={{ fontSize:'0.68rem', color:'var(--muted)', marginTop:4 }}>
                    {new Date(trace.created_at).toLocaleTimeString('en-PK')}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
