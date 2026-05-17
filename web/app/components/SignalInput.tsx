'use client'
import { useState } from 'react'
import type { OrchestrateResult } from '@/lib/types'

type Props = {
  onSubmit: (text: string, source: string) => Promise<void>
  processing: boolean
  lastResult: OrchestrateResult | null
}

const SAMPLE_SIGNALS = [
  { text: 'G-10 mein pani bhar gaya hai, gaariyan phans gayi hain aur log phanse huay hain!', source: 'social_media', label: '🌊 G-10 Flood (Roman Urdu)' },
  { text: 'Flash flood happening at George Town for past 30 mins, roads completely blocked!', source: 'social_media', label: '🌊 George Town Flood' },
  { text: 'بڑی آگ لگی ہے صدر کراچی میں، دھواں دور دور سے نظر آ رہا ہے', source: 'social_media', label: '🔥 Saddar Fire (Urdu)' },
  { text: 'Serious accident on Margalla Road near F-7, multiple vehicles involved, road blocked', source: 'social_media', label: '🚗 Margalla Accident' },
  { text: 'Bijli gul ho gayi hai poore DHA mein, 3 ghante se zyada ho gaye hain', source: 'social_media', label: '⚡ DHA Power Outage' },
  { text: 'Extreme heat warning: Islamabad temperature 47°C, heatstroke cases reported', source: 'weather', label: '🌡️ Heatwave Alert' },
]

const SOURCES = [
  { value: 'social_media', label: '📱 Social Media' },
  { value: 'weather',      label: '🌤️ Weather API'  },
  { value: 'traffic',      label: '🚦 Traffic API'  },
  { value: 'sensor',       label: '📡 IoT Sensor'   },
  { value: 'nasa_firms',   label: '🛰️ NASA FIRMS'  },
  { value: 'manual',       label: '✍️ Manual'       },
]

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e'
}

export default function SignalInput({ onSubmit, processing, lastResult }: Props) {
  const [text, setText]       = useState('')
  const [source, setSource]   = useState('social_media')
  const [expanded, setExpanded] = useState(true)

  const handleSubmit = async () => {
    if (!text.trim()) return
    await onSubmit(text.trim(), source)
    setText('')
  }

  return (
    <div className="glass" style={{ marginBottom: 24, overflow: 'hidden' }}>
      {/* Header toggle */}
      <div
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📡</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>Signal Ingestion Console</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>English · اردو · Roman Urdu — all supported</div>
          </div>
        </div>
        <span style={{ color: 'var(--muted)' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: 20 }}>
          {/* Quick samples */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick Scenarios</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SAMPLE_SIGNALS.map((s, i) => (
                <button key={i} onClick={() => { setText(s.text); setSource(s.source) }}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: '0.78rem', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >{s.label}</button>
              ))}
            </div>
          </div>

          {/* Input + source */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, marginBottom: 12 }}>
            <textarea
              className="input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'Signal text… e.g. "G-10 mein pani bhar gaya hai" or "Flash flood at George Town"'}
              style={{ minHeight: 80, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Source</label>
                <select className="input" value={source} onChange={e => setSource(e.target.value)}>
                  {SOURCES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={processing || !text.trim()} style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
                {processing
                  ? <><span style={{ display: 'flex', gap: 3 }}><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span> Processing…</>
                  : <>🚀 Run Pipeline</>
                }
              </button>
            </div>
          </div>

          {/* Result */}
          {lastResult && !processing && (
            <div style={{ padding: '14px 16px', borderRadius: 8, border: lastResult.error ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(34,197,94,0.3)', background: lastResult.error ? 'rgba(239,68,68,0.07)' : 'rgba(34,197,94,0.07)' }}>
              {lastResult.error ? (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>❌ {lastResult.error}</div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
                      ✅ {lastResult.isNew ? 'New crisis detected' : 'Signal added to existing crisis'}
                    </span>
                    {lastResult.crisis?.severity && (
                      <span className="badge" style={{ background: (SEV_COLORS[lastResult.crisis.severity] ?? '#64748b') + '22', color: SEV_COLORS[lastResult.crisis.severity] ?? '#64748b', border: `1px solid ${SEV_COLORS[lastResult.crisis.severity] ?? '#64748b'}44` }}>
                        {lastResult.crisis.severity.toUpperCase()}
                      </span>
                    )}
                    {lastResult.crisis?.confidence_label && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Confidence: <strong style={{ color: 'var(--text)' }}>{lastResult.crisis.confidence_label}</strong></span>
                    )}
                  </div>
                  {lastResult.crisis?.title && <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{lastResult.crisis.title}</div>}
                  {lastResult.crisis?.situation_analysis && <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>{lastResult.crisis.situation_analysis}</div>}
                  {lastResult.report && <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 4 }}>📊 {lastResult.report}</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 2 }}>👉 Switch to Agent Trace tab to see full pipeline execution</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
