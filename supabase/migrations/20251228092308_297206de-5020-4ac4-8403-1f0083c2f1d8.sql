-- Add column to track external sync time per goal
ALTER TABLE goals ADD COLUMN last_external_sync_at timestamptz;

-- Add index for faster lookups of OKR goals
CREATE INDEX IF NOT EXISTS idx_goals_subcategory ON goals(subcategory) WHERE subcategory = 'okr';