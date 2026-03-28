ALTER TABLE public.devices 
  ADD COLUMN IF NOT EXISTS threat_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS threat_reason text;