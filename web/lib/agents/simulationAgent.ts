import { supabase, type Crisis, type ResponseAction, type Simulation } from '../supabase'

interface SimState {
  traffic_congestion_pct: number
  vehicles_stranded: number
  response_teams_deployed: number
  alerts_sent: number
  roads_closed: number
  resources_allocated: number
  estimated_affected_people: number
}

function buildBeforeState(crisis: Crisis): SimState {
  const multiplier = crisis.severity === 'critical' ? 4 : crisis.severity === 'high' ? 3 : crisis.severity === 'medium' ? 2 : 1
  return {
    traffic_congestion_pct:    Math.min(95, 40 + multiplier * 15),
    vehicles_stranded:         multiplier * 50,
    response_teams_deployed:   0,
    alerts_sent:               0,
    roads_closed:              0,
    resources_allocated:       0,
    estimated_affected_people: multiplier * 500,
  }
}

function buildAfterState(before: SimState, actions: ResponseAction[]): SimState {
  let congestionReduction = 0
  let rescueBonus = 0
  let alertsCount = 0
  let closures = 0
  let resources = 0
  let teams = 0

  for (const a of actions) {
    switch (a.action_type) {
      case 'traffic_reroute':     congestionReduction += 25; break
      case 'road_closure':        closures++; congestionReduction += 10; break
      case 'emergency_dispatch':  teams++; rescueBonus += 30; break
      case 'resource_allocation': resources++; rescueBonus += 15; break
      case 'public_alert':        alertsCount += 1500; break
      case 'evacuation':          rescueBonus += 20; break
      default: break
    }
  }

  return {
    traffic_congestion_pct:    Math.max(5, before.traffic_congestion_pct - congestionReduction),
    vehicles_stranded:         Math.max(0, before.vehicles_stranded - Math.round(rescueBonus * 0.8)),
    response_teams_deployed:   teams + resources,
    alerts_sent:               alertsCount,
    roads_closed:              closures,
    resources_allocated:       resources,
    estimated_affected_people: Math.max(0, before.estimated_affected_people - Math.round(rescueBonus * 3)),
  }
}

export async function runSimulationAgent(
  crisis: Crisis,
  actions: ResponseAction[]
): Promise<Simulation> {
  const start = Date.now()

  const beforeState = buildBeforeState(crisis)

  // Create simulation record
  const { data: sim, error } = await supabase
    .from('simulations')
    .insert({
      crisis_id:       crisis.id,
      simulation_name: `Response Simulation — ${crisis.title}`,
      status:          'running',
      before_state:    beforeState,
      after_state:     {},
      impact_metrics:  {},
      actions_executed: 0,
    })
    .select()
    .single()

  if (error) throw new Error(`SimulationAgent: ${error.message}`)

  // Simulate executing each action with delay markers
  const executionLog: string[] = []
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    const simMsg = getSimulationMessage(action)
    executionLog.push(simMsg)

    await supabase
      .from('response_actions')
      .update({ status: 'completed', simulated: true, executed_at: new Date().toISOString() })
      .eq('id', action.id)

    await supabase.from('agent_traces').insert({
      crisis_id:   crisis.id,
      agent_name:  'SimulationAgent',
      step_number: 5,
      action:      `simulate_${action.action_type}`,
      input:       { action_id: action.id, action_title: action.title },
      output:      { message: simMsg, step: i + 1 },
      reasoning:   `Simulated execution of "${action.title}" assigned to ${action.assigned_to}.`,
      duration_ms: 120 + i * 50,
      status:      'success',
    })
  }

  // Generate alerts for public_alert actions
  const alertActions = actions.filter(a => a.action_type === 'public_alert')
  for (const a of alertActions) {
    await supabase.from('alerts').insert({
      crisis_id:   crisis.id,
      alert_type:  'broadcast',
      title:       a.title,
      title_ur:    getUrduTitle(crisis.crisis_type),
      message:     `CIRO ALERT: ${crisis.title}. ${a.description ?? ''}. Stay safe and follow official instructions.`,
      message_ur:  `خبردار: ${crisis.location_name} میں ہنگامی صورتحال۔ محفوظ رہیں اور سرکاری ہدایات پر عمل کریں۔`,
      severity:    crisis.severity === 'critical' ? 'critical' : 'danger',
      target_area: crisis.location_name,
      recipients:  Math.floor(Math.random() * 5000) + 2000,
      delivered:   true,
    })
  }

  const afterState  = buildAfterState(beforeState, actions)
  const impact_metrics = {
    congestion_reduced_pct:      beforeState.traffic_congestion_pct - afterState.traffic_congestion_pct,
    vehicles_rescued:            beforeState.vehicles_stranded - afterState.vehicles_stranded,
    people_reached_by_alerts:    afterState.alerts_sent,
    response_teams_on_ground:    afterState.response_teams_deployed,
    simulation_duration_ms:      Date.now() - start,
    actions_executed:            actions.length,
    execution_log:               executionLog,
  }

  const summary = `Simulation complete. Congestion reduced by ${impact_metrics.congestion_reduced_pct}%. ` +
    `${impact_metrics.vehicles_rescued} vehicles extracted. ` +
    `${impact_metrics.people_reached_by_alerts.toLocaleString()} citizens alerted. ` +
    `${actions.length} response actions executed.`

  await supabase
    .from('simulations')
    .update({
      status:           'completed',
      after_state:      afterState,
      impact_metrics,
      actions_executed: actions.length,
      summary,
      completed_at:     new Date().toISOString(),
    })
    .eq('id', sim.id)

  return { ...sim, status: 'completed', after_state: afterState, before_state: beforeState, impact_metrics, summary } as Simulation
}

function getSimulationMessage(action: ResponseAction): string {
  const msgs: Record<string, string> = {
    traffic_reroute:     `✅ Route updated on map — alternate paths activated via ${action.target_location}`,
    emergency_dispatch:  `🚨 ${action.assigned_to} dispatched — ETA ~8 minutes to ${action.target_location}`,
    public_alert:        `📢 Emergency broadcast sent — ~3,500 citizens notified in affected area`,
    resource_allocation: `🔧 ${action.assigned_to} resources allocated and en route`,
    road_closure:        `🚧 Road closure barricades deployed at ${action.target_location}`,
    evacuation:          `🏃 Evacuation order issued — assembly point coordinates sent to teams`,
    infrastructure_repair: `🔨 Repair crew dispatched — infrastructure assessment initiated`,
    other:               `✅ Action executed: ${action.title}`,
  }
  return msgs[action.action_type] ?? `✅ ${action.title} executed`
}

function getUrduTitle(crisisType: string): string {
  const map: Record<string, string> = {
    flood:          'سیلاب کی ہنگامی صورتحال',
    fire:           'آگ کی ہنگامی صورتحال',
    heatwave:       'شدید گرمی کی لہر',
    accident:       'سڑک حادثہ',
    blockage:       'سڑک بند',
    infrastructure: 'بنیادی ڈھانچے کی ناکامی',
  }
  return map[crisisType] ?? 'ہنگامی صورتحال'
}
