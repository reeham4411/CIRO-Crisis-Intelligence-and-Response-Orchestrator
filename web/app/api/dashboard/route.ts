import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const [crises, signals, simulations, alerts, resources, traces] = await Promise.all([
      supabase.from('crises').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('signals').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('simulations').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('resources').select('*').order('created_at', { ascending: false }),
      supabase.from('agent_traces').select('*').order('created_at', { ascending: false }).limit(100),
    ])

    return NextResponse.json({
      crises:      crises.data ?? [],
      signals:     signals.data ?? [],
      simulations: simulations.data ?? [],
      alerts:      alerts.data ?? [],
      resources:   resources.data ?? [],
      traces:      traces.data ?? [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
