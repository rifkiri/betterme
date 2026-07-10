
## Goal

Every card that renders a **goal**, **task**, or **biweekly/weekly output** — anywhere in the app — must show a consistent, at-a-glance strip of metadata:

1. **Owner** — who created / owns the item (name, avatar-style tag)
2. **Assigned role tag** — color-coded when applicable: Coach (blue), Lead (emerald), Member (purple)
3. **Visibility badge** — Public (green Globe), Managers-only (amber Shield), Private (slate Lock)

Then fix the Organizational Dashboard refetching-on-every-visit bug by adding a lightweight cache.

## Part 1 — Shared card metadata strip

### 1a. New shared component: `CardMetaStrip`

`src/components/ui/card-meta-strip.tsx` — small presentational component that renders (in this fixed order):

- `<OwnerTag ownerId={} />` — resolves name via a small cache hook (`useOwnerName`) that batch-loads profile names and memoizes them. Renders a subtle outline badge: "Owner: {name}".
- `<RoleTag role="coach|lead|member" />` — uses existing `ROLE_STYLES` map already added in `TeamWorkloadMonitoring.tsx`. This gets promoted to a shared module at `src/components/ui/role-styles.ts` so every consumer imports from one place.
- `<VisibilityBadge visibility="all|managers|self" />` — already exists at `src/components/ui/visibility-badge.tsx` from the previous change.

The strip renders inline, wraps on small screens, and hides any tag whose data is missing (e.g. no assigned role → skip the role tag).

### 1b. Promote `ROLE_STYLES` to a shared module

Extract the map currently duplicated in `TeamWorkloadMonitoring.tsx` and `UserGoalAssignmentCard.tsx` into:

```
src/components/ui/role-styles.ts
  export const ROLE_STYLES = { coach: {...}, lead: {...}, member: {...} }
  export const RoleTag = ({ role }) => <Badge ...>...</Badge>
```

Update both existing files to import from here instead of redeclaring.

### 1c. New hook: `useOwnerName(userId)`

`src/hooks/useOwnerName.ts` — module-level `Map<string, string>` cache + in-flight promise dedupe. First call for a user id fetches `profiles.name` once; subsequent calls return the cached name synchronously. Avoids the N+1 fetches we'd otherwise trigger by rendering the owner name on every card.

### 1d. Wire `CardMetaStrip` into every card

Replace ad-hoc badge blocks with `<CardMetaStrip />` in:

| File | What changes |
| --- | --- |
| `src/components/GoalCard.tsx` | My Goals — Active/Completed lists |
| `src/components/MarketplaceGoalCard.tsx` | Marketplace goal browsing |
| `src/components/TaskItem.tsx` | Today / Task lists (Productivity, My Tasks) |
| `src/components/TaskItemWithPomodoro.tsx` | Task list with pomodoro timer |
| `src/components/WeeklyOutputCard.tsx` | Weekly / biweekly outputs section |
| `src/components/manager/UserGoalAssignmentCard.tsx` | Org dashboard → Goals view |
| `src/components/manager/UserTaskOwnershipCard.tsx` | Org dashboard → Tasks view |
| `src/components/manager/UserOutputOwnershipCard.tsx` | Org dashboard → Outputs view |

For manager-side cards where the "owner" is the card header itself, the strip renders only the visibility + role tags to avoid duplicating the name.

The visibility badge added earlier in `GoalCard` and `TaskItem` gets removed as a standalone line and folded into the strip so we don't render the same badge twice.

## Part 2 — Fix Organizational Dashboard refetch-on-every-visit

### Problem

`src/pages/Manager.tsx` calls `useTeamDataRealtime()`. When the user navigates away (e.g. to `/goals`) the route unmounts, the hook is disposed, and returning to `/manager` re-runs `loadTeamData()` from scratch — several hundred-ms round-trip every visit, even though realtime is already in place and the data is likely still fresh.

### Fix

Add a module-level cache inside `useTeamDataRealtime.ts`:

```ts
// module scope
let cachedTeamData: TeamData | null = null;
let cachedForUserId: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute soft TTL
```

On mount:
- If `cachedForUserId === user.id` **and** `Date.now() - cachedAt < CACHE_TTL_MS`, hydrate `teamData` synchronously from `cachedTeamData`, skip the initial network round-trip, and set `isLoading = false`.
- Otherwise load as today.
- Every successful `loadTeamData` writes the fresh payload back into the module cache.
- Realtime updates (which already run in the background) also refresh the cache, so the next visit shows immediately up-to-date data with zero flicker.

This gives us the "click Organizational Dashboard → instant render" behavior without pulling in React Query.

## Out of scope for this pass

- No RLS / migration changes.
- No changes to what data the cards fetch — only what they display.
- No layout redesign of individual cards beyond swapping the badge cluster.

## Technical notes

- `CardMetaStrip` accepts optional props (`ownerId?`, `role?`, `visibility?`) so each card only passes what it has.
- `ROLE_STYLES` becomes the single source of truth for coach/lead/member colors; deleting the local copies prevents future drift.
- `useOwnerName` returns `{ name, isLoading }` and never re-fetches an id already in the cache for the lifetime of the tab.
- The Manager-page cache is scoped per user id, so signing out / signing in as another user does NOT leak the previous user's org data.
