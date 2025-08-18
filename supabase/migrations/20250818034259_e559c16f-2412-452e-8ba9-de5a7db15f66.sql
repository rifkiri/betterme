-- Add subcategory column to goals table
ALTER TABLE public.goals 
ADD COLUMN subcategory TEXT;