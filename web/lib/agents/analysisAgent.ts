import { supabase, type Crisis, type Signal } from '../supabase'
import { askGroq } from '../groq'

const SYSTEM_PROMPT = `You are CIRO's Situation Analysis Agent — an expert AI for urban crisis management in Pakistan.
You analyze multi-source signals (social media in English/Urdu/Roman Urdu, weather data, traffic data) and produce structured crisis assessments.
Always respond with valid JSON. Be precise, practical, and considerate of Pakistani urban context.`

export async function runAnalysisAgent(
  crisis: Crisis,
  signal: Signal,
  weatherData?: Record<string, unknown>
): Promise<Crisis> {
  const start = Date.now()

  const signalSummary = [{
    source:   signal.source,
    text:     signal.raw_text,
    language: signal.language,
    type:     signal.signal_type,
    severity: signal.severity,
    location: signal.location_name,
  }]

  const userPrompt = `
Crisis Event:
- Title: ${crisis.title}
- Type: ${crisis.crisis_type}
- Location: ${crisis.location_name}
- Signal Count: ${crisis.signal_count}
- Current Severity: ${crisis.severity}

Incoming Signals:
${JSON.stringify(signalSummary, null, 2)}

${weatherData ? `Weather Data: ${JSON.stringify(weatherData, null, 2)}` : ''}

Analyze this crisis and return a JSON object with these exact fields:
{
  "confidence": <number 0-1>,
  "confidence_label": <"Low"|"Medium"|"High"|"Very High">,
  "severity": <"low"|"medium"|"high"|"critical">,
  "status": <"active"|"monitoring">,
  "situation_analysis": <detailed analysis string, 2-4 sentences>,
  "impact_summary": <concise impact description>,
  "affected_area": <estimated area string, e.g. "~3 km radius">,
  "recommendations": [<array of 3-6 action strings>]
}
`

  let analysis: Partial<Crisis> = {}
  try {
    const raw = await askGroq(SYSTEM_PROMPT, userPrompt, true)
    analysis = JSON.parse(raw)
  } catch {
    analysis = {
      confidence:        0.6,
      confidence_label:  'Medium',
      situation_analysis: 'AI analysis unavailable — using rule-based fallback.',
      impact_summary:    'Impact assessment pending.',
      recommendations:   ['Dispatch emergency services', 'Monitor situation', 'Issue public alert'],
    }
  }

  const updated = {
    confidence:        analysis.confidence        ?? crisis.confidence,
    confidence_label:  analysis.confidence_label  ?? crisis.confidence_label,
    severity:          analysis.severity           ?? crisis.severity,
    status:            analysis.status             ?? crisis.status,
    situation_analysis: analysis.situation_analysis,
    impact_summary:    analysis.impact_summary,
    affected_area:     analysis.affected_area,
    recommendations:   analysis.recommendations   ?? [],
    updated_at:        new Date().toISOString(),
  }

  await supabase.from('crises').update(updated).eq('id', crisis.id)

  await supabase.from('agent_traces').insert({
    crisis_id:   crisis.id,
    agent_name:  'AnalysisAgent',
    step_number: 3,
    action:      'groq_situation_analysis',
    input:       { crisis_id: crisis.id, signal_count: crisis.signal_count, has_weather: !!weatherData },
    output:      { confidence: updated.confidence, severity: updated.severity, confidence_label: updated.confidence_label },
    reasoning:   updated.situation_analysis ?? 'Analysis complete.',
    duration_ms: Date.now() - start,
    status:      'success',
  })

  return { ...crisis, ...updated } as Crisis
}
