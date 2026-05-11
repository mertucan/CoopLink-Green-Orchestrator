ALTER TABLE inventory ADD COLUMN IF NOT EXISTS disposal_status TEXT DEFAULT 'active';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS disposed_at TIMESTAMPTZ;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS disposed_quantity_kg FLOAT DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS disposal_penalty_points INTEGER DEFAULT 0;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_disposal_status_check;
ALTER TABLE inventory ADD CONSTRAINT inventory_disposal_status_check CHECK (disposal_status IN ('active', 'disposed'));

ALTER TABLE carbon_log ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_inventory_disposal_status ON inventory(disposal_status);
