import { useEffect, useState, type CSSProperties } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const LU_COLORS: Record<string, string> = {
  residential: '#34d399', commercial: '#fbbf24', industrial: '#f97316',
  institutional: '#60a5fa', vacant: '#94a3b8', mixed_use: '#a78bfa',
}

const SCENARIOS = [
  { name: 'Dense Urban Ward (Delhi)', lat: 28.6139, lon: 77.209 },
  { name: 'Old City Core (Varanasi)', lat: 25.3176, lon: 82.9739 },
  { name: 'Peripheral Growth (Bengaluru)', lat: 12.9716, lon: 77.5946 },
]

const STAGES = [
  'Ingesting orthorectified tile...',
  'Segmenting parcel boundaries...',
  'Detecting building footprints...',
  'Extracting road network...',
  'Validating topology...',
]

const card: CSSProperties = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 14 }

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.flyTo(center, 17, { duration: 1.2 }) }, [center, map])
  return null
}

export default function App() {
  const [scenario, setScenario] = useState(0)
  const [seed, setSeed] = useState(42)
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState(0)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setStage(s => (s + 1) % STAGES.length), 450)
    return () => clearInterval(t)
  }, [running])

  const runExtraction = async () => {
    setRunning(true)
    setError('')
    setStage(0)
    const sc = SCENARIOS[scenario]
    try {
      const [res] = await Promise.all([
        fetch(`${API}/api/v1/extraction/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ center_lat: sc.lat, center_lon: sc.lon, seed }),
        }).then(r => r.json()),
        new Promise(r => setTimeout(r, 2000)),
      ])
      if (res.detail) { setError(String(res.detail)) } else { setData(res) }
    } catch {
      setError('Backend unreachable - is the server running? Wait 40 seconds and retry.')
    } finally {
      setRunning(false)
    }
  }

  const downloadGeoJSON = () => {
    if (!data) return
    const fc = {
      type: 'FeatureCollection',
      features: [...data.parcels.features, ...data.buildings.features, ...data.roads.features],
    }
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cadastral_run_${data.seed}.geojson`
    a.click()
  }

  const parcelStyle = (f: any) => {
    const p = f.properties
    if (p.status === 'flagged') {
      return { color: '#ef4444', weight: 2.5, dashArray: '5', fillColor: '#ef4444', fillOpacity: 0.4 }
    }
    const c = LU_COLORS[p.land_use] || '#34d399'
    return { color: c, weight: 1.5, fillColor: c, fillOpacity: 0.3 }
  }

  const onEachParcel = (f: any, layer: any) => {
    const p = f.properties
    layer.bindPopup(
      `<b>${p.parcel_id}</b><br/>Land use: ${p.land_use}<br/>Area: ${p.area_sqm} m2<br/>Confidence: ${(p.confidence * 100).toFixed(1)}%<br/>Status: <b>${p.status}</b>`
    )
  }

  const onEachBuilding = (f: any, layer: any) => {
    const p = f.properties
    layer.bindPopup(
      `<b>${p.building_id}</b><br/>Parcel: ${p.parcel_id}<br/>Footprint: ${p.footprint_sqm} m2<br/>Confidence: ${(p.confidence * 100).toFixed(1)}%`
    )
  }

  const sc = SCENARIOS[scenario]
  const s = data?.stats

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e2e8f0', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>SIH26012</div>
          <h1 style={{ fontSize: 18, margin: '2px 0' }}>
            AI Urban Parcel Mapping &amp; Cadastral Feature Extraction (Drone Imagery)
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Ministry of Rural Development - Web-GIS Platform</p>
        </div>
        <span style={{ padding: '6px 12px', background: '#022c22', color: '#6ee7b7', border: '1px solid #065f46', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
          GeoAI Engine v2
        </span>
      </header>

      <div style={{ display: 'flex', gap: 16, height: '80vh' }}>
        <aside style={{ width: 350, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <section style={card}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>Extraction Pipeline</h3>
            <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Study Area</label>
            <select
              value={scenario}
              onChange={e => setScenario(Number(e.target.value))}
              style={{ width: '100%', padding: 8, borderRadius: 8, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', marginBottom: 10 }}
            >
              {SCENARIOS.map((x, i) => (
                <option key={i} value={i}>{x.name}</option>
              ))}
            </select>
            <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Drone Tile Seed</label>
            <input
              type="number"
              min={1}
              max={99999}
              value={seed}
              onChange={e => setSeed(Number(e.target.value))}
              style={{ width: '100%', padding: 8, borderRadius: 8, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', marginBottom: 10, boxSizing: 'border-box' }}
            />
            <button
              onClick={runExtraction}
              disabled={running}
              style={{ width: '100%', padding: 12, background: running ? '#065f46' : '#059669', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              {running ? STAGES[stage] : 'Run AI Extraction Pipeline'}
            </button>
            {error && <p style={{ color: '#f87171', fontSize: 11, marginTop: 8 }}>{error}</p>}
          </section>

          {s && (
            <section style={card}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>Extraction Report</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                {[
                  ['Parcels', s.parcels_extracted, '#34d399'],
                  ['Buildings', s.buildings_detected, '#60a5fa'],
                  ['Roads (km)', s.roads_km, '#fbbf24'],
                  ['Area (m2)', Math.round(s.total_area_sqm).toLocaleString(), '#a78bfa'],
                  ['Flagged', s.flagged_parcels, '#f87171'],
                  ['Confidence', (s.avg_confidence * 100).toFixed(1) + '%', '#34d399'],
                ].map(([k, v, c]) => (
                  <div key={k as string} style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 10, padding: 8 }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>{k}</span>
                    <b style={{ color: c as string }}>{v}</b>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: '#64748b', margin: '8px 0 0' }}>
                Pipeline time: {s.processing_ms} ms | DB save: {data.db_saved ? 'yes' : 'in-memory'}
              </p>
            </section>
          )}

          {data && data.issues.length > 0 && (
            <section style={card}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>Topology Validation ({data.issues.length} issues)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
                {data.issues.map((iss: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      background: '#020617',
                      border: '1px solid #1e293b',
                      borderLeft: `3px solid ${iss.severity === 'critical' ? '#ef4444' : iss.severity === 'high' ? '#f97316' : '#fbbf24'}`,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <b style={{ color: iss.severity === 'critical' ? '#f87171' : iss.severity === 'high' ? '#fb923c' : '#fbbf24' }}>
                      {iss.issue_type.toUpperCase()}
                    </b>
                    <span style={{ color: '#64748b' }}> — {iss.parcel_ids.join(' / ')}</span>
                    <div style={{ color: '#94a3b8', marginTop: 2 }}>{iss.detail}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data && (
            <section style={card}>
              <button
                onClick={downloadGeoJSON}
                style={{ width: '100%', padding: 10, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Export GIS-Ready GeoJSON
              </button>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, fontSize: 10 }}>
                {Object.entries(LU_COLORS).map(([k, c]) => (
                  <span key={k} style={{ color: '#94a3b8' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: c, marginRight: 4 }} />
                    {k.replace('_', ' ')}
                  </span>
                ))}
                <span style={{ color: '#ef4444' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, border: '2px dashed #ef4444', borderRadius: 4, marginRight: 4 }} />
                  flagged
                </span>
              </div>
            </section>
          )}
        </aside>

        <main style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid #1e293b' }}>
          <MapContainer center={[sc.lat, sc.lon]} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution="Imagery © Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <FlyTo center={[sc.lat, sc.lon]} />
            {data && (
              <>
                <GeoJSON key={`r${data.run_id}`} data={data.roads} style={{ color: '#fef08a', weight: 4, opacity: 0.9 }} />
                <GeoJSON key={`p${data.run_id}`} data={data.parcels} style={parcelStyle} onEachFeature={onEachParcel} />
                <GeoJSON key={`b${data.run_id}`} data={data.buildings} style={{ color: '#e2e8f0', weight: 1, fillColor: '#cbd5e1', fillOpacity: 0.75 }} onEachFeature={onEachBuilding} />
              </>
            )}
          </MapContainer>
        </main>
      </div>
    </div>
  )
}
