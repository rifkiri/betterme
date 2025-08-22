-- Drop and recreate the habit completion function with correct parameter names
DROP FUNCTION IF EXISTS public.toggle_habit_completion(uuid, uuid, date, boolean);

-- Recreate the function with the parameter names expected by the code
CREATE OR REPLACE FUNCTION public.toggle_habit_completion(habit_id_param uuid, user_id_param uuid, target_date date, is_completed boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF is_completed THEN
    -- Insert completion record if it doesn't exist
    INSERT INTO public.habit_completions (habit_id, user_id, completed_date)
    VALUES (habit_id_param, user_id_param, target_date)
    ON CONFLICT (habit_id, completed_date) DO NOTHING;
    
    -- Update habit's last_completed_date and streak
    UPDATE public.habits 
    SET last_completed_date = target_date,
        streak = CASE 
          WHEN last_completed_date = target_date - INTERVAL '1 day' THEN streak + 1
          WHEN last_completed_date IS NULL OR last_completed_date < target_date - INTERVAL '1 day' THEN 1
          ELSE streak
        END
    WHERE id = habit_id_param AND user_id = user_id_param;
  ELSE
    -- Remove completion record
    DELETE FROM public.habit_completions 
    WHERE habit_id = habit_id_param AND completed_date = target_date AND user_id = user_id_param;
    
    -- Recalculate streak (simplified - just reset to 0 for now)
    UPDATE public.habits 
    SET streak = 0,
        last_completed_date = NULL
    WHERE id = habit_id_param AND user_id = user_id_param;
  END IF;
END;
$function$;