# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses **pnpm** (not npm/yarn/bun). Use `pnpm` for all package management.

```bash
pnpm start              # start dev server (all platforms)
pnpm start --web        # start for web only
pnpm android            # start for Android
pnpm ios                # start for iOS
npx expo lint           # lint
npx tsc --noEmit        # typecheck
npx expo-doctor         # diagnose dependency/config issues
npx expo install <pkg>  # install packages (resolves SDK-compatible versions)
npx expo install --fix  # fix incompatible package versions
```

Always run lint and typecheck before declaring a task done.

## Architecture Overview

### Routing (Expo Router)

All screens live in `app/` — file-based routing. Key groups:
- `app/(auth)/` — login, signup, onboarding (unauthenticated)
- `app/(tabs)/` — main tab navigator: home, opportunities, leaderboard, profile, notifications, admin
- `app/event/` — event detail and check-in screens
- `app/admin/` — admin dashboard screens
- `app/_layout.tsx` — root layout: wraps everything in `QueryClientProvider`, mounts `useAuthListener`, gates navigation to auth/onboarding on session state

Non-route code lives entirely under `src/`.

### Auth Flow

`useAuthListener` (called once in root layout) subscribes to Supabase auth state changes and syncs the result into `useAuthStore`. On load it checks whether the volunteer row exists, sets `needsOnboarding` if `preferences` and `skills` are both empty, and registers the push token when consent is given. Navigation redirects are driven by `useEffect` in `RootLayoutNav` reacting to `volunteer` and `needsOnboarding`.

Admin status: a user is admin when `volunteer.is_admin === true` OR `volunteer.role === 'admin' | 'org_admin'`. Use the `selectIsAdmin` selector from `auth.store.ts`.

### State Management

Two Zustand stores:
- `src/stores/auth.store.ts` — `volunteer` (the full `Volunteer` row), loading state, level-up detection. When `setVolunteer` detects a level increase it dynamically imports `ui.store` to trigger the modal (avoids circular dep).
- `src/stores/ui.store.ts` — transient UI state: opportunity filter/search, leaderboard period, `levelUpModal`, `needsOnboarding`.

Server state is managed with TanStack React Query. Custom hooks in `src/hooks/` (e.g. `useOpportunities`, `useLeaderboard`, `useVerification`) wrap query/mutation calls; they import from `src/services/`.

### Data Layer

All Supabase access goes through `src/services/`:
- `volunteer.service.ts` — CRUD for the `volunteers` table
- `opportunity.service.ts` — opportunities and registrations
- `verification.service.ts` — check-in, photo upload, peer confirms
- `admin.service.ts` — admin approval workflows
- `notifications.service.ts` — in-app notifications

Services return a `Result<T>` discriminated union (`{ data, error: null } | { data: null, error: AppError }`). Never throw — use `toAppError()` from `src/lib/errors.ts` to normalise errors.

The Supabase client is in `src/lib/supabase/client.ts` and is fully typed via `src/lib/supabase/database.types.ts`. Import via `@/lib/supabase/client`.

### Path Aliases

`@/*` → `./src/*`  
`~/*` → `./*` (repo root)

### Styling

NativeWind v4 (Tailwind for React Native). Config is in `tailwind.config.js`. Custom design tokens:
- **Background:** `bg-bg` (`#0D0D0F`), `bg-bg-secondary`, `bg-surface`, `bg-surface-elevated`, `bg-surface-overlay`
- **Accent:** `text-gold` / `bg-gold` (`#F5B800`), `gold-light`, `gold-dark`
- **Borders:** `border-border`, `border-border-strong`
- **Muted text:** `text-muted`

Dark-only UI — `userInterfaceStyle: "dark"` in `app.json`.

### Priority Algorithm

`src/lib/priority.ts` implements the slot-allocation algorithm. It is pure TypeScript with no side effects — safe to unit-test standalone. Score = N (newcomer) + D (diversity gap) + R (recency) + F (frustration) + L (reliability) + P (preference match), range −50 to 375. `allocateOpportunity()` returns `selected[]` and `waitlisted[]` volunteer IDs.

### Gamification

Points and levels are computed client-side via `getLevelInfo(total_points)` from `src/utils/`. Level-up detection lives in `useAuthStore.setVolunteer` and fires `useUIStore.showLevelUp()`. The `<LevelUpModal>` is mounted globally in root layout.

## Environment Variables

Required in `.env` (prefix `EXPO_PUBLIC_` makes them available to the app bundle):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Database

Migrations in `supabase/migrations/` must be applied in order:
1. `001_initial.sql` — core schema
2. `002_points_engine.sql` — points, streaks, badges, triggers
3. `003_email_trigger.sql` — email notifications
4. `004_auth_trigger.sql` — auto-create volunteer row on signup

The `004_auth_trigger.sql` migration is essential — without it, Supabase Auth signups will not create a row in the `volunteers` table, causing the app to silently treat users as unauthenticated.
