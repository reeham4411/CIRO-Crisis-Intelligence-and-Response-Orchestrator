'use client'
import { useState, useEffect, useCallback } from 'react'
import SignalInput from './components/SignalInput'
import CrisisList from './components/CrisisList'
import AgentPipeline from './components/AgentPipeline'
import SimulationPanel from './components/SimulationPanel'
import AlertsPanel from './components/AlertsPanel'
import ResourcesPanel from './components/ResourcesPanel'
import StatsBar from './components/StatsBar'
import CrisisMap from './components/CrisisMap'
import type { Crisis, AgentTrace, Simulation, Alert, Resource, Signal } from '@/lib/supabase'
import type { OrchestrateResult } from '@/lib/types'

export type DashboardData = {
  crises: Crisis[]
  signals: Signal[]
  simulations: Simulation[]
  alerts: Alert[]
  resources: Resource[]
  traces: AgentTrace[]
}

type Tab = 'overview' | 'map' | 'agents' | 'simulation' | 'alerts' | 'resources'

export default function Home() {
  const [data, setData] = useState<DashboardData>({ crises: [], signals: [], simulations: [], alerts: [], resources: [], traces: [] })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<OrchestrateResult | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedCrisis, setSelectedCrisis] = useState<Crisis | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) setData(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 15000)
    return () => clearInterval(iv)
  }, [fetchData])

  const handleSignalSubmit = async (raw_text: string, source: string) => {
    setProcessing(true)
    setLastResult(null)
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text, source }),
      })
      const json: OrchestrateResult = await res.json()
      setLastResult(json)
      if (!json.error) {
        await fetchData()
        if (json.crisis) setSelectedCrisis(json.crisis)
        setActiveTab('agents')
      }
    } catch (e) {
      setLastResult({ error: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setProcessing(false)
    }
  }

  const activeCrises   = data.crises.filter(c => c.status === 'active').length
  const criticalCrises = data.crises.filter(c => c.severity === 'critical').length

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',   label: 'Overview',    icon: '⚡' },
    { id: 'map',        label: 'Live Map',    icon: '🗺️' },
    { id: 'agents',     label: 'Agent Trace', icon: '🤖' },
    { id: 'simulation', label: 'Simulation',  icon: '🔬' },
    { id: 'alerts',     label: 'Alerts',      icon: '📢' },
    { id: 'resources',  label: 'Resources',   icon: '🚑' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── SIDEBAR ── */}
      <aside style={{ width: 240, minHeight: '100vh', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>CIRO</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>CRISIS ORCHESTRATOR</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: '0.72rem', color: 'var(--success)' }}>System Operational</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', width: '100%',
              borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 4, textAlign: 'left',
              fontSize: '0.875rem', fontWeight: activeTab === t.id ? 600 : 400,
              background: activeTab === t.id ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: activeTab === t.id ? 'var(--primary2)' : 'var(--muted)',
              transition: 'all 0.15s',
            }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.id === 'alerts' && data.alerts.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700 }}>{data.alerts.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Active crises quick list */}
        {activeCrises > 0 && (
          <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active Crises</div>
            {data.crises.filter(c => c.status === 'active').slice(0, 3).map(c => (
              <button key={c.id} onClick={() => { setSelectedCrisis(c); setActiveTab('overview') }} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6,
                border: 'none', cursor: 'pointer', marginBottom: 4,
                background: selectedCrisis?.id === c.id ? 'rgba(239,68,68,0.1)' : 'transparent',
                color: 'var(--text)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="pulse-dot" style={{ background: c.severity === 'critical' ? '#ef4444' : '#f59e0b' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>{c.title.length > 28 ? c.title.slice(0, 28) + '…' : c.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
              {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {criticalCrises > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 14px' }}>
                <div className="pulse-dot" />
                <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.8rem' }}>{criticalCrises} CRITICAL</span>
              </div>
            )}
            <button onClick={fetchData} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem' }}>
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <StatsBar data={data} loading={loading} />
          <SignalInput onSubmit={handleSignalSubmit} processing={processing} lastResult={lastResult} />

          {activeTab === 'overview'   && <CrisisList crises={data.crises} signals={data.signals} loading={loading} selected={selectedCrisis} onSelect={setSelectedCrisis} />}
          {activeTab === 'map'        && <CrisisMap crises={data.crises} />}
          {activeTab === 'agents'     && <AgentPipeline traces={data.traces} crises={data.crises} selected={selectedCrisis} onSelect={setSelectedCrisis} />}
          {activeTab === 'simulation' && <SimulationPanel simulations={data.simulations} crises={data.crises} />}
          {activeTab === 'alerts'     && <AlertsPanel alerts={data.alerts} crises={data.crises} />}
          {activeTab === 'resources'  && <ResourcesPanel resources={data.resources} />}
        </div>
      </main>
    </div>
  )
}
