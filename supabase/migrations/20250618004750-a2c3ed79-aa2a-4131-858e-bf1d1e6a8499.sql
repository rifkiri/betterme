
-- Add project_id column to weekly_outputs table to link outputs to projects
ALTER TABLE public.weekly_outputs ADD COLUMN project_id UUID REFERENCES public.projects(id);

-- Create index for better query performance
CREATE INDEX idx_weekly_outputs_project_id ON public.weekly_outputs(project_id);
