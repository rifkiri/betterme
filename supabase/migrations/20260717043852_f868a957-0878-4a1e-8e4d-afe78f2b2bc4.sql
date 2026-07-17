-- Task 2: Tender win/loss tracking on sales goals
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS tender_outcome text
    CHECK (tender_outcome IN ('won','lost','pending'))
    DEFAULT 'pending';

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS tender_outcome_note text;

-- Task 12: Archive fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.profiles(id);

-- Convenience index for filtering archived users
CREATE INDEX IF NOT EXISTS idx_profiles_is_archived ON public.profiles(is_archived);