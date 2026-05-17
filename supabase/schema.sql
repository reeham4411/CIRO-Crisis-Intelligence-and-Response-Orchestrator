-- ============================================================
-- CIRO — Crisis Intelligence & Response Orchestrator
-- Supabase PostgreSQL Schema
-- Run this entire script in: Supabase > SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SIGNALS — Raw incoming signals from all sources
-- ============================================================
CREATE TABLE IF NOT EXISTS signals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source        TEXT NOT NULL CHECK (source IN ('social_media','weather','traffic','sensor','nasa_firms','manual')),
  raw_text      TEXT,
  language      TEXT DEFAULT 'en' CHECK (language IN ('en','ur','roman_ur','mixed')),
  location_name TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  signal_type   TEXT CHECK (signal_type IN ('flood','heatwave','fire','accident','blockage','infrastructure','unknown')),
  severity      TEXT CHECK (severity IN ('low','medium','high','critical')),
  metadata      JSONB DEFAULT '{}',
  processed     BOOLEAN DEFAULT FALSE,
  crisis_id     UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CRISES — Detected and classified crisis events
-- ============================================================
CREATE TABLE IF NOT EXISTS crises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  crisis_type     TEXT NOT NULL CHECK (crisis_type IN ('flood','heatwave','fire','accident','road_blockage','infrastructure_failure','unknown')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','monitoring','resolved','false_alarm')),
  severity        TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  confidence      FLOAT DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  confidence_label TEXT DEFAULT 'Medium' CHECK (confidence_label IN ('Low','Medium','High','Very High')),
  location_name   TEXT NOT NULL,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  affected_area   TEXT,
  description     TEXT,
  signal_count    INTEGER DEFAULT 1,
  situation_analysis TEXT,
  impact_summary  TEXT,
  recommendations TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- ============================================================
-- 3. AGENT_TRACES — Step-by-step multi-agent reasoning logs
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_traces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id   UUID REFERENCES crises(id) ON DELETE CASCADE,
  signal_id   UUID REFERENCES signals(id) ON DELETE SET NULL,
  agent_name  TEXT NOT NULL CHECK (agent_name IN (
                'IngestionAgent','DetectionAgent','AnalysisAgent',
                'PlanningAgent','SimulationAgent','ReportingAgent'
              )),
  step_number INTEGER NOT NULL,
  action      TEXT NOT NULL,
  input       JSONB DEFAULT '{}',
  output      JSONB DEFAULT '{}',
  reasoning   TEXT,
  duration_ms INTEGER,
  status      TEXT DEFAULT 'success' CHECK (status IN ('success','error','warning')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. RESPONSE_ACTIONS — Planned coordinated response actions
-- ============================================================
CREATE TABLE IF NOT EXISTS response_actions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id     UUID REFERENCES crises(id) ON DELETE CASCADE,
  action_type   TEXT NOT NULL CHECK (action_type IN (
                  'traffic_reroute','emergency_dispatch','public_alert',
                  'resource_allocation','road_closure','evacuation','infrastructure_repair','other'
                )),
  title         TEXT NOT NULL,
  description   TEXT,
  priority      TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  assigned_to   TEXT,
  target_location TEXT,
  target_lat    DOUBLE PRECISION,
  target_lng    DOUBLE PRECISION,
  status        TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','cancelled')),
  simulated     BOOLEAN DEFAULT FALSE,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  executed_at   TIMESTAMPTZ
);

-- ============================================================
-- 5. SIMULATIONS — Simulation runs with before/after state
-- ============================================================
CREATE TABLE IF NOT EXISTS simulations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id       UUID REFERENCES crises(id) ON DELETE CASCADE,
  simulation_name TEXT NOT NULL,
  status          TEXT DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  before_state    JSONB DEFAULT '{}',
  after_state     JSONB DEFAULT '{}',
  impact_metrics  JSONB DEFAULT '{}',
  actions_executed INTEGER DEFAULT 0,
  summary         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ============================================================
-- 6. ALERTS — Notifications sent to users/services
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id     UUID REFERENCES crises(id) ON DELETE CASCADE,
  alert_type    TEXT NOT NULL CHECK (alert_type IN ('sms','push','email','broadcast','emergency_broadcast')),
  title         TEXT NOT NULL,
  title_ur      TEXT,
  message       TEXT NOT NULL,
  message_ur    TEXT,
  severity      TEXT CHECK (severity IN ('info','warning','danger','critical')),
  target_area   TEXT,
  recipients    INTEGER DEFAULT 0,
  delivered     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. RESOURCES — Emergency resource registry
-- ============================================================
CREATE TABLE IF NOT EXISTS resources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type   TEXT NOT NULL CHECK (resource_type IN (
                    'ambulance','fire_truck','police','rescue_team',
                    'flood_boat','helicopter','water_pump','generator','other'
                  )),
  name            TEXT NOT NULL,
  status          TEXT DEFAULT 'available' CHECK (status IN ('available','dispatched','maintenance','offline')),
  current_location TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  assigned_crisis UUID REFERENCES crises(id) ON DELETE SET NULL,
  contact         TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_signals_created_at    ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_crisis_id     ON signals(crisis_id);
CREATE INDEX IF NOT EXISTS idx_signals_processed     ON signals(processed);
CREATE INDEX IF NOT EXISTS idx_crises_status         ON crises(status);
CREATE INDEX IF NOT EXISTS idx_crises_crisis_type    ON crises(crisis_type);
CREATE INDEX IF NOT EXISTS idx_crises_created_at     ON crises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_traces_crisis   ON agent_traces(crisis_id);
CREATE INDEX IF NOT EXISTS idx_response_actions_crisis ON response_actions(crisis_id);
CREATE INDEX IF NOT EXISTS idx_simulations_crisis    ON simulations(crisis_id);
CREATE INDEX IF NOT EXISTS idx_alerts_crisis         ON alerts(crisis_id);
CREATE INDEX IF NOT EXISTS idx_resources_status      ON resources(status);

-- ============================================================
-- FOREIGN KEY: signals.crisis_id → crises.id
-- ============================================================
ALTER TABLE signals ADD CONSTRAINT fk_signals_crisis
  FOREIGN KEY (crisis_id) REFERENCES crises(id) ON DELETE SET NULL;

-- ============================================================
-- REALTIME — Enable realtime on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE crises;
ALTER PUBLICATION supabase_realtime ADD TABLE signals;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_traces;
ALTER PUBLICATION supabase_realtime ADD TABLE response_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE simulations;

-- ============================================================
-- ROW LEVEL SECURITY (basic open policy for prototype)
-- ============================================================
ALTER TABLE signals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE crises           ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_traces     ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources        ENABLE ROW LEVEL SECURITY;

-- Allow all operations via anon key (prototype mode)
CREATE POLICY "Allow all signals"          ON signals          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all crises"           ON crises           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all agent_traces"     ON agent_traces     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all response_actions" ON response_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all simulations"      ON simulations      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all alerts"           ON alerts           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all resources"        ON resources        FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA — Emergency Resources for Pakistan
-- ============================================================
INSERT INTO resources (resource_type, name, status, current_location, latitude, longitude, contact) VALUES
  ('ambulance',    'Rescue 1122 Unit A',         'available', 'Lahore Central',     31.5204, 74.3587, '+92-42-1122'),
  ('ambulance',    'Edhi Foundation Karachi',    'available', 'Karachi South',      24.8607, 67.0011, '+92-21-115'),
  ('fire_truck',   'Fire Brigade G-10',          'available', 'Islamabad G-10',     33.6844, 73.0479, '+92-51-16'),
  ('police',       'Islamabad Traffic Police',   'available', 'Islamabad Blue Area',33.7215, 73.0433, '+92-51-9261300'),
  ('rescue_team',  'NDMA Rapid Response Team',   'available', 'Islamabad F-7',      33.7217, 73.0428, '+92-51-9246138'),
  ('flood_boat',   'PWD Flood Boat Unit 1',      'available', 'Lahore Ravi Bridge', 31.5879, 74.3033, '+92-42-9921001'),
  ('helicopter',   'PAF SAR Helicopter Alpha',   'available', 'Chaklala Air Base',  33.6160, 73.0992, '+92-51-9271571'),
  ('water_pump',   'WASA Emergency Pump Team',   'available', 'Lahore WASA HQ',     31.5497, 74.3436, '+92-42-99211670'),
  ('fire_truck',   'KMC Fire Brigade Unit 3',    'available', 'Karachi North',      24.9056, 67.0822, '+92-21-32621516'),
  ('rescue_team',  'Civil Defence Peshawar',     'available', 'Peshawar Cantonment',34.0151, 71.5249, '+92-91-9210032');

-- ============================================================
-- SEED DATA — Demo crisis scenario (G-10 flood)
-- ============================================================
INSERT INTO crises (
  title, crisis_type, status, severity, confidence, confidence_label,
  location_name, latitude, longitude, affected_area,
  description, signal_count, situation_analysis, impact_summary, recommendations
) VALUES (
  'Urban Flooding — G-10 Islamabad',
  'flood', 'active', 'high', 0.91, 'Very High',
  'G-10, Islamabad', 33.6844, 73.0479, '~2.5 km radius',
  'Flash flooding reported in G-10 sector. Multiple vehicles stranded. Water level rising.',
  4,
  'Cross-referencing social media reports (Roman Urdu), OpenWeather heavy rainfall alert, and traffic congestion spike confirms active urban flood event. Consistent with G-10 low-lying topography.',
  'Traffic blocked on main arteries. ~200 vehicles stranded. Risk of property damage and casualties.',
  ARRAY[
    'Redirect traffic via Margalla Road and IJP Road',
    'Dispatch Rescue 1122 and WASA pump teams immediately',
    'Issue public alert via Emergency Broadcast',
    'Deploy flood boats for vehicle extraction',
    'Coordinate with NDMA for relief assessment'
  ]
);
