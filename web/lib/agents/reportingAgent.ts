import { supabase, type Crisis, type Simulation } from '../supabase'
import { askGroq } from '../groq'

const SYSTEM_PROMPT = `You are CIRO's Outcome Reporting Agent. Summarize the impact of a crisis response simulation for Pakistani emergency managers.
Be concise, data-driven, and actionable. Always respond with valid JSON.`

export async function runReportingAgent(crisis: Crisis, simulation: Simulation): Promise<string> {
  const start = Date.now()
  const metrics = simulation.impact_metrics as Record<string, unknown>

  const userPrompt = `Crisis: ${crisis.title} (${crisis.crisis_type}) at ${crisis.location_name}.
Severity: ${crisis.severity} | Confidence: ${crisis.confidence_label}

Simulation Results:
- Before: ${JSON.stringify(simulation.before_state)}
- After:  ${JSON.stringify(simulation.after_state)}
- Impact Metrics: ${JSON.stringify(metrics)}
- Actions Executed: ${simulation.actions_executed}

Return JSON:
{
  "outcome_summary": "2-3 sentence summary of the response effectiveness",
  "key_wins": ["list of 3 positive outcomes"],
  "remaining_risks": ["list of 2-3 remaining concerns"],
  "next_steps": ["2-3 recommended next steps for real response teams"],
  "overall_effectiveness": "low|medium|high|excellent"
}`

  let report = {
    outcome_summary: simulation.summary ?? 'Response simulation completed successfully.',
    key_wins: ['Emergency teams dispatched', 'Public alerted', 'Traffic rerouted'],
    remaining_risks: ['Monitor situation for escalation', 'Assess infrastructure damage'],
    next_steps: ['Continue monitoring with live sensors', 'Debrief response teams', 'File incident report with NDMA'],
    overall_effectiveness: 'high',
  }

  try {
    const raw = await askGroq(SYSTEM_PROMPT, userPrompt, true)
    const parsed = JSON.parse(raw)
    report = { ...report, ...parsed }
  } catch { /* use defaults */ }

  const fullSummary = `${report.outcome_summary} Overall effectiveness: ${report.overall_effectiveness}.`

  await supabase
    .from('crises')
    .update({ status: 'monitoring', updated_at: new Date().toISOString() })
    .eq('id', crisis.id)

  await supabase.from('agent_traces').insert({
    crisis_id:   crisis.id,
    agent_name:  'ReportingAgent',
    step_number: 6,
    action:      'generate_outcome_report',
    input:       { crisis_id: crisis.id, simulation_id: simulation.id },
    output:      report,
    reasoning:   fullSummary,
    duration_ms: Date.now() - start,
    status:      'success',
  })

  return fullSummary
}
