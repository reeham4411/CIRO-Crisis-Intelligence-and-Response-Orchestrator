import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'

const WEB_API = 'http://localhost:3000'
const C = {
  bg: '#0a0f1e', bg2: '#0d1528', surface: '#111827', surface2: '#1a2744',
  border: '#1e3a5f', primary: '#3b82f6', accent: '#06b6d4',
  danger: '#ef4444', warning: '#f59e0b', success: '#22c55e',
  text: '#e2e8f0', muted: '#64748b', critical: '#ef4444', high: '#f59e0b',
}
const SEV: Record<string,string> = { critical:'#ef4444', high:'#f59e0b', medium:'#3b82f6', low:'#22c55e' }
const ICONS: Record<string,string> = { flood:'🌊', fire:'🔥', heatwave:'🌡️', accident:'🚗', road_blockage:'🚧', infrastructure_failure:'⚡', unknown:'⚠️' }

const SAMPLES = [
  { text:'G-10 mein pani bhar gaya hai, gaariyan phans gayi hain!', source:'social_media', label:'🌊 G-10 Flood' },
  { text:'Flash flood happening at George Town for 30 mins', source:'social_media', label:'🌊 George Town' },
  { text:'بڑی آگ لگی ہے صدر کراچی میں', source:'social_media', label:'🔥 Saddar Fire' },
  { text:'Serious accident on Margalla Road near F-7', source:'social_media', label:'🚗 Margalla Crash' },
  { text:'Extreme heat warning: 47°C in Islamabad, heatstroke cases', source:'weather', label:'🌡️ Heatwave' },
]

type Crisis = { id:string; title:string; crisis_type:string; status:string; severity:string; confidence:number; confidence_label:string; location_name:string; signal_count:number; situation_analysis?:string; impact_summary?:string; recommendations?:string[] }
type Alert = { id:string; title:string; message:string; message_ur?:string; severity?:string; target_area?:string; recipients:number; delivered:boolean; created_at:string }
type Trace = { id:string; agent_name:string; action:string; reasoning?:string; status:string; duration_ms?:number; created_at:string }

type Tab = 'home' | 'crises' | 'pipeline' | 'alerts'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [input, setInput] = useState('')
  const [source, setSource] = useState('social_media')
  const [processing, setProcessing] = useState(false)
  const [crises, setCrises] = useState<Crisis[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [traces, setTraces] = useState<Trace[]>([])
  const [lastResult, setLastResult] = useState<{crisis?:Crisis; report?:string; error?:string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCrisis, setSelectedCrisis] = useState<Crisis | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch(`${WEB_API}/api/dashboard`)
      if (res.ok) {
        const j = await res.json()
        setCrises(j.crises ?? [])
        setAlerts(j.alerts ?? [])
        setTraces(j.traces ?? [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 15000); return () => clearInterval(t) }, [])

  const runPipeline = async () => {
    if (!input.trim()) return
    setProcessing(true); setLastResult(null); setTab('home')
    try {
      const res = await fetch(`${WEB_API}/api/orchestrate`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ raw_text: input.trim(), source }),
      })
      const j = await res.json()
      setLastResult(j)
      if (!j.error) { await fetchData(); if (j.crisis) setSelectedCrisis(j.crisis); setTab('pipeline') }
    } catch (e) { setLastResult({ error: e instanceof Error ? e.message : 'Connection error' }) }
    finally { setProcessing(false); setInput('') }
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" backgroundColor={C.bg2} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.logo}><Text style={{ fontSize:18 }}>🛡️</Text></View>
        <View>
          <Text style={s.title}>CIRO</Text>
          <Text style={s.subtitle}>Crisis Intelligence & Response</Text>
        </View>
        <View style={s.liveChip}>
          <View style={s.dot} /><Text style={s.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Stats bar */}
      <View style={s.statsRow}>
        {[
          { label:'Events', val: crises.length, color:C.danger },
          { label:'Active',  val: crises.filter(c=>c.status==='active').length, color:C.warning },
          { label:'Alerts',  val: alerts.length, color:C.accent },
          { label:'Critical',val: crises.filter(c=>c.severity==='critical').length, color:C.critical },
        ].map(m => (
          <View key={m.label} style={s.statCard}>
            <Text style={[s.statVal, { color:m.color }]}>{m.val}</Text>
            <Text style={s.statLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {([['home','⚡','Feed'],['crises','🚨','Crises'],['pipeline','🤖','Pipeline'],['alerts','📢','Alerts']] as const).map(([id,icon,label]) => (
          <TouchableOpacity key={id} style={[s.tab, tab===id && s.tabActive]} onPress={() => setTab(id)}>
            <Text style={{ fontSize:16 }}>{icon}</Text>
            <Text style={[s.tabLabel, tab===id && { color:C.primary }]}>{label}</Text>
            {id==='alerts' && alerts.length>0 && <View style={s.badge}><Text style={s.badgeText}>{alerts.length}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>

        {/* HOME TAB */}
        {tab === 'home' && (
          <View>
            {/* Signal Input */}
            <View style={s.card}>
              <Text style={s.cardTitle}>📡 Signal Ingestion</Text>
              <Text style={s.cardSub}>Submit in English, Urdu, or Roman Urdu</Text>

              {/* Quick samples */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }}>
                <View style={{ flexDirection:'row', gap:8, paddingHorizontal:2 }}>
                  {SAMPLES.map((s,i) => (
                    <TouchableOpacity key={i} style={s2.sampleBtn} onPress={() => { setInput(s.text); setSource(s.source) }}>
                      <Text style={s2.sampleText}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TextInput
                style={s2.input}
                value={input}
                onChangeText={setInput}
                placeholder="Enter signal text here…"
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Source picker */}
              <View style={{ flexDirection:'row', gap:6, marginTop:10, flexWrap:'wrap' }}>
                {[['social_media','📱 Social'],['weather','🌤️ Weather'],['traffic','🚦 Traffic'],['manual','✍️ Manual']].map(([v,l]) => (
                  <TouchableOpacity key={v} style={[s2.sourceBtn, source===v && s2.sourceBtnActive]} onPress={() => setSource(v)}>
                    <Text style={[s2.sourceTxt, source===v && { color:C.primary }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[s2.runBtn, (!input.trim() || processing) && s2.runBtnDis]} onPress={runPipeline} disabled={processing || !input.trim()}>
                {processing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s2.runTxt}>🚀 Run Agent Pipeline</Text>}
              </TouchableOpacity>
            </View>

            {/* Last result */}
            {lastResult && !processing && (
              <View style={[s.card, { borderColor: lastResult.error ? C.danger : C.success }]}>
                {lastResult.error ? (
                  <Text style={{ color:C.danger, fontSize:14 }}>❌ {lastResult.error}</Text>
                ) : (
                  <View>
                    <Text style={{ color:C.success, fontWeight:'700', fontSize:15, marginBottom:6 }}>✅ Crisis Detected!</Text>
                    {lastResult.crisis && <>
                      <Text style={{ color:C.text, fontWeight:'600', marginBottom:4 }}>{lastResult.crisis.title}</Text>
                      <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                        <View style={[s2.pill, { backgroundColor: (SEV[lastResult.crisis.severity]??C.muted)+'22', borderColor:(SEV[lastResult.crisis.severity]??C.muted)+'44' }]}>
                          <Text style={{ color:SEV[lastResult.crisis.severity]??C.muted, fontSize:11, fontWeight:'700' }}>{lastResult.crisis.severity.toUpperCase()}</Text>
                        </View>
                        <View style={s2.pill}>
                          <Text style={{ color:C.muted, fontSize:11 }}>Confidence: {lastResult.crisis.confidence_label}</Text>
                        </View>
                      </View>
                      {lastResult.crisis.situation_analysis && <Text style={{ color:C.muted, fontSize:12, lineHeight:18 }}>{lastResult.crisis.situation_analysis}</Text>}
                    </>}
                    {lastResult.report && <Text style={{ color:C.accent, fontSize:12, marginTop:8 }}>📊 {lastResult.report}</Text>}
                    <Text style={{ color:C.success, fontSize:11, marginTop:8 }}>👉 Switch to Pipeline tab to see agent traces</Text>
                  </View>
                )}
              </View>
            )}

            {/* Active crises preview */}
            {crises.filter(c=>c.status==='active').length > 0 && (
              <View style={s.card}>
                <Text style={s.cardTitle}>🚨 Active Crises</Text>
                {crises.filter(c=>c.status==='active').slice(0,3).map(crisis => (
                  <TouchableOpacity key={crisis.id} style={s2.crisisRow} onPress={() => { setSelectedCrisis(crisis); setTab('crises') }}>
                    <Text style={{ fontSize:20 }}>{ICONS[crisis.crisis_type]??'⚠️'}</Text>
                    <View style={{ flex:1, marginLeft:10 }}>
                      <Text style={{ color:C.text, fontWeight:'600', fontSize:13 }}>{crisis.title}</Text>
                      <Text style={{ color:C.muted, fontSize:11, marginTop:2 }}>📍 {crisis.location_name}</Text>
                    </View>
                    <View style={[s2.pill, { backgroundColor:(SEV[crisis.severity]??C.muted)+'22', borderColor:(SEV[crisis.severity]??C.muted)+'44' }]}>
                      <Text style={{ color:SEV[crisis.severity]??C.muted, fontSize:10, fontWeight:'700' }}>{crisis.severity.toUpperCase()}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* CRISES TAB */}
        {tab === 'crises' && (
          <View>
            {loading ? <ActivityIndicator color={C.primary} style={{ marginTop:40 }} /> :
            crises.length === 0 ? (
              <View style={s2.empty}>
                <Text style={{ fontSize:40, marginBottom:12 }}>🟢</Text>
                <Text style={{ color:C.text, fontWeight:'600', fontSize:16, marginBottom:6 }}>All Clear</Text>
                <Text style={{ color:C.muted, fontSize:13 }}>No crisis events detected</Text>
              </View>
            ) : (
              crises.map(crisis => {
                const sev = SEV[crisis.severity] ?? C.muted
                const expanded = selectedCrisis?.id === crisis.id
                return (
                  <TouchableOpacity key={crisis.id} onPress={() => setSelectedCrisis(expanded ? null : crisis)}>
                    <View style={[s.card, { borderLeftWidth:3, borderLeftColor:sev }]}>
                      <View style={{ flexDirection:'row', alignItems:'flex-start', gap:10 }}>
                        <Text style={{ fontSize:24 }}>{ICONS[crisis.crisis_type]??'⚠️'}</Text>
                        <View style={{ flex:1 }}>
                          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:5 }}>
                            <Text style={{ color:C.text, fontWeight:'700', fontSize:13, flex:1 }}>{crisis.title}</Text>
                          </View>
                          <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:5 }}>
                            <View style={[s2.pill,{backgroundColor:sev+'22',borderColor:sev+'44'}]}><Text style={{color:sev,fontSize:10,fontWeight:'700'}}>{crisis.severity.toUpperCase()}</Text></View>
                            <View style={s2.pill}><Text style={{color:C.muted,fontSize:10}}>{crisis.status}</Text></View>
                          </View>
                          <Text style={{ color:C.muted, fontSize:11, marginBottom:4 }}>📍 {crisis.location_name} · 📡 {crisis.signal_count} signals</Text>
                          <Text style={{ color:C.muted, fontSize:11 }}>🎯 {crisis.confidence_label} ({Math.round(crisis.confidence*100)}%)</Text>
                        </View>
                        <Text style={{ color:C.muted, fontSize:16 }}>{expanded ? '▲' : '▼'}</Text>
                      </View>
                      {expanded && crisis.situation_analysis && (
                        <View style={{ marginTop:12, borderTopWidth:1, borderTopColor:C.border, paddingTop:12 }}>
                          <Text style={{ color:C.muted, fontSize:11, marginBottom:6, textTransform:'uppercase', letterSpacing:0.8 }}>Situation Analysis</Text>
                          <Text style={{ color:C.text, fontSize:12, lineHeight:18 }}>{crisis.situation_analysis}</Text>
                          {crisis.impact_summary && <>
                            <Text style={{ color:C.muted, fontSize:11, marginTop:10, marginBottom:4, textTransform:'uppercase', letterSpacing:0.8 }}>Impact</Text>
                            <Text style={{ color:C.text, fontSize:12, lineHeight:18 }}>{crisis.impact_summary}</Text>
                          </>}
                          {crisis.recommendations?.length && <>
                            <Text style={{ color:C.muted, fontSize:11, marginTop:10, marginBottom:6, textTransform:'uppercase', letterSpacing:0.8 }}>Actions</Text>
                            {crisis.recommendations.slice(0,4).map((r,i) => (
                              <Text key={i} style={{ color:C.text, fontSize:12, lineHeight:18, marginBottom:3 }}>• {r}</Text>
                            ))}
                          </>}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        )}

        {/* PIPELINE TAB */}
        {tab === 'pipeline' && (
          <View>
            {/* Agent steps */}
            <View style={s.card}>
              <Text style={s.cardTitle}>🤖 Agent Pipeline</Text>
              {['IngestionAgent','DetectionAgent','AnalysisAgent','PlanningAgent','SimulationAgent','ReportingAgent'].map((name, i) => {
                const meta: Record<string,{icon:string;color:string}> = {
                  IngestionAgent:{icon:'📥',color:'#3b82f6'}, DetectionAgent:{icon:'🔍',color:'#a78bfa'},
                  AnalysisAgent:{icon:'🧠',color:'#06b6d4'}, PlanningAgent:{icon:'📋',color:'#f59e0b'},
                  SimulationAgent:{icon:'🔬',color:'#22c55e'}, ReportingAgent:{icon:'📊',color:'#ec4899'},
                }
                const m = meta[name]
                const trace = traces.find(t => t.agent_name === name)
                const done = !!trace
                return (
                  <View key={name} style={{ flexDirection:'row', alignItems:'flex-start', marginBottom:12 }}>
                    <View style={{ alignItems:'center', marginRight:12 }}>
                      <View style={[s2.stepCircle, { borderColor:done?m.color:C.border, backgroundColor:done?m.color+'22':C.surface2 }]}>
                        <Text style={{ fontSize:14 }}>{done ? '✅' : m.icon}</Text>
                      </View>
                      {i < 5 && <View style={{ width:2, height:20, backgroundColor:done?m.color:C.border, marginTop:3 }} />}
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ color:done?m.color:C.muted, fontWeight:'700', fontSize:13 }}>{name}</Text>
                      {trace?.reasoning && <Text style={{ color:C.text, fontSize:11, lineHeight:16, marginTop:3 }}>{trace.reasoning.slice(0,120)}{trace.reasoning.length>120?'…':''}</Text>}
                      {trace?.duration_ms && <Text style={{ color:C.muted, fontSize:10, marginTop:2 }}>{trace.duration_ms}ms · {trace.status}</Text>}
                    </View>
                  </View>
                )
              })}
            </View>

            {/* Recent traces */}
            <View style={s.card}>
              <Text style={s.cardTitle}>📋 Recent Trace Logs</Text>
              {traces.slice(0,20).map(t => (
                <View key={t.id} style={s2.traceRow}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:3 }}>
                    <Text style={{ color:C.accent, fontWeight:'600', fontSize:12 }}>{t.agent_name}</Text>
                    <Text style={{ color:t.status==='success'?C.success:C.danger, fontSize:10 }}>{t.status}</Text>
                  </View>
                  <Text style={{ color:C.muted, fontSize:10, fontFamily:Platform.OS==='ios'?'Menlo':'monospace' }}>{t.action}</Text>
                  {t.reasoning && <Text style={{ color:C.text, fontSize:11, marginTop:3, lineHeight:15 }}>{t.reasoning.slice(0,100)}{t.reasoning.length>100?'…':''}</Text>}
                  <Text style={{ color:C.muted, fontSize:9, marginTop:3 }}>{new Date(t.created_at).toLocaleTimeString('en-PK')}{t.duration_ms?` · ${t.duration_ms}ms`:''}</Text>
                </View>
              ))}
              {traces.length === 0 && <Text style={{ color:C.muted, fontSize:13, textAlign:'center', paddingVertical:20 }}>No traces yet — run the pipeline first</Text>}
            </View>
          </View>
        )}

        {/* ALERTS TAB */}
        {tab === 'alerts' && (
          <View>
            {alerts.length === 0 ? (
              <View style={s2.empty}>
                <Text style={{ fontSize:40, marginBottom:12 }}>📢</Text>
                <Text style={{ color:C.text, fontWeight:'600', fontSize:16, marginBottom:6 }}>No Alerts</Text>
                <Text style={{ color:C.muted, fontSize:13 }}>Alerts are issued during simulation</Text>
              </View>
            ) : alerts.map(alert => {
              const sevColor = alert.severity === 'critical' ? C.danger : alert.severity === 'danger' ? '#f97316' : C.warning
              return (
                <View key={alert.id} style={[s.card, { borderLeftWidth:3, borderLeftColor:sevColor }]}>
                  <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:6, alignItems:'center' }}>
                    <Text style={{ color:C.text, fontWeight:'700', fontSize:13, flex:1 }}>{alert.title}</Text>
                    <View style={[s2.pill,{backgroundColor:sevColor+'22',borderColor:sevColor+'44'}]}><Text style={{color:sevColor,fontSize:10,fontWeight:'700'}}>{alert.severity?.toUpperCase()}</Text></View>
                    <View style={[s2.pill,{backgroundColor:alert.delivered?C.success+'22':C.warning+'22',borderColor:alert.delivered?C.success+'44':C.warning+'44'}]}>
                      <Text style={{color:alert.delivered?C.success:C.warning,fontSize:10}}>{alert.delivered?'Delivered':'Pending'}</Text>
                    </View>
                  </View>
                  <Text style={{ color:C.text, fontSize:12, lineHeight:18, marginBottom:8 }}>{alert.message}</Text>
                  {alert.message_ur && (
                    <View style={{ backgroundColor:'rgba(6,182,212,0.08)', borderWidth:1, borderColor:'rgba(6,182,212,0.25)', borderRadius:8, padding:10, marginBottom:8 }}>
                      <Text style={{ color:C.accent, fontSize:13, lineHeight:20, textAlign:'right', writingDirection:'rtl' }}>{alert.message_ur}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection:'row', gap:12, flexWrap:'wrap' }}>
                    <Text style={{ color:C.muted, fontSize:11 }}>📍 {alert.target_area ?? 'N/A'}</Text>
                    <Text style={{ color:C.muted, fontSize:11 }}>👥 {alert.recipients.toLocaleString()}</Text>
                    <Text style={{ color:C.muted, fontSize:11 }}>🕐 {new Date(alert.created_at).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },
  header: { flexDirection:'row', alignItems:'center', gap:12, padding:16, paddingTop:50, backgroundColor:C.bg2, borderBottomWidth:1, borderBottomColor:C.border },
  logo: { width:40, height:40, borderRadius:10, backgroundColor:'#1e3a5f', alignItems:'center', justifyContent:'center' },
  title: { color:C.text, fontWeight:'800', fontSize:18, letterSpacing:1 },
  subtitle: { color:C.muted, fontSize:10, letterSpacing:0.5 },
  liveChip: { marginLeft:'auto', flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(34,197,94,0.12)', borderWidth:1, borderColor:'rgba(34,197,94,0.3)', borderRadius:20, paddingHorizontal:10, paddingVertical:4 },
  dot: { width:6, height:6, borderRadius:3, backgroundColor:C.success },
  liveText: { color:C.success, fontSize:10, fontWeight:'700', letterSpacing:1 },
  statsRow: { flexDirection:'row', backgroundColor:C.bg2, borderBottomWidth:1, borderBottomColor:C.border },
  statCard: { flex:1, padding:12, alignItems:'center', borderRightWidth:1, borderRightColor:C.border },
  statVal: { fontSize:22, fontWeight:'800', lineHeight:26 },
  statLabel: { color:C.muted, fontSize:9, textTransform:'uppercase', letterSpacing:0.8, marginTop:2 },
  tabBar: { flexDirection:'row', backgroundColor:C.bg2, borderBottomWidth:1, borderBottomColor:C.border },
  tab: { flex:1, paddingVertical:10, alignItems:'center', gap:2 },
  tabActive: { borderBottomWidth:2, borderBottomColor:C.primary },
  tabLabel: { color:C.muted, fontSize:10, fontWeight:'600' },
  badge: { position:'absolute', top:6, right:12, backgroundColor:C.danger, borderRadius:8, minWidth:16, height:16, alignItems:'center', justifyContent:'center', paddingHorizontal:3 },
  badgeText: { color:'#fff', fontSize:9, fontWeight:'700' },
  content: { flex:1, padding:12 },
  card: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:12, padding:16, marginBottom:12 },
  cardTitle: { color:C.text, fontWeight:'700', fontSize:14, marginBottom:4 },
  cardSub: { color:C.muted, fontSize:11, marginBottom:14 },
})

const s2 = StyleSheet.create({
  sampleBtn: { backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, borderRadius:6, paddingHorizontal:12, paddingVertical:7 },
  sampleText: { color:C.text, fontSize:11 },
  input: { backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, borderRadius:8, padding:12, color:C.text, fontSize:13, minHeight:80, textAlignVertical:'top' },
  sourceBtn: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:6, paddingHorizontal:12, paddingVertical:6 },
  sourceBtnActive: { borderColor:C.primary, backgroundColor:'rgba(59,130,246,0.1)' },
  sourceTxt: { color:C.muted, fontSize:11 },
  runBtn: { backgroundColor:C.primary, borderRadius:8, padding:14, alignItems:'center', marginTop:12, flexDirection:'row', justifyContent:'center', gap:8 },
  runBtnDis: { opacity:0.5 },
  runTxt: { color:'#fff', fontWeight:'700', fontSize:14 },
  pill: { backgroundColor:C.surface2, borderWidth:1, borderColor:C.border, borderRadius:20, paddingHorizontal:8, paddingVertical:3 },
  crisisRow: { flexDirection:'row', alignItems:'center', paddingVertical:10, borderTopWidth:1, borderTopColor:C.border, marginTop:8 },
  empty: { alignItems:'center', paddingVertical:60 },
  stepCircle: { width:36, height:36, borderRadius:18, borderWidth:2, alignItems:'center', justifyContent:'center' },
  traceRow: { borderTopWidth:1, borderTopColor:C.border, paddingTop:10, marginTop:10 },
})
