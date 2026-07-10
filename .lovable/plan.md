## Root cause: Team Workload doesn't load when `membersSummary` is empty

Comparison to the Goals / Organizational dashboard:

- **Goals dashboard** calls `supabaseGoalsService.getAllGoals()` (and per-user queries) directly. It renders as long as the RLS-backed query returns rows. There is no gate on `teamData`.
- **Team Workload** (`TeamWorkloadMonitoring.tsx`) already fetches its own users via the `get_all_active_users_for_dashboard` RPC (SECURITY DEFINER, bypasses RLS) inside `loadWorkloadData`. RLS on `goals`, `tasks`, `weekly_outputs`, and `goal_assignments` already grants managers/admins read access, so the underlying queries are fine — same pattern the goals dashboard relies on.
- **The bug is in the trigger, not the query.** `useEffect` (line 222‑230) only calls `loadWorkloadData()` when `teamData?.membersSummary?.length > 0`. `TeamDataService.getCurrentManagerTeamData` builds `membersSummary` from `getUsers()` filtered by `role !== 'admin'`, and RLS on `profiles` (`Role-based profile viewing`) hides admins/interns from managers. In several signed-in contexts (admin viewing, or a manager whose visible team-members list is empty) `membersSummary` comes back as `[]`, so the workload loader never fires and every tab renders empty — even though the RPC would happily return the full active user list.

The goals dashboard doesn't hit this because it never depends on `membersSummary`.

## Fix plan

### 1. Decouple workload loading from `teamData.membersSummary`
`src/components/manager/TeamWorkloadMonitoring.tsx`
- Change the `useEffect` to run `loadWorkloadData()` on mount (empty deps) so the RPC-backed fetch always runs. Keep a second effect that re-runs when `teamData` changes, purely for freshness after realtime updates.
- Remove the `!teamData.membersSummary` early-return guard; render the tabs as long as we're not in the initial `isLoading` state, and let each tab show its own "No … found" empty state (which already exists).
- Keep the RPC + fallback path already added; it's the same auth surface the goals dashboard uses.

### 2. Color the Coach / Lead / Member tags
Introduce a shared token map so the same colors apply in both places:

```ts
const ROLE_STYLES = {
  coach:  { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   icon: 'text-blue-600'   },
  lead:   { bg: 'bg-emerald-100',text: 'text-emerald-800',border: 'border-emerald-200',icon: 'text-emerald-600'},
  member: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', icon: 'text-purple-600' },
};
```

Apply in:
- `TeamWorkloadMonitoring.tsx` Goals → Goal View (lines 927‑949): wrap Coach / Leads / Members rows in colored `Badge`s using `ROLE_STYLES` instead of plain text + icon.
- `UserGoalAssignmentCard.tsx` `getRoleBadgeVariant` / `getRoleIcon` (lines 33‑57) and the badges rendered around lines 102‑117: replace the `default | secondary | outline` variants with `className={cn(ROLE_STYLES[role].bg, ROLE_STYLES[role].text, ROLE_STYLES[role].border)}`, and tint the icon with `ROLE_STYLES[role].icon`.

No RLS / migration changes — the DB side already matches the goals dashboard.

### Verification
- Reload `/manager` as manager and as admin; confirm Overview, Goals, Outputs, Tasks tabs populate.
- Check console: the existing `console.log('TeamWorkloadMonitoring - active dashboard users loaded:', allUsers.length)` should print > 0.
- Visually confirm the Coach (blue), Lead (green), Member (purple) tags in both Goal View and User View.
