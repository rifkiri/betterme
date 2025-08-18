-- Create item_linkages table for universal linking between any items
CREATE TABLE public.item_linkages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('goal', 'task', 'weekly_output', 'habit')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('goal', 'task', 'weekly_output', 'habit')),
  target_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id)
);

-- Enable RLS
ALTER TABLE public.item_linkages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_linkages
CREATE POLICY "Users can manage their own linkages"
ON public.item_linkages
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all linkages"
ON public.item_linkages
FOR SELECT
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]));

-- Create indexes for performance
CREATE INDEX idx_item_linkages_source ON public.item_linkages(source_type, source_id);
CREATE INDEX idx_item_linkages_target ON public.item_linkages(target_type, target_id);
CREATE INDEX idx_item_linkages_user_id ON public.item_linkages(user_id);

-- Migrate existing goal->output links from goals table
INSERT INTO public.item_linkages (user_id, source_type, source_id, target_type, target_id)
SELECT 
  g.user_id,
  'goal',
  g.id::text,
  'weekly_output',
  unnest(g.linked_output_ids)
FROM public.goals g
WHERE g.linked_output_ids IS NOT NULL AND array_length(g.linked_output_ids, 1) > 0;

-- Migrate existing output->goal links from weekly_outputs table
INSERT INTO public.item_linkages (user_id, source_type, source_id, target_type, target_id)
SELECT 
  wo.user_id,
  'weekly_output',
  wo.id::text,
  'goal',
  unnest(wo.linked_goal_ids)
FROM public.weekly_outputs wo
WHERE wo.linked_goal_ids IS NOT NULL AND array_length(wo.linked_goal_ids, 1) > 0
ON CONFLICT (source_type, source_id, target_type, target_id) DO NOTHING;

-- Remove the array columns that cause RLS conflicts
ALTER TABLE public.goals DROP COLUMN IF EXISTS linked_output_ids;
ALTER TABLE public.weekly_outputs DROP COLUMN IF EXISTS linked_goal_ids;

-- Create trigger for updating updated_at
CREATE TRIGGER update_item_linkages_updated_at
BEFORE UPDATE ON public.item_linkages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get linkages for an item
CREATE OR REPLACE FUNCTION public.get_item_linkages(
  p_item_type TEXT,
  p_item_id TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  target_type TEXT,
  target_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    il.target_type,
    il.target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.source_type = p_item_type 
    AND il.source_id = p_item_id
    AND il.user_id = p_user_id
  
  UNION
  
  SELECT 
    il.source_type as target_type,
    il.source_id as target_id,
    il.created_at
  FROM item_linkages il
  WHERE il.target_type = p_item_type 
    AND il.target_id = p_item_id
    AND il.user_id = p_user_id;
END;
$$;