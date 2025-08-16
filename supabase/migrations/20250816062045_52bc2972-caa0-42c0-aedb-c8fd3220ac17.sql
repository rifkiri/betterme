-- Drop the constraint completely first
ALTER TABLE goals DROP CONSTRAINT goals_category_check;

-- Now update the data
UPDATE goals SET category = 'personal';

-- Add new columns
ALTER TABLE goals 
  ADD COLUMN IF NOT EXISTS coach_id uuid,
  ADD COLUMN IF NOT EXISTS lead_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS assignment_date timestamp with time zone;

-- Create new tables
CREATE TABLE IF NOT EXISTS goal_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
  assigned_by uuid NOT NULL,
  assigned_date timestamp with time zone NOT NULL DEFAULT now(),
  acknowledged boolean NOT NULL DEFAULT false,
  self_assigned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE goal_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS goal_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('assignment', 'self_assignment')),
  role text NOT NULL CHECK (role IN ('coach', 'lead', 'member')),
  acknowledged boolean NOT NULL DEFAULT false,
  created_date timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE goal_notifications ENABLE ROW LEVEL SECURITY;

-- Finally add the constraint back
ALTER TABLE goals 
  ADD CONSTRAINT goals_category_check CHECK (category IN ('work', 'personal'));