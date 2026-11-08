# App Design — Auth Flow & Role-Based Routing

## Authentication Flow

```
App opens
  │
  ├─ Loading (auth check) → Show spinner (max 5s)
  │
  ├─ No session → /(auth)/login
  │     ├─ Login success → check volunteer record
  │     │     ├─ needs onboarding (no preferences/skills) → /(auth)/onboarding
  │     │     ├─ is_admin → /admin
  │     │     └─ regular volunteer → /(tabs)
  │     └─ "Sign Up" link → /(auth)/signup → onboarding → /(tabs)
  │
  └─ Has session → fetch volunteer record
        ├─ needs onboarding → /(auth)/onboarding
        ├─ is_admin → /admin
        └─ regular volunteer → /(tabs)
```

## Route Structure (Expo Router)

```
app/
├── index.tsx              # Auth gate: redirects based on auth state
├── _layout.tsx            # Root layout: providers, auth listener, Stack navigator
├── (auth)/
│   ├── _layout.tsx        # Auth group Stack
│   ├── login.tsx          # Email/password login
│   ├── signup.tsx         # Registration form
│   └── onboarding.tsx     # Preferences, skills, consent toggles
├── (tabs)/
│   ├── _layout.tsx        # Tab navigator with 6 tabs (+admin if is_admin)
│   ├── index.tsx          # Home feed (opportunities + live activity)
│   ├── opportunities.tsx  # Explore/search opportunities
│   ├── dashboard.tsx      # Impact dashboard (points, heatmap, badges)
│   ├── leaderboard.tsx    # Leaderboard with filters
│   ├── notifications.tsx  # Alerts/notifications
│   ├── profile.tsx        # User profile
│   └── admin.tsx          # Admin tab (hidden if not admin)
├── admin/
│   └── _layout.tsx        # Admin dashboard screens
├── event/                 # Event detail, QR scanner
└── demo.tsx               # Demo/seed data screen
```

## Auth State Management

- **Store:** `src/stores/auth.store.ts` (Zustand)
  - `volunteer: Volunteer | null` — null when not authenticated
  - `isLoading: boolean` — true during initial auth check
  - `is_admin` derived from `volunteer.is_admin` or `volunteer.role === 'admin'`

- **Hook:** `src/hooks/useAuth.ts` — `useAuthListener()`
  - Calls `supabase.auth.getSession()` on mount
  - Subscribes to `onAuthStateChange`
  - Sets `volunteer` and `isLoading` in store
  - On SIGNED_OUT → navigates to `/(auth)/login`

## Role-Based Access

| Role | Routes | Tab Visibility |
|------|--------|----------------|
| Unauthenticated | `/(auth)/login`, `/(auth)/signup` | None |
| New volunteer (no prefs) | `/(auth)/onboarding` | None |
| Volunteer | `/(tabs)/*`, `/event/*` | Home, Explore, Impact, Leaders, Alerts, Profile |
| Admin | `/(tabs)/*`, `/admin/*` | All above + Admin tab |

## Key Design Decisions

1. **`app/index.tsx` as auth gate** — Uses `<Redirect>` component for declarative routing based on auth state. No flicker.
2. **5s timeout fallback** — If Supabase auth check hangs, layout renders after 5 seconds and redirects to login.
3. **Supabase REST API only** — No direct DB connection. Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` needed.
4. **Never expose service-role key** — All elevated operations happen in Supabase Edge Functions or via RLS policies.
