CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cooperatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  contact_phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'cooperative' CHECK (role IN ('cooperative', 'admin')),
  green_score INTEGER DEFAULT 0,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'cooperative';
ALTER TABLE cooperatives DROP CONSTRAINT IF EXISTS cooperatives_role_check;
ALTER TABLE cooperatives ADD CONSTRAINT cooperatives_role_check CHECK (role IN ('cooperative', 'admin'));

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  spoilage_rate_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID REFERENCES cooperatives(id),
  product_id UUID REFERENCES products(id),
  quantity_kg FLOAT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  risk_score FLOAT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
  disposal_status TEXT DEFAULT 'active' CHECK (disposal_status IN ('active', 'disposed')),
  disposed_at TIMESTAMPTZ,
  disposed_quantity_kg FLOAT DEFAULT 0,
  disposal_penalty_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS disposal_status TEXT DEFAULT 'active';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS disposed_at TIMESTAMPTZ;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS disposed_quantity_kg FLOAT DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS disposal_penalty_points INTEGER DEFAULT 0;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_disposal_status_check;
ALTER TABLE inventory ADD CONSTRAINT inventory_disposal_status_check CHECK (disposal_status IN ('active', 'disposed'));

CREATE TABLE IF NOT EXISTS swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_cooperative_id UUID REFERENCES cooperatives(id),
  to_cooperative_id UUID REFERENCES cooperatives(id),
  product_id UUID REFERENCES products(id),
  quantity_kg FLOAT NOT NULL,
  match_score FLOAT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  carbon_saved_kg FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  context JSONB DEFAULT '[]',
  last_intent TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carbon_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID REFERENCES cooperatives(id),
  event_type TEXT NOT NULL,
  kg_saved FLOAT NOT NULL,
  points_earned INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE carbon_log ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT,
  user_message TEXT NOT NULL,
  detected_intent TEXT NOT NULL,
  selected_tool TEXT NOT NULL,
  model_name TEXT NOT NULL,
  used_gemini BOOLEAN DEFAULT FALSE,
  fallback_used BOOLEAN DEFAULT FALSE,
  prompt TEXT,
  gemini_response TEXT,
  final_response TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_cooperative_id ON inventory(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_risk_score ON inventory(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_disposal_status ON inventory(disposal_status);
CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status);
CREATE INDEX IF NOT EXISTS idx_swaps_from_product_status ON swaps(from_cooperative_id, product_id, status);
CREATE INDEX IF NOT EXISTS idx_carbon_log_cooperative_id ON carbon_log(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_intent ON ai_logs(detected_intent);
CREATE INDEX IF NOT EXISTS idx_sessions_channel_id ON sessions(channel_id);
CREATE INDEX IF NOT EXISTS idx_cooperatives_role ON cooperatives(role);
