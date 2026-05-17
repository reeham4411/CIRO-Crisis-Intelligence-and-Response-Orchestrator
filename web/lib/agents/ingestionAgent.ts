import { supabase, type Signal } from '../supabase'

// ---- Roman Urdu / Urdu keyword maps ----
const FLOOD_KEYWORDS = ['flood','pani','bhar','baarish','seil','barsat','paani','darya','ubalna','doob']
const FIRE_KEYWORDS  = ['fire','aag','jal','dhuaan','blast','dhamaka','lagaye','smoke']
const HEATWAVE_KEYWORDS = ['heat','garmi','tapish','luu','temperature','tez','garam']
const ACCIDENT_KEYWORDS = ['accident','haadsa','crash','tabah','takkar','zakhmi','injured','hurt']
const BLOCKAGE_KEYWORDS = ['block','jam','traffic','rasta','band','phans','stuck','road']
const INFRA_KEYWORDS    = ['bijli','electricity','light','water','gas','bridge','bridge','pipe','sewage']

const LOCATION_PRESETS: Record<string, { lat: number; lng: number }> = {
  'g-10': { lat: 33.6844, lng: 73.0479 },
  'g10':  { lat: 33.6844, lng: 73.0479 },
  'george town': { lat: 31.5546, lng: 74.3572 },
  'georgtown': { lat: 31.5546, lng: 74.3572 },
  'f-7':  { lat: 33.7217, lng: 73.0428 },
  'i-8':  { lat: 33.6698, lng: 73.0815 },
  'dha':  { lat: 33.4942, lng: 73.1016 },
  'blue area': { lat: 33.7215, lng: 73.0433 },
  'saddar': { lat: 24.8553, lng: 67.0104 },
  'clifton': { lat: 24.8118, lng: 67.0310 },
  'gulshan': { lat: 24.9215, lng: 67.0929 },
  'gulberg': { lat: 31.5024, lng: 74.3580 },
  'model town': { lat: 31.4822, lng: 74.3195 },
  'johar town': { lat: 31.4697, lng: 74.2728 },
  'hayatabad': { lat: 34.0088, lng: 71.5007 },
  'peshawar': { lat: 34.0151, lng: 71.5249 },
  'quetta': { lat: 30.1798, lng: 66.9750 },
}

function detectLanguage(text: string): Signal['language'] {
  // Simple heuristic: Urdu unicode range
  const hasUrdu = /[\u0600-\u06FF]/.test(text)
  const hasEnglish = /[a-zA-Z]/.test(text)
  if (hasUrdu && hasEnglish) return 'mixed'
  if (hasUrdu) return 'ur'
  // Roman Urdu keywords
  const lower = text.toLowerCase()
  const romanUrduWords = ['mein','hai','gaya','ho','yeh','woh','aur','ka','ki','ke','bhi','nahi','kya']
  const hasRomanUrdu = romanUrduWords.some(w => lower.includes(` ${w} `) || lower.startsWith(`${w} `))
  return hasRomanUrdu ? 'roman_ur' : 'en'
}

function detectSignalType(text: string): Signal['signal_type'] {
  const lower = text.toLowerCase()
  if (FLOOD_KEYWORDS.some(k => lower.includes(k)))    return 'flood'
  if (FIRE_KEYWORDS.some(k => lower.includes(k)))     return 'fire'
  if (HEATWAVE_KEYWORDS.some(k => lower.includes(k))) return 'heatwave'
  if (ACCIDENT_KEYWORDS.some(k => lower.includes(k))) return 'accident'
  if (BLOCKAGE_KEYWORDS.some(k => lower.includes(k))) return 'blockage'
  if (INFRA_KEYWORDS.some(k => lower.includes(k)))    return 'infrastructure'
  return 'unknown'
}

function detectSeverity(text: string, signalType: string): Signal['severity'] {
  const lower = text.toLowerCase()
  if (['flood','fire'].includes(signalType)) {
    if (lower.includes('critical') || lower.includes('emergency') || lower.includes('death') || lower.includes('maut')) return 'critical'
    if (lower.includes('bad') || lower.includes('bura') || lower.includes('bhari') || lower.includes('heavy') || lower.includes('phans')) return 'high'
    return 'medium'
  }
  return 'medium'
}

function detectLocation(text: string): { name: string | null; lat: number | null; lng: number | null } {
  const lower = text.toLowerCase()
  for (const [key, coords] of Object.entries(LOCATION_PRESETS)) {
    if (lower.includes(key)) {
      return { name: key.toUpperCase(), lat: coords.lat, lng: coords.lng }
    }
  }
  return { name: null, lat: null, lng: null }
}

export interface IngestionInput {
  raw_text: string
  source: Signal['source']
  metadata?: Record<string, unknown>
  latitude?: number
  longitude?: number
  location_name?: string
}

export async function runIngestionAgent(input: IngestionInput): Promise<Signal> {
  const start = Date.now()
  const { raw_text, source, metadata = {}, latitude, longitude, location_name } = input

  const language   = detectLanguage(raw_text)
  const signalType = detectSignalType(raw_text)
  const severity   = detectSeverity(raw_text, signalType || 'unknown')
  const locDetected = detectLocation(raw_text)

  const signal: Omit<Signal, 'id' | 'created_at'> = {
    source,
    raw_text,
    language,
    location_name: location_name ?? locDetected.name,
    latitude:      latitude ?? locDetected.lat,
    longitude:     longitude ?? locDetected.lng,
    signal_type:   signalType,
    severity,
    metadata:      { ...metadata, ingested_at: new Date().toISOString() },
    processed:     false,
    crisis_id:     null,
  }

  const { data, error } = await supabase
    .from('signals')
    .insert(signal)
    .select()
    .single()

  if (error) throw new Error(`IngestionAgent DB error: ${error.message}`)

  // Log trace
  await supabase.from('agent_traces').insert({
    signal_id:   data.id,
    agent_name:  'IngestionAgent',
    step_number: 1,
    action:      'ingest_and_normalize_signal',
    input:       { raw_text, source },
    output:      { signal_type: signalType, language, severity, location_name: signal.location_name },
    reasoning:   `Detected language: ${language}. Signal type inferred from keywords: ${signalType}. Location extracted: ${signal.location_name ?? 'unknown'}. Severity estimated: ${severity}.`,
    duration_ms: Date.now() - start,
    status:      'success',
  })

  return data as Signal
}
