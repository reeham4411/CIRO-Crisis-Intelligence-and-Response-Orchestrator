import { NextRequest, NextResponse } from 'next/server'
import { runIngestionAgent } from '@/lib/agents/ingestionAgent'
import { runDetectionAgent } from '@/lib/agents/detectionAgent'
import { runAnalysisAgent } from '@/lib/agents/analysisAgent'
import { runPlanningAgent } from '@/lib/agents/planningAgent'
import { runSimulationAgent } from '@/lib/agents/simulationAgent'
import { runReportingAgent } from '@/lib/agents/reportingAgent'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { raw_text, source = 'manual', metadata = {} } = body

    if (!raw_text || typeof raw_text !== 'string') {
      return NextResponse.json({ error: 'raw_text is required' }, { status: 400 })
    }

    // ── AGENT PIPELINE ──────────────────────────────────────────
    // Step 1: Ingest & normalize the signal
    const signal = await runIngestionAgent({ raw_text, source, metadata })

    // Step 2: Detect / cluster crisis
    const { crisis, isNew } = await runDetectionAgent(signal)
    if (!crisis) {
      return NextResponse.json({ signal, crisis: null, isNew: false, message: 'Signal ingested but no crisis raised.' })
    }

    // Step 3: Deep situation analysis (only for new crises or first signal)
    const analysis = await runAnalysisAgent(crisis, signal)

    // Step 4: Generate response actions
    const actions = await runPlanningAgent(crisis)

    // Step 5: Simulate execution
    const simulation = await runSimulationAgent(crisis, actions)

    // Step 6: Build report
    const report = await runReportingAgent(crisis, simulation)

    return NextResponse.json({
      signal,
      crisis,
      isNew,
      analysis,
      actions,
      simulation,
      report,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[orchestrate]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
