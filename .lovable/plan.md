# Plan: Notifications, UI Polish & Caching

## 1. Notification Settings — more granular control

Extend `notification_preferences` (migration) with new opt-in toggles:

- `notify_goal_updates` (bool, default true) — a goal I'm a member/owner of changed (progress, deadline, title, completion)
- `notify_task_updates` (bool, default true) — a task I'm tagged on or own changed
- `notify_output_updates` (bool, default true) — a weekly/bi-weekly output I own changed
- `notify_assignment_accepted` (bool, default true) — someone accepted/declined my invitation
- `notify_daily_digest` (bool, default false) — end-of-day summary of what's due tomorrow
- `notify_mention` (bool, default true) — I was @tagged on a task

Rebuild `NotificationPreferencesSection` with grouped cards (Tasks / Goals / Outputs / Digests) and toggle rows.

Extend `useNotificationDaemon` to subscribe to `UPDATE` events on `goals`, `tasks`, `weekly_outputs` and fire browser notifications gated by the matching preference, only for rows where the current user is owner or in `goal_assignments`/`tagged_users`.

## 2. Header (AppNavigation) fix for admin/manager

Problem: too many nav items overflow the top bar on mid-width screens for admin/manager (Productivity, Goals, Progress, Team, Org Dashboard, Settings + bell + avatar + signout).

Fix:

- Collapse desktop nav at `< lg` into a compact "More" dropdown (shadcn `DropdownMenu`) after 4 primary items.
- Move Settings under the avatar menu (avatar becomes a dropdown: Profile, Settings, Sign out) — frees a slot and matches modern SaaS patterns.
- Give the bar a subtle glass gradient, tighter spacing, active-tab pill with animated underline.
- Truncate/ellipsize on overflow; use icons only under `md`.

## 3. SignIn page redesign

Currently barebones. Rebuild as split layout:

- Left (desktop): brand panel — BetterMe wordmark logo, tagline, animated gradient background, testimonial or feature bullets.
- Right: clean card with sign-in form, "Forgot password", subtle motion on mount.
- Mobile: single column, logo on top.
- Add a generated `BetterMe` wordmark SVG asset (via imagegen, transparent PNG or inline SVG) used here and in `AppNavigation`.

## 4. Caching / performance

Root cause: hooks call Supabase on every mount and route change; there's no shared cache. React Query is already installed (`@tanstack/react-query`) and a `QueryClient` exists in `App.tsx`, but data hooks (`useGoals`, `useTasks`, `useWeeklyOutputs`, `useHabits`, `useCurrentUser`, `useUserProfile`) use `useState + useEffect` and refetch every time.

Plan:

- Introduce a thin React Query wrapper for the hottest queries:
  - `useGoalsQuery(userId)` → `['goals', userId]`, staleTime 60s
  - `useTasksQuery(userId)` → `['tasks', userId]`, staleTime 30s
  - `useWeeklyOutputsQuery(userId)` → staleTime 60s
  - `useProfilesQuery()` → staleTime 5 min
  - `useCurrentUserQuery()` → staleTime 5 min
- Keep the existing imperative hooks but back them with the query cache (read via `queryClient.getQueryData`, invalidate on mutations).
- Realtime subscriptions call `queryClient.invalidateQueries` instead of re-running full fetches manually — one source of truth.
- Configure `QueryClient` defaults: `staleTime: 30_000`, `gcTime: 5 * 60_000`, `refetchOnWindowFocus: false`, `retry: 1`.
- Add a small `usePrefetchOnHover` helper on nav links so hovering "My Goals" warms the cache.

Scope note: I'll migrate the highest-traffic hooks first (goals, tasks, outputs, profile). The rest can follow incrementally without breaking anything.

## Deliverables

- 1 migration: add 6 columns to `notification_preferences`.
- New/updated files:
  - `src/components/settings/NotificationPreferencesSection.tsx` (rebuild with groups)
  - `src/hooks/useNotificationPreferences.ts` (add new fields)
  - `src/hooks/useNotificationDaemon.ts` (add UPDATE listeners + gating)
  - `src/components/AppNavigation.tsx` (responsive nav + avatar menu)
  - `src/pages/SignIn.tsx` (redesign)
  - `src/assets/betterme-logo.svg` (new)
  - `src/lib/queryClient.ts` (defaults) + `src/hooks/queries/*.ts` (new query hooks)
  - Wire query hooks into `useGoalsManager`, `useTasksManager`, `useWeeklyOutputsManager`, `useCurrentUser`.

Approve to proceed, or tell me which pieces to drop / prioritize.