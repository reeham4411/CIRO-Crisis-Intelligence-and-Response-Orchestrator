import type { Signal, Crisis, Simulation } from './supabase'

export type OrchestrateResult = {
  signal?: Signal
  crisis?: Crisis
  isNew?: boolean
  actions?: unknown[]
  simulation?: Simulation
  report?: string
  message?: string
  error?: string
}
