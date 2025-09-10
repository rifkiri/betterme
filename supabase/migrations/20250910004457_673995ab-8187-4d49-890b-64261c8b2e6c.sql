-- Fix function search path security issues
-- Add SET search_path = 'public' to functions that are missing it

-- Fix get_habits_for_date function
CREATE OR REPLACE FUNCTION public.get_habits_for_date(user_id_param uuid, target_date date)
 RETURNS TABLE(id uuid, name text, description text, category text, streak integer, archived boolean, is_deleted boolean, created_at timestamp with time zone, completed boolean, linked_goal_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.name,
    h.description,
    h.category::TEXT,
    h.streak,
    h.archived,
    h.is_deleted,
    h.created_at,
    COALESCE(hc.completed_date IS NOT NULL, FALSE) as completed,
    h.linked_goal_id
  FROM habits h
  LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completed_date = target_date
  WHERE h.user_id = user_id_param
  ORDER BY h.created_at DESC;
END;
$function$;

-- Fix toggle_habit_completion function
CREATE OR REPLACE FUNCTION public.toggle_habit_completion(habit_id_param uuid, user_id_param uuid, target_date date, is_completed boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF is_completed THEN
    -- Insert completion record if it doesn't exist
    INSERT INTO habit_completions (habit_id, user_id, completed_date)
    VALUES (habit_id_param, user_id_param, target_date)
    ON CONFLICT (habit_id, completed_date) DO NOTHING;
    
    -- Update habit's last_completed_date and streak
    UPDATE habits 
    SET last_completed_date = target_date,
        streak = CASE 
          WHEN last_completed_date = target_date - INTERVAL '1 day' THEN streak + 1
          WHEN last_completed_date IS NULL OR last_completed_date < target_date - INTERVAL '1 day' THEN 1
          ELSE streak
        END
    WHERE id = habit_id_param AND user_id = user_id_param;
  ELSE
    -- Remove completion record
    DELETE FROM habit_completions 
    WHERE habit_id = habit_id_param AND completed_date = target_date AND user_id = user_id_param;
    
    -- Recalculate streak (simplified - just reset to 0 for now)
    UPDATE habits 
    SET streak = 0,
        last_completed_date = NULL
    WHERE id = habit_id_param AND user_id = user_id_param;
  END IF;
END;
$function$;

-- Fix update_weekly_outputs_updated_at function
CREATE OR REPLACE FUNCTION public.update_weekly_outputs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    'team-member'
  );
  RETURN new;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Fix validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Password must be at least 8 characters
  IF LENGTH(password) < 8 THEN
    RETURN FALSE;
  END IF;
  
  -- Password must contain at least one number
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Password must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Password must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;