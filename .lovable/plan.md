## Findings

- The database has real active data: 15 active users, 80 active goals, 36 active outputs, and 39 active tasks.
- Table access grants are now present for authenticated users, so this is no longer mainly a missing-GRANT problem.
- The likely blocker is frontend/runtime data loading:
  - `TeamWorkloadMonitoring` depends on `get_all_active_users_for_dashboard()`, but the live database currently does not have that RPC function.
  - Because the RPC failure happens at the start of `loadWorkloadData`, the workload arrays stay empty and the UI shows no team workload data.
  - The component also ignores the RPC error object, making the failure hard to see.

## Plan

1. Restore the missing dashboard RPC in Supabase.
   - Add/recreate `public.get_all_active_users_for_dashboard()`.
   - Grant execute access to authenticated users.
   - Keep interns blocked from organizational dashboard data.

2. Harden the Team Workload data loader.
   - Check and throw/log RPC errors instead of silently mapping an empty result.
   - Add a fallback to `get_filtered_users_for_role()` so workload can still load if the dashboard RPC is unavailable.

3. Keep workload counts aligned with existing visibility rules.
   - Continue using RLS-filtered tasks, weekly outputs, goals, and assignments.
   - Do not make private data public.

4. Verify after changes.
   - Query the RPC directly to confirm it returns active users.
   - Confirm workload monitor receives non-empty users and can calculate overview, goals, outputs, and task counts.