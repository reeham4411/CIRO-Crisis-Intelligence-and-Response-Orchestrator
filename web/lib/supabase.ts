import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

export type Signal = {
  id: string
  source: 'social_media' | 'weather' | 'traffic' | 'sensor' | 'nasa_firms' | 'manual'
  raw_text: string | null
  language: 'en' | 'ur' | 'roman_ur' | 'mixed'
  location_name: string | null
  latitude: number | null
  longitude: number | null
  signal_type: string | null
  severity: string | null
  metadata: Record<string, unknown>
  processed: boolean
  crisis_id: string | null
  created_at: string
}

export type Crisis = {
  id: string
  title: string
  crisis_type: string
  status: 'active' | 'monitoring' | 'resolved' | 'false_alarm'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  confidence_label: 'Low' | 'Medium' | 'High' | 'Very High'
  location_name: string
  latitude: number | null
  longitude: number | null
  affected_area: string | null
  description: string | null
  signal_count: number
  situation_analysis: string | null
  impact_summary: string | null
  recommendations: string[]
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export type AgentTrace = {
  id: string
  crisis_id: string | null
  signal_id: string | null
  agent_name: string
  step_number: number
  action: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  reasoning: string | null
  duration_ms: number | null
  status: 'success' | 'error' | 'warning'
  created_at: string
}

export type ResponseAction = {
  id: string
  crisis_id: string
  action_type: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigned_to: string | null
  target_location: string | null
  target_lat: number | null
  target_lng: number | null
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  simulated: boolean
  metadata: Record<string, unknown>
  created_at: string
  executed_at: string | null
}

export type Simulation = {
  id: string
  crisis_id: string
  simulation_name: string
  status: 'running' | 'completed' | 'failed'
  before_state: Record<string, unknown>
  after_state: Record<string, unknown>
  impact_metrics: Record<string, unknown>
  actions_executed: number
  summary: string | null
  created_at: string
  completed_at: string | null
}

export type Alert = {
  id: string
  crisis_id: string
  alert_type: string
  title: string
  title_ur: string | null
  message: string
  message_ur: string | null
  severity: string | null
  target_area: string | null
  recipients: number
  delivered: boolean
  created_at: string
}

export type Resource = {
  id: string
  resource_type: string
  name: string
  status: 'available' | 'dispatched' | 'maintenance' | 'offline'
  current_location: string | null
  latitude: number | null
  longitude: number | null
  assigned_crisis: string | null
  contact: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}
