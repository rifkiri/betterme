-- First, let's check what values we have
SELECT DISTINCT category FROM goals;

-- Update ALL rows to use 'personal' for now (we can change specific ones later)
UPDATE goals SET category = 'personal';

-- Drop the existing constraint if it exists
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_category_check;

-- Now add the new columns
ALTER TABLE goals 
  ADD COLUMN IF NOT EXISTS coach_id uuid,
  ADD COLUMN IF NOT EXISTS lead_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS assignment_date timestamp with time zone;

-- Now add the new constraint
ALTER TABLE goals 
  ADD CONSTRAINT goals_category_check CHECK (category IN ('work', 'personal'));