-- Add columns to store OKR hierarchy information from Zatzet
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS external_key_result_id text,
ADD COLUMN IF NOT EXISTS external_key_result_title text,
ADD COLUMN IF NOT EXISTS external_objective_id text,
ADD COLUMN IF NOT EXISTS external_objective_title text;