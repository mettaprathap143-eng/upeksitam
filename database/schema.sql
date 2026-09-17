-- PostgreSQL / Supabase Schema for SIH26012

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS telemetry_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ps_number TEXT NOT NULL DEFAULT 'SIH26012',
    source_node TEXT NOT NULL,
    metric_value NUMERIC(10, 2) NOT NULL,
    location_label TEXT,
    risk_level TEXT DEFAULT 'LOW',
    status TEXT DEFAULT 'ACTIVE',
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES telemetry_records(id) ON DELETE CASCADE,
    model_name TEXT DEFAULT 'llama-3-70b-versatile',
    confidence_score NUMERIC(5, 3),
    inference_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE telemetry_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON telemetry_records FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON telemetry_records FOR INSERT WITH CHECK (true);
