# 🛡️ CIRO — Crisis Intelligence & Response Orchestrator

> **Agentic AI system for real-time urban crisis detection, analysis, and coordinated response across Pakistani metropolitan cities.**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CIRO System                             │
│                                                                 │
│  ┌─────────────┐    ┌──────────────────────────────────────┐   │
│  │  Next.js    │    │       6-Agent Agentic Pipeline       │   │
│  │  Web App    │───▶│                                      │   │
│  │  (Port 3000)│    │  1. IngestionAgent  (normalize)      │   │
│  └─────────────┘    │  2. DetectionAgent  (cluster)        │   │
│                     │  3. AnalysisAgent   (Groq LLM)       │   │
│  ┌─────────────┐    │  4. PlanningAgent   (Groq LLM)       │   │
│  │  Expo RN    │    │  5. SimulationAgent (execute)        │   │
│  │  Mobile App │    │  6. ReportingAgent  (Groq LLM)       │   │
│  └─────────────┘    └──────────────┬───────────────────────┘   │
│                                    │                            │
│  ┌─────────────┐    ┌──────────────▼───────────────────────┐   │
│  │  Simulated  │    │         Supabase (PostgreSQL)         │   │
│  │  APIs       │    │  signals · crises · agent_traces      │   │
│  │  Weather    │    │  response_actions · simulations       │   │
│  │  Traffic    │    │  alerts · resources                   │   │
│  │  NASA FIRMS │    └──────────────────────────────────────┘   │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
Challenge 3/
├── web/                        # Next.js 16 Web App
│   ├── app/
│   │   ├── page.tsx            # Main dashboard
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Design system
│   │   ├── components/
│   │   │   ├── StatsBar.tsx
│   │   │   ├── SignalInput.tsx  # Multi-language signal console
│   │   │   ├── CrisisList.tsx  # Crisis event browser
│   │   │   ├── CrisisMap.tsx   # Leaflet live map
│   │   │   ├── AgentPipeline.tsx # 6-step visual pipeline
│   │   │   ├── SimulationPanel.tsx # Before/after viewer
│   │   │   ├── AlertsPanel.tsx # Bilingual alerts
│   │   │   └── ResourcesPanel.tsx
│   │   └── api/
│   │       ├── orchestrate/route.ts  # Main pipeline endpoint
│   │       ├── dashboard/route.ts    # Data fetch endpoint
│   │       └── simulate/route.ts     # Simulated APIs
│   └── lib/
│       ├── groq.ts             # Groq SDK client
│       ├── supabase.ts         # Supabase client + types
│       └── agents/
│           ├── ingestionAgent.ts   # Step 1: Normalize signals
│           ├── detectionAgent.ts   # Step 2: Cluster/raise crisis
│           ├── analysisAgent.ts    # Step 3: Groq LLM analysis
│           ├── planningAgent.ts    # Step 4: Generate actions
│           ├── simulationAgent.ts  # Step 5: Simulate execution
│           └── reportingAgent.ts   # Step 6: Outcome report
├── mobile/                     # Expo React Native App
│   ├── App.tsx                 # Full 4-tab mobile app
│   ├── app.json                # Expo config
│   └── package.json
└── supabase/
    └── schema.sql              # Full Supabase schema (run this first!)
```

---

## 🗄️ Database Schema (Supabase)

Run **`supabase/schema.sql`** in Supabase → SQL Editor → New Query.

### Tables

```sql
-- 1. SIGNALS — Raw incoming signals
CREATE TABLE signals (
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
  crisis_id     UUID,                     -- FK → crises.id
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRISES — Detected and classified crisis events
CREATE TABLE crises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  crisis_type     TEXT NOT NULL CHECK (crisis_type IN ('flood','heatwave','fire','accident','road_blockage','infrastructure_failure','unknown')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','monitoring','resolved','false_alarm')),
  severity        TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  confidence      FLOAT DEFAULT 0.0,
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

-- 3. AGENT_TRACES — Step-by-step reasoning logs
CREATE TABLE agent_traces (
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

-- 4. RESPONSE_ACTIONS — Coordinated response actions
CREATE TABLE response_actions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id     UUID REFERENCES crises(id) ON DELETE CASCADE,
  action_type   TEXT NOT NULL CHECK (action_type IN (
                  'traffic_reroute','emergency_dispatch','public_alert',
                  'resource_allocation','road_closure','evacuation',
                  'infrastructure_repair','other'
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

-- 5. SIMULATIONS — Before/after state
CREATE TABLE simulations (
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

-- 6. ALERTS — Bilingual public notifications
CREATE TABLE alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_id     UUID REFERENCES crises(id) ON DELETE CASCADE,
  alert_type    TEXT NOT NULL CHECK (alert_type IN ('sms','push','email','broadcast','emergency_broadcast')),
  title         TEXT NOT NULL,
  title_ur      TEXT,          -- Urdu translation
  message       TEXT NOT NULL,
  message_ur    TEXT,          -- Urdu translation
  severity      TEXT CHECK (severity IN ('info','warning','danger','critical')),
  target_area   TEXT,
  recipients    INTEGER DEFAULT 0,
  delivered     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RESOURCES — Emergency resource registry
CREATE TABLE resources (
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
```

---

## ⚙️ Environment Setup

### Web App (`web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GROQ_API_KEY=gsk_your_groq_key
```

### Mobile App

Edit `mobile/app.json` → `extra` section with your Supabase URL, anon key, and web app URL.

---

## 🚀 Running the Project

### 1. Set up Supabase
```bash
# Go to https://supabase.com → New Project
# SQL Editor → New Query → paste supabase/schema.sql → Run
```

### 2. Run Web App
```bash
cd web
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
# → http://localhost:3000
```

### 3. Run Mobile App
```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go app
# Make sure web app is running at localhost:3000
```

---

## 🤖 Agentic Pipeline — 6 Agents

| Step | Agent | Tool | Description |
|------|-------|------|-------------|
| 1 | **IngestionAgent** | Rule-based | Normalize signal — detect language (EN/UR/Roman Urdu), signal type, severity, location |
| 2 | **DetectionAgent** | Haversine clustering | Cluster nearby signals, raise new crisis or increment existing one |
| 3 | **AnalysisAgent** | **Groq LLaMA-70B** | Deep situation analysis — confidence score, severity, impact assessment |
| 4 | **PlanningAgent** | **Groq LLaMA-70B** | Generate 4-6 coordinated response actions using Pakistan-specific resources |
| 5 | **SimulationAgent** | Deterministic sim | Simulate all actions, calculate before/after metrics, generate alerts |
| 6 | **ReportingAgent** | **Groq LLaMA-70B** | Outcome report — key wins, remaining risks, next steps |

---

## 🛠️ APIs & Tools Used

| Tool/API | Usage | Type |
|----------|-------|------|
| **Groq API** (LLaMA-3.3-70B) | Situation analysis, action planning, reporting | Real API |
| **Supabase** | PostgreSQL database, real-time subscriptions, RLS | Real API |
| **OpenWeather** (simulated) | Weather alerts, rainfall, temperature | Simulated |
| **Google Maps Traffic** (simulated) | Congestion data, alternate routes | Simulated |
| **NASA FIRMS** (simulated) | Fire hotspot detection | Simulated |
| **Leaflet / OpenStreetMap** | Interactive crisis map | Real (open source) |

---

## 📱 Mobile App Features

- **4 Tabs**: Home, Crises, Pipeline, Alerts
- Signal input with quick scenario buttons
- Real-time crisis list with expandable details
- 6-step visual agent pipeline viewer
- Bilingual alerts (English + اردو)
- Auto-refreshes every 15 seconds
- Dark UI with Pakistan color palette

---

## 🌐 Web App Features

- **Sidebar navigation** with 6 views
- Signal Ingestion Console (EN/UR/Roman Urdu)
- Crisis detection list with confidence bars
- Live Leaflet map with crisis markers
- Agent Pipeline with visual stepper + trace logs
- Simulation Panel: before/after state comparison
- Bilingual alerts panel
- Emergency resources grid

---

## 🌍 Pakistan Accessibility

- **Roman Urdu** signal input supported (e.g., "G-10 mein pani bhar gaya")
- **Urdu script** in alerts (right-to-left)
- Pre-loaded crisis scenarios for Pakistani cities (Islamabad, Lahore, Karachi, Peshawar)
- Pakistan-specific emergency services: Rescue 1122, NDMA, WASA, Edhi Foundation, Traffic Police
- City locations pre-mapped: G-10, George Town, F-7, I-8, DHA, Saddar, Gulshan, Hayatabad

---

## 📋 Example Workflow

**Input:**
```
"G-10 mein pani bhar gaya hai, gaariyan phans gayi hain"
Source: social_media
```

**Pipeline Output:**
```
IngestionAgent  → language: roman_ur, type: flood, severity: high, location: G-10
DetectionAgent  → New crisis: "Urban Flooding — G-10" raised
AnalysisAgent   → Groq: confidence 0.91 (Very High), severity: high
PlanningAgent   → Groq: 5 actions generated (traffic_reroute, emergency_dispatch, public_alert...)
SimulationAgent → Before: 85% congestion | After: 30% congestion | 150 vehicles rescued
ReportingAgent  → Groq: outcome summary, key wins, remaining risks
```

---

## 🔧 Assumptions

1. Simulated APIs (weather, traffic, NASA FIRMS) return Pakistan-relevant data
2. The system uses a single-agent-per-step sequential pipeline (not fully parallel to maintain trace order)
3. Location detection is keyword-based for speed; production would use geocoding APIs
4. All data is stored in Supabase with open RLS policies (prototype mode — tighten for production)
5. Mobile app communicates with the web app's Next.js API (not directly to Supabase) to reuse agent logic
6. Crisis clustering uses a 5km haversine radius within a 30-minute time window

---

*Built for Google Antigravity Challenge — CIRO demonstrates multi-agent orchestration for real-time urban crisis management in Pakistan.*
