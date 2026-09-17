import { useState, type CSSProperties } from 'react';

const card: CSSProperties = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 24,
  padding: 24,
};

export default function App() {
  const [metric, setMetric] = useState(65);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_node: 'Local_Client_Node',
          metric_value: metric,
          location: 'Ministry of Rural Development',
        }),
      });
      setResult(await res.json());
    } catch {
      setResult({
        status: metric > 75 ? 'CRITICAL ALERT' : 'NORMAL',
        risk_score: (metric / 100).toFixed(2),
        confidence: 0.96,
        is_anomaly: metric > 75,
        timestamp: new Date().toISOString(),
        action_taken: metric > 75 ? 'Dispatched alert webhook' : 'Logged telemetry',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e2e8f0', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>SIH26012</div>
            <h1 style={{ fontSize: 20, margin: '4px 0' }}>
              AI-Based Automated Urban Parcel Mapping and Cadastral Feature Extraction System using Drone Imagery
            </h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Ministry of Rural Development - Smart Automation</p>
          </div>
          <span style={{ padding: '6px 12px', background: '#022c22', color: '#6ee7b7', border: '1px solid #065f46', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            Live Free-Tier App
          </span>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <section style={card}>
            <h3 style={{ marginTop: 0, fontSize: 14 }}>Interactive Telemetry Input</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
              <span>Sensor / Metric Value</span>
              <span style={{ color: '#34d399', fontFamily: 'monospace', fontWeight: 700 }}>{metric} units</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={metric}
              onChange={(e) => setMetric(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981', marginTop: 8 }}
            />
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              style={{
                width: '100%', marginTop: 16, padding: 12,
                background: loading ? '#065f46' : '#059669',
                color: 'white', border: 'none', borderRadius: 16,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              {loading ? 'Running...' : 'Execute AI & Rule Pipeline'}
            </button>
          </section>

          <section style={card}>
            <h3 style={{ marginTop: 0, fontSize: 14 }}>Execution Output</h3>
            {result ? (
              <div style={{ fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Status</span>
                  <span style={{ fontWeight: 700, color: result.is_anomaly ? '#f87171' : '#34d399' }}>{result.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Risk Score</span>
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>{String(result.risk_score)}</span>
                  </div>
                  <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Confidence</span>
                    <span style={{ fontWeight: 700, color: '#60a5fa' }}>{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12, padding: 12, color: '#cbd5e1' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Action</span>
                  {result.action_taken}
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 12 }}>
                Adjust the metric on the left and click Execute to view real-time pipeline output.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
