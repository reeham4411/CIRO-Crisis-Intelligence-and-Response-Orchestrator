import { supabase, type Signal, type Crisis } from '../supabase'

const CLUSTER_RADIUS_KM  = 5
const CLUSTER_TIME_WINDOW = 30 * 60 * 1000 // 30 minutes
const CRISIS_THRESHOLD   = 1 // signals needed to raise crisis (1 for demo speed)

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function runDetectionAgent(signal: Signal): Promise<{ crisis: Crisis | null; isNew: boolean }> {
  const start = Date.now()

  // 1. Find nearby unresolved crises of same type
  const windowStart = new Date(Date.now() - CLUSTER_TIME_WINDOW).toISOString()
  const { data: existingCrises } = await supabase
    .from('crises')
    .select('*')
    .eq('crisis_type', signal.signal_type ?? 'unknown')
    .in('status', ['active', 'monitoring'])
    .gte('created_at', windowStart)

  let matchedCrisis: Crisis | null = null

  if (existingCrises && signal.latitude && signal.longitude) {
    for (const c of existingCrises) {
      if (c.latitude && c.longitude) {
        const dist = haversineKm(signal.latitude, signal.longitude, c.latitude, c.longitude)
        if (dist <= CLUSTER_RADIUS_KM) {
          matchedCrisis = c as Crisis
          break
        }
      }
    }
  }

  // 2. If existing crisis found, increment signal count
  if (matchedCrisis) {
    const newCount = (matchedCrisis.signal_count ?? 1) + 1
    const newSeverity = newCount >= 5 ? 'critical' : newCount >= 3 ? 'high' : matchedCrisis.severity

    await supabase
      .from('crises')
      .update({ signal_count: newCount, severity: newSeverity, updated_at: new Date().toISOString() })
      .eq('id', matchedCrisis.id)

    await supabase.from('signals').update({ crisis_id: matchedCrisis.id, processed: true }).eq('id', signal.id)

    await supabase.from('agent_traces').insert({
      crisis_id:   matchedCrisis.id,
      signal_id:   signal.id,
      agent_name:  'DetectionAgent',
      step_number: 2,
      action:      'cluster_signal_to_existing_crisis',
      input:       { signal_id: signal.id, signal_type: signal.signal_type },
      output:      { crisis_id: matchedCrisis.id, signal_count: newCount },
      reasoning:   `Signal clustered to existing crisis "${matchedCrisis.title}" — within ${CLUSTER_RADIUS_KM}km radius. Signal count updated to ${newCount}.`,
      duration_ms: Date.now() - start,
      status:      'success',
    })

    return { crisis: matchedCrisis, isNew: false }
  }

  // 3. Create new crisis
  const crisisTitle = buildCrisisTitle(signal)
  const { data: newCrisis, error } = await supabase
    .from('crises')
    .insert({
      title:           crisisTitle,
      crisis_type:     signal.signal_type ?? 'unknown',
      status:          'active',
      severity:        signal.severity ?? 'medium',
      confidence:      0.5,
      confidence_label: 'Medium',
      location_name:   signal.location_name ?? 'Unknown Location',
      latitude:        signal.latitude,
      longitude:       signal.longitude,
      description:     signal.raw_text,
      signal_count:    1,
      recommendations: [],
    })
    .select()
    .single()

  if (error) throw new Error(`DetectionAgent DB error: ${error.message}`)

  await supabase.from('signals').update({ crisis_id: newCrisis.id, processed: true }).eq('id', signal.id)

  await supabase.from('agent_traces').insert({
    crisis_id:   newCrisis.id,
    signal_id:   signal.id,
    agent_name:  'DetectionAgent',
    step_number: 2,
    action:      'create_new_crisis_event',
    input:       { signal_id: signal.id, signal_type: signal.signal_type, location: signal.location_name },
    output:      { crisis_id: newCrisis.id, title: crisisTitle },
    reasoning:   `No existing nearby crisis found within ${CLUSTER_RADIUS_KM}km for type "${signal.signal_type}". New crisis event created: "${crisisTitle}".`,
    duration_ms: Date.now() - start,
    status:      'success',
  })

  return { crisis: newCrisis as Crisis, isNew: true }
}

function buildCrisisTitle(signal: Signal): string {
  const typeLabels: Record<string, string> = {
    flood:          'Urban Flooding',
    fire:           'Active Fire',
    heatwave:       'Extreme Heatwave',
    accident:       'Road Accident',
    blockage:       'Road Blockage',
    infrastructure: 'Infrastructure Failure',
    unknown:        'Unclassified Incident',
  }
  const label = typeLabels[signal.signal_type ?? 'unknown'] ?? 'Incident'
  const loc   = signal.location_name ? ` — ${signal.location_name}` : ''
  return `${label}${loc}`
}
