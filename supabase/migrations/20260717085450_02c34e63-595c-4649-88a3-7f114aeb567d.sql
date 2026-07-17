-- 1. Add progress calculation mode to goals
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS progress_calculation text DEFAULT 'manual' CHECK (progress_calculation IN ('manual', 'weighted'));

-- 2. Add progress calculation mode and weight to weekly_outputs
ALTER TABLE public.weekly_outputs
  ADD COLUMN IF NOT EXISTS progress_calculation text DEFAULT 'manual' CHECK (progress_calculation IN ('manual', 'weighted')),
  ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 1 CHECK (weight >= 0);

-- 3. Add weight to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 1 CHECK (weight >= 0);

-- 4. Function to recalculate weekly output progress from its child tasks
CREATE OR REPLACE FUNCTION public.recalculate_output_progress(output_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calc_mode text;
  v_new_progress numeric;
  v_total_weight numeric;
  v_weighted_sum numeric;
  v_count_all integer;
  v_count_done integer;
BEGIN
  SELECT progress_calculation INTO v_calc_mode
  FROM public.weekly_outputs
  WHERE id = output_uuid;

  IF v_calc_mode = 'weighted' THEN
    SELECT COALESCE(SUM(weight), 0),
           COALESCE(SUM(CASE WHEN completed THEN 100 ELSE 0 END * weight), 0)
    INTO v_total_weight, v_weighted_sum
    FROM public.tasks
    WHERE weekly_output_id = output_uuid AND COALESCE(is_deleted, false) = false;

    IF v_total_weight > 0 THEN
      v_new_progress := ROUND(v_weighted_sum / v_total_weight);
    ELSE
      SELECT COUNT(*), COUNT(*) FILTER (WHERE completed)
      INTO v_count_all, v_count_done
      FROM public.tasks
      WHERE weekly_output_id = output_uuid AND COALESCE(is_deleted, false) = false;

      IF v_count_all > 0 THEN
        v_new_progress := ROUND((v_count_done::numeric / v_count_all::numeric) * 100);
      ELSE
        v_new_progress := 0;
      END IF;
    END IF;

    UPDATE public.weekly_outputs
    SET progress = v_new_progress,
        completed_date = CASE WHEN v_new_progress = 100 THEN now() ELSE NULL END
    WHERE id = output_uuid;
  END IF;
END;
$$;

-- 5. Function to recalculate goal progress from its child weekly outputs
CREATE OR REPLACE FUNCTION public.recalculate_goal_progress(goal_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calc_mode text;
  v_new_progress numeric;
  v_total_weight numeric;
  v_weighted_sum numeric;
  v_count_all integer;
BEGIN
  SELECT progress_calculation INTO v_calc_mode
  FROM public.goals
  WHERE id = goal_uuid;

  IF v_calc_mode = 'weighted' THEN
    SELECT COALESCE(SUM(weight), 0),
           COALESCE(SUM(progress * weight), 0)
    INTO v_total_weight, v_weighted_sum
    FROM public.weekly_outputs
    WHERE linked_goal_id = goal_uuid AND COALESCE(is_deleted, false) = false;

    IF v_total_weight > 0 THEN
      v_new_progress := ROUND(v_weighted_sum / v_total_weight);
    ELSE
      SELECT COUNT(*), COALESCE(SUM(progress), 0)
      INTO v_count_all, v_weighted_sum
      FROM public.weekly_outputs
      WHERE linked_goal_id = goal_uuid AND COALESCE(is_deleted, false) = false;

      IF v_count_all > 0 THEN
        v_new_progress := ROUND(v_weighted_sum::numeric / v_count_all::numeric);
      ELSE
        v_new_progress := 0;
      END IF;
    END IF;

    UPDATE public.goals
    SET progress = v_new_progress,
        completed = (v_new_progress = 100)
    WHERE id = goal_uuid;
  END IF;
END;
$$;

-- 6. Triggers
CREATE OR REPLACE FUNCTION public.on_task_progress_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.weekly_output_id IS NOT NULL THEN
      PERFORM public.recalculate_output_progress(NEW.weekly_output_id);
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.weekly_output_id IS NOT NULL THEN
      PERFORM public.recalculate_output_progress(NEW.weekly_output_id);
    END IF;
    IF OLD.weekly_output_id IS NOT NULL AND OLD.weekly_output_id IS DISTINCT FROM NEW.weekly_output_id THEN
      PERFORM public.recalculate_output_progress(OLD.weekly_output_id);
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.weekly_output_id IS NOT NULL THEN
      PERFORM public.recalculate_output_progress(OLD.weekly_output_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_progress_change ON public.tasks;
CREATE TRIGGER trg_task_progress_change
AFTER INSERT OR UPDATE OF completed, weight, weekly_output_id, is_deleted OR DELETE
ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.on_task_progress_change();

CREATE OR REPLACE FUNCTION public.on_output_progress_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.linked_goal_id IS NOT NULL THEN
      PERFORM public.recalculate_goal_progress(NEW.linked_goal_id);
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.progress_calculation IS DISTINCT FROM NEW.progress_calculation
       AND NEW.progress_calculation = 'weighted' THEN
      PERFORM public.recalculate_output_progress(NEW.id);
    END IF;
    IF NEW.linked_goal_id IS NOT NULL THEN
      PERFORM public.recalculate_goal_progress(NEW.linked_goal_id);
    END IF;
    IF OLD.linked_goal_id IS NOT NULL AND OLD.linked_goal_id IS DISTINCT FROM NEW.linked_goal_id THEN
      PERFORM public.recalculate_goal_progress(OLD.linked_goal_id);
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.linked_goal_id IS NOT NULL THEN
      PERFORM public.recalculate_goal_progress(OLD.linked_goal_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_output_progress_change ON public.weekly_outputs;
CREATE TRIGGER trg_output_progress_change
AFTER INSERT OR UPDATE OF progress, weight, linked_goal_id, progress_calculation, is_deleted OR DELETE
ON public.weekly_outputs
FOR EACH ROW
EXECUTE FUNCTION public.on_output_progress_change();

CREATE OR REPLACE FUNCTION public.on_goal_calc_mode_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.progress_calculation IS DISTINCT FROM NEW.progress_calculation
     AND NEW.progress_calculation = 'weighted' THEN
    PERFORM public.recalculate_goal_progress(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_goal_calc_mode_change ON public.goals;
CREATE TRIGGER trg_goal_calc_mode_change
AFTER UPDATE OF progress_calculation
ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.on_goal_calc_mode_change();