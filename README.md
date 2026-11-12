# Maatram Volunteering Gamification Portal

A gamified volunteer management platform built for **Maatram**, connecting students, alumni, and supporters with meaningful volunteering opportunities. Features a points-based reward system, peer verification, leaderboards, and an admin dashboard.

## Tech Stack

- **Frontend:** Expo SDK 58, React Native 0.88, React 19, Expo Router (file-based routing)
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **State:** Zustand + TanStack React Query
- **Backend:** Supabase (Auth, PostgreSQL, Row Level Security, Realtime)
- **Forms:** React Hook Form + Zod validation

## Features

- **Auth & Onboarding** — Email/password signup with role selection (Student, Alumni, Supporter)
- **Opportunity Discovery** — Browse, filter, and register for volunteering events
- **Verification Pipeline** — QR check-in, photo proof, admin review, and peer confirmations
- **Gamification Engine** — Points, streaks, levels, badges, and a live leaderboard
- **Priority Algorithm** — Smart opportunity ranking based on volunteer profile and history
- **Admin Dashboard** — Manage events, verify hours, view analytics, promote users
- **Notifications** — In-app and email notifications for key events
- **LinkedIn Sharing** — Share verified volunteer hours on LinkedIn

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm i -g pnpm@12`)
- Supabase project ([supabase.com](https://supabase.com))

### Setup

```bash
# Clone the repo
git clone https://github.com/tamil-selvan-k/Maatram-Volunteering-Gamification-Portal.git
cd Maatram-Volunteering-Gamification-Portal

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env
# Fill in your Supabase URL and anon key:
# EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run the SQL migrations in order via the Supabase SQL Editor:

1. `supabase/migrations/001_initial.sql` — Core schema (volunteers, opportunities, registrations, verifications, etc.)
2. `supabase/migrations/002_points_engine.sql` — Points, streaks, badges, and triggers
3. `supabase/migrations/003_email_trigger.sql` — Email notification trigger
4. `supabase/migrations/004_auth_trigger.sql` — Auto-create volunteer row on signup

### Run

```bash
# Start the Expo dev server (web)
pnpm start --web

# Or start for all platforms
pnpm start
```

## Project Structure

```
app/                    # Expo Router screens
├── (auth)/             # Login, signup, onboarding
├── (tabs)/             # Main tab navigator (home, events, leaderboard, profile)
├── admin/              # Admin dashboard
├── event/              # Event detail screens
└── _layout.tsx         # Root layout with auth gating

src/
├── components/         # Reusable UI components
│   ├── ui/             # Base components (Button, Input, Card)
│   └── gamification/   # Points, badges, leaderboard widgets
├── hooks/              # Custom hooks (useAuth, useLocation, etc.)
├── lib/                # Supabase client, query client
├── stores/             # Zustand stores (auth, ui)
├── schemas/            # Zod validation schemas
├── services/           # Supabase API service functions
└── types/              # TypeScript type definitions

supabase/migrations/    # SQL migration files
docs/                   # Design documentation (from proposal)
```

## Documentation

Detailed design docs are in the [docs/](docs/) directory:

- [Design Overview](docs/DESIGN.md)
- [Features](docs/FEATURES.md)
- [Verification Pipeline](docs/VERIFICATION.md)
- [Gamification Engine](docs/GAMIFICATION.md)
- [Priority Algorithm](docs/PRIORITY_ALGORITHM.md)
- [Notifications](docs/NOTIFICATIONS.md)
- [Admin Dashboard](docs/ADMIN.md)
- [Data Model](docs/DATA_MODEL.md)
- [UX Flow](docs/UX_FLOW.md)
- [Roadmap](docs/ROADMAP.md)
