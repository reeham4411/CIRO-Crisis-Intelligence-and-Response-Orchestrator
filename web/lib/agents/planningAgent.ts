import { supabase, type Crisis, type ResponseAction } from '../supabase'
import { askGroq } from '../groq'

const SYSTEM_PROMPT = `You are CIRO's Action Planning Agent for Pakistani urban emergency management.
Generate concrete, coordinated response actions. Consider Pakistan resources: Rescue 1122, NDMA, WASA, Traffic Police, Edhi Foundation.
Always respond with valid JSON.`

export async function runPlanningAgent(crisis: Crisis): Promise<ResponseAction[]> {
  const start = Date.now()

  const userPrompt = `Crisis: ${crisis.title}, Type: ${crisis.crisis_type}, Severity: ${crisis.severity}, Location: ${crisis.location_name}.
Analysis: ${crisis.situation_analysis ?? 'N/A'}

Return JSON:
{
  "actions": [{ "action_type": "traffic_reroute|emergency_dispatch|public_alert|resource_allocation|road_closure|evacuation|infrastructure_repair|other", "title": "...", "description": "...", "priority": "low|medium|high|critical", "assigned_to": "...", "target_location": "..." }],
  "reasoning": "..."
}
Generate 4-6 actions for Pakistani emergency services.`

  let actions: Array<{action_type: string; title: string; description: string; priority: string; assigned_to: string; target_location: string}> = []
  let reasoning = ''

  try {
    const raw = await askGroq(SYSTEM_PROMPT, userPrompt, true)
    const parsed = JSON.parse(raw)
    actions = parsed.actions ?? []
    reasoning = parsed.reasoning ?? ''
  } catch {
    actions = getDefaultActions(crisis)
    reasoning = `Fallback plan for ${crisis.crisis_type}.`
  }

  const insertRows = actions.map(a => ({
    crisis_id: crisis.id,
    action_type: a.action_type,
    title: a.title,
    description: a.description,
    priority: a.priority ?? 'high',
    assigned_to: a.assigned_to,
    target_location: a.target_location ?? crisis.location_name,
    target_lat: crisis.latitude,
    target_lng: crisis.longitude,
    status: 'planned' as const,
    simulated: false,
  }))

  const { data, error } = await supabase.from('response_actions').insert(insertRows).select()
  if (error) throw new Error(`PlanningAgent: ${error.message}`)

  await supabase.from('agent_traces').insert({
    crisis_id: crisis.id,
    agent_name: 'PlanningAgent',
    step_number: 4,
    action: 'groq_action_planning',
    input: { crisis_id: crisis.id, crisis_type: crisis.crisis_type },
    output: { action_count: actions.length, actions: actions.map(a => a.title) },
    reasoning,
    duration_ms: Date.now() - start,
    status: 'success',
  })

  return (data ?? []) as ResponseAction[]
}

function getDefaultActions(crisis: Crisis) {
  const loc = crisis.location_name
  const base = [
    { action_type: 'public_alert', title: 'Emergency Public Broadcast', description: 'Issue SMS/push alerts to residents.', priority: 'high', assigned_to: 'NDMA Communications', target_location: loc },
    { action_type: 'emergency_dispatch', title: 'Dispatch Rescue 1122', description: 'Deploy emergency response teams.', priority: 'critical', assigned_to: 'Rescue 1122', target_location: loc },
  ]
  if (crisis.crisis_type === 'flood') {
    return [
      { action_type: 'traffic_reroute', title: 'Redirect Traffic — Alternate Routes', description: 'Activate alternate route signage and GPS rerouting.', priority: 'critical', assigned_to: 'Traffic Police', target_location: loc },
      ...base,
      { action_type: 'resource_allocation', title: 'Deploy WASA Pump Teams', description: 'Dispatch WASA emergency dewatering units.', priority: 'high', assigned_to: 'WASA Emergency', target_location: loc },
      { action_type: 'road_closure', title: 'Close Flooded Road Sections', description: 'Barricade flood-affected roads.', priority: 'high', assigned_to: 'Traffic Police', target_location: loc },
    ]
  }
  if (crisis.crisis_type === 'fire') {
    return [
      { action_type: 'emergency_dispatch', title: 'Dispatch Fire Brigade', description: 'Deploy fire trucks with full crew.', priority: 'critical', assigned_to: 'City Fire Brigade', target_location: loc },
      { action_type: 'evacuation', title: 'Evacuate Nearby Buildings', description: 'Controlled evacuation 500m radius.', priority: 'critical', assigned_to: 'Rescue 1122', target_location: loc },
      ...base,
    ]
  }
  return base
}
