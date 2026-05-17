import { NextRequest, NextResponse } from 'next/server'

const PAKISTAN_WEATHER_SCENARIOS = [
  { condition: 'Heavy Rainfall', temp: 28, humidity: 95, wind_speed: 45, rain_mm: 52, alert: 'Flash Flood Warning', severity: 'critical' },
  { condition: 'Thunderstorm', temp: 31, humidity: 88, wind_speed: 60, rain_mm: 30, alert: 'Thunderstorm Warning', severity: 'high' },
  { condition: 'Extreme Heat', temp: 47, humidity: 20, wind_speed: 15, rain_mm: 0, alert: 'Heatwave Alert', severity: 'high' },
  { condition: 'Dust Storm', temp: 39, humidity: 15, wind_speed: 85, rain_mm: 0, alert: 'Dust Storm Advisory', severity: 'medium' },
  { condition: 'Partly Cloudy', temp: 34, humidity: 60, wind_speed: 20, rain_mm: 0, alert: null, severity: 'low' },
]

const TRAFFIC_SCENARIOS = [
  { congestion_pct: 92, affected_roads: ['Margalla Road', 'G-10 Main Blvd'], vehicles_affected: 800, avg_speed_kmh: 5, incident_type: 'flood_related' },
  { congestion_pct: 78, affected_roads: ['IJP Road', 'Faizabad Interchange'], vehicles_affected: 450, avg_speed_kmh: 12, incident_type: 'accident' },
  { congestion_pct: 65, affected_roads: ['Mall Road Lahore'], vehicles_affected: 300, avg_speed_kmh: 18, incident_type: 'road_blockage' },
  { congestion_pct: 45, affected_roads: ['Shahrah-e-Faisal'], vehicles_affected: 200, avg_speed_kmh: 25, incident_type: 'normal_peak' },
  { congestion_pct: 20, affected_roads: [], vehicles_affected: 50, avg_speed_kmh: 60, incident_type: 'normal' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'weather'
  const scenario = searchParams.get('scenario') // 'flood','heat','storm','dust','normal'

  if (type === 'weather') {
    let data = PAKISTAN_WEATHER_SCENARIOS[Math.floor(Math.random() * PAKISTAN_WEATHER_SCENARIOS.length)]
    if (scenario === 'flood')  data = PAKISTAN_WEATHER_SCENARIOS[0]
    if (scenario === 'heat')   data = PAKISTAN_WEATHER_SCENARIOS[2]
    if (scenario === 'storm')  data = PAKISTAN_WEATHER_SCENARIOS[1]
    if (scenario === 'normal') data = PAKISTAN_WEATHER_SCENARIOS[4]

    return NextResponse.json({
      source:    'OpenWeather (simulated)',
      location:  'Islamabad, Pakistan',
      timestamp: new Date().toISOString(),
      ...data,
      pressure_hpa: 1008,
      visibility_km: data.rain_mm > 20 ? 2 : 8,
      uv_index: data.temp > 40 ? 11 : 5,
    })
  }

  if (type === 'traffic') {
    let data = TRAFFIC_SCENARIOS[Math.floor(Math.random() * TRAFFIC_SCENARIOS.length)]
    if (scenario === 'flood')  data = TRAFFIC_SCENARIOS[0]
    if (scenario === 'normal') data = TRAFFIC_SCENARIOS[4]

    return NextResponse.json({
      source:    'Google Maps Traffic (simulated)',
      timestamp: new Date().toISOString(),
      ...data,
      emergency_routes_active: data.congestion_pct > 70,
      alternate_routes: ['Islamabad Expressway', 'Lehtrar Road', 'Murree Road'],
    })
  }

  if (type === 'nasa_firms') {
    return NextResponse.json({
      source:    'NASA FIRMS (simulated)',
      timestamp: new Date().toISOString(),
      fire_points: scenario === 'fire' ? [
        { lat: 33.6844, lng: 73.0479, confidence: 85, frp: 45.2 },
        { lat: 33.6900, lng: 73.0520, confidence: 72, frp: 31.8 },
      ] : [],
      total_active_fires: scenario === 'fire' ? 2 : 0,
      scan_time: new Date().toISOString(),
    })
  }

  return NextResponse.json({ error: 'Invalid type. Use weather|traffic|nasa_firms' }, { status: 400 })
}
