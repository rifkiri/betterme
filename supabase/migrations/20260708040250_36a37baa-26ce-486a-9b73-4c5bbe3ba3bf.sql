
-- Create admin demo user
DO $$
DECLARE
  new_user_id UUID := 'a1d2e3f4-0000-4000-8000-000000000001';
  hashed_pw TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@betternco.com') THEN
    hashed_pw := crypt('defnotanadmin', gen_salt('bf'));

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id, 'authenticated', 'authenticated',
      'admin@betternco.com', hashed_pw, now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin Demo","role":"admin"}',
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id, 'admin@betternco.com')::jsonb,
      'email', new_user_id::text, now(), now(), now()
    );
  END IF;

  -- Ensure profile has admin role
  UPDATE public.profiles
    SET role = 'admin', name = 'Admin Demo', user_status = 'active', has_changed_password = true
    WHERE id = new_user_id;
END $$;

-- Seed dummy data
DO $$
DECLARE
  uid UUID := 'a1d2e3f4-0000-4000-8000-000000000001';
  g1 UUID; g2 UUID; g3 UUID; g4 UUID; g5 UUID; g6 UUID;
  h1 UUID; h2 UUID; h3 UUID; h4 UUID;
BEGIN
  -- GOALS
  INSERT INTO public.goals (user_id, title, description, category, subcategory, progress, completed, deadline, visibility, created_by)
  VALUES
    (uid, 'Launch Product V2', 'Ship the redesigned product to all customers', 'work', 'product', 65, false, current_date + 45, 'all', uid) RETURNING id INTO g1;
  INSERT INTO public.goals (user_id, title, description, category, subcategory, progress, completed, deadline, visibility, created_by)
  VALUES (uid, 'Grow MRR to $50k', 'Scale monthly recurring revenue', 'work', 'growth', 40, false, current_date + 90, 'managers', uid) RETURNING id INTO g2;
  INSERT INTO public.goals (user_id, title, description, category, subcategory, progress, completed, deadline, visibility, created_by)
  VALUES (uid, 'Hire 5 Engineers', 'Complete Q3 hiring plan', 'work', 'people', 100, true, current_date - 10, 'all', uid) RETURNING id INTO g3;
  INSERT INTO public.goals (user_id, title, description, category, subcategory, progress, completed, deadline, visibility, created_by)
  VALUES (uid, 'Read 12 Books', 'One book per month', 'personal', 'learning', 75, false, current_date + 120, 'self', uid) RETURNING id INTO g4;
  INSERT INTO public.goals (user_id, title, description, category, subcategory, progress, completed, deadline, visibility, created_by)
  VALUES (uid, 'Run Half Marathon', 'Complete 21k race', 'personal', 'fitness', 100, true, current_date - 30, 'self', uid) RETURNING id INTO g5;
  INSERT INTO public.goals (user_id, title, description, category, subcategory, progress, completed, deadline, visibility, created_by)
  VALUES (uid, 'Improve NPS to 60', 'Customer satisfaction initiative', 'work', 'customer', 25, false, current_date + 60, 'all', uid) RETURNING id INTO g6;

  -- WEEKLY OUTPUTS
  INSERT INTO public.weekly_outputs (user_id, title, description, progress, due_date, linked_goal_id, visibility) VALUES
    (uid, 'Finalize V2 design specs', 'Ship Figma handoff to eng', 80, current_date + 5, g1, 'all'),
    (uid, 'Launch pricing experiment', 'A/B test new tiers', 45, current_date + 7, g2, 'managers'),
    (uid, 'Onboard 2 new engineers', 'Complete week 1 onboarding', 100, current_date - 3, g3, 'all'),
    (uid, 'Read "Staff Engineer"', 'Chapter 1-5 notes', 60, current_date + 10, g4, 'self'),
    (uid, 'Customer feedback interviews', '5 interviews this week', 30, current_date + 6, g6, 'all');

  -- TASKS
  INSERT INTO public.tasks (user_id, title, description, priority, completed, due_date, visibility) VALUES
    (uid, 'Review Q3 board deck', 'Prep for Friday meeting', 'high', false, current_date + 2, 'all'),
    (uid, 'Approve engineering offers', 'Two candidates pending', 'urgent', false, current_date + 1, 'managers'),
    (uid, 'Weekly 1:1 with leads', 'Recurring meetings', 'medium', false, current_date, 'all'),
    (uid, 'Update roadmap page', 'Public roadmap refresh', 'low', false, current_date + 4, 'all'),
    (uid, 'Draft investor update', 'Monthly update email', 'high', false, current_date + 3, 'self'),
    (uid, 'Sign vendor contract', 'DocuSign pending', 'medium', true, current_date - 1, 'all'),
    (uid, 'Review candidate portfolios', 'Design hire round', 'medium', true, current_date - 2, 'managers'),
    (uid, 'Publish blog post', 'Product launch teaser', 'low', true, current_date - 5, 'all');

  -- HABITS
  INSERT INTO public.habits (user_id, name, description, category, streak, last_completed_date) VALUES
    (uid, 'Morning workout', '30 min gym session', 'fitness', 12, current_date) RETURNING id INTO h1;
  INSERT INTO public.habits (user_id, name, description, category, streak, last_completed_date) VALUES
    (uid, 'Deep work block', '2h focused work in morning', 'productivity', 8, current_date) RETURNING id INTO h2;
  INSERT INTO public.habits (user_id, name, description, category, streak, last_completed_date) VALUES
    (uid, 'Read 30 minutes', 'Before bed reading', 'learning', 15, current_date - 1) RETURNING id INTO h3;
  INSERT INTO public.habits (user_id, name, description, category, streak, last_completed_date) VALUES
    (uid, 'Meditate 10 min', 'Headspace session', 'mental', 5, current_date) RETURNING id INTO h4;

  -- HABIT COMPLETIONS (last 15 days sample)
  INSERT INTO public.habit_completions (habit_id, user_id, completed_date)
  SELECT h1, uid, current_date - g FROM generate_series(0, 11) g
  UNION ALL SELECT h2, uid, current_date - g FROM generate_series(0, 7) g
  UNION ALL SELECT h3, uid, current_date - g FROM generate_series(1, 14) g
  UNION ALL SELECT h4, uid, current_date - g FROM generate_series(0, 4) g
  ON CONFLICT DO NOTHING;

  -- MOOD ENTRIES
  INSERT INTO public.mood_entries (user_id, date, mood, notes)
  VALUES
    (uid, current_date, 4, 'Productive day, shipped a big feature'),
    (uid, current_date - 1, 5, 'Great team offsite'),
    (uid, current_date - 2, 3, 'Busy day, lots of meetings'),
    (uid, current_date - 3, 4, 'Good deep work session'),
    (uid, current_date - 4, 4, 'Made progress on hiring'),
    (uid, current_date - 5, 2, 'Stressful — investor prep'),
    (uid, current_date - 6, 3, 'Recovering weekend'),
    (uid, current_date - 7, 5, 'Race day! Finished half marathon'),
    (uid, current_date - 8, 4, 'Prep run'),
    (uid, current_date - 10, 4, 'Solid week wrap-up'),
    (uid, current_date - 12, 3, 'Mid-week slump'),
    (uid, current_date - 14, 4, 'Team celebration')
  ON CONFLICT DO NOTHING;
END $$;
