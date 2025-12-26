-- Create integration connections table for storing API configurations
CREATE TABLE public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  integration_type TEXT NOT NULL DEFAULT 'zatzet_okr',
  api_endpoint TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_settings JSONB DEFAULT '{"autoSync": false, "direction": "import", "mappings": []}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_type)
);

-- Create sync logs table to track imported items
CREATE TABLE public.integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  internal_id UUID,
  sync_status TEXT DEFAULT 'pending',
  sync_direction TEXT DEFAULT 'import',
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_connections (admin and manager only)
CREATE POLICY "Admins and managers can view integrations"
ON public.integration_connections
FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert integrations"
ON public.integration_connections
FOR INSERT
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager') AND auth.uid() = user_id);

CREATE POLICY "Admins and managers can update their integrations"
ON public.integration_connections
FOR UPDATE
USING (get_user_role(auth.uid()) IN ('admin', 'manager') AND auth.uid() = user_id);

CREATE POLICY "Admins and managers can delete their integrations"
ON public.integration_connections
FOR DELETE
USING (get_user_role(auth.uid()) IN ('admin', 'manager') AND auth.uid() = user_id);

-- RLS policies for integration_sync_logs
CREATE POLICY "Admins and managers can view sync logs"
ON public.integration_sync_logs
FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can insert sync logs"
ON public.integration_sync_logs
FOR INSERT
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update sync logs"
ON public.integration_sync_logs
FOR UPDATE
USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create updated_at trigger for integration_connections
CREATE TRIGGER update_integration_connections_updated_at
BEFORE UPDATE ON public.integration_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();