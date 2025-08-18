-- Update goals with null created_by to use user_id as fallback
UPDATE goals 
SET created_by = user_id 
WHERE created_by IS NULL;