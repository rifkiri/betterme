-- Add new habit category enum values
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'mental';
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'relationship';
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'social';
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'spiritual';
ALTER TYPE habit_category ADD VALUE IF NOT EXISTS 'wealth';