# Maatram Volunteering Gamification Portal — Design Overview

**MH26-02 | Software Track | Team: SoDak Technology | Maatram HackForge 2026-27**

## 1. The Idea & Problem

**Maatram Foundation** depends on volunteers — students, alumni, and supporters — who help with school visits, admissions, background verification (BGV), mock interviews, and admission panel interviews. Today, tracking who is helping, how much, and who is drifting away is nearly impossible.

### The Core Problem

There is no system to fairly distribute volunteering opportunities, verify that volunteering actually happened, or recognise and motivate consistent contributors. The same eager few get all the work while newcomers are left out, and anyone can claim hours without proof.

### Our Solution

A mobile-first gamification portal that:

- Lists volunteering opportunities and lets volunteers register interest
- **Fairly allocates** opportunities using a priority algorithm (not first-come-first-served)
- **Verifies** volunteering actually happened (QR check-in, in-app photo proof, peer confirmation)
- **Gamifies** the experience with points, levels, streaks, badges, and leaderboards
- Gives admins full visibility via reports and dashboards

**Motto:** *"Give opportunity to all."* — Every volunteer deserves a chance to contribute, not just the fastest clickers.

---

## 2. What Makes This Different (USPs)

### Priority-Based Fair Allocation
Most portals use first-come-first-served. Ours uses a weighted algorithm that ensures newcomers get pulled in, consistent contributors are rewarded, and no one hogs all opportunities.

### Tamper-Proof Verification
QR check-in/check-out for physical events, in-app camera with GPS/timestamp for photo proof, and peer cross-confirmation. No one can fake hours without collusion.

### Activity-Weighted Scoring
Not all volunteering is equal. A full-day school visit weighs more than a phone call. The algorithm knows this and balances opportunity access accordingly.

### Flexible Streaks
Activities don't come daily. Our streak system rewards consistency across opportunity windows — not arbitrary daily check-ins. You keep your streak by showing up when it matters.

---

## 3. Tech Stack

| Layer | Technology | Why This Choice |
|---|---|---|
| Mobile App | React Native (Expo) | Single codebase for Android + iOS. Expo gives fast iteration, OTA updates, push notifications, and camera/location APIs out of the box. The team knows React. |
| Navigation | React Navigation v7 | Native stack navigator with shared element transitions for smooth, app-like feel. |
| Animations | React Native Reanimated 3 + Moti | 60fps animations on the UI thread. Critical for gamification feel — level-ups, progress rings, badge reveals, confetti. |
| UI Components | NativeWind (Tailwind for RN) | Rapid styling, consistent design system, responsive. Feels like writing web Tailwind. |
| Backend + Database | Supabase (PostgreSQL) | Auth, Realtime subscriptions, Row-Level Security, Edge Functions, Storage (for photos). Has a first-class JS SDK. Free tier handles hackathon scale. |
| Auth | Supabase Auth (Email + Google OAuth) | Built-in, zero config. Supports magic links (good for volunteers who forget passwords). |
| Push Notifications | Expo Notifications + Supabase Edge Functions | Expo handles device tokens. Supabase Edge Functions trigger notifications on event creation via database webhooks. |
| Email | Resend | Simple API, free tier (100 emails/day), React Email for templating thank-you notes. |
| QR Generation | Custom TOTP-like QR (Edge Function) | Server generates time-rotating QR codes. Client scans with expo-camera. |
| LinkedIn Sharing | LinkedIn Share URL API | Pre-filled post via URL params — no OAuth complexity needed. |
| State Management | Zustand + React Query (TanStack) | Zustand for local state (simple, minimal). React Query for server state (caching, optimistic updates, background refetch). |
| Charts/Viz | Victory Native | Animated charts for the dashboard — progress rings, heatmaps, leaderboard bars. |
| Lottie Animations | lottie-react-native | Pre-built animation files for level-ups, confetti, badge unlocks — high-impact, low-effort. |

### Why React Native + Expo over Flutter?
The team's existing React expertise means faster development and no learning curve for a new language (Dart). Expo's managed workflow handles camera, location, notifications, and OTA updates without native module headaches. With Reanimated 3, we achieve Flutter-level animation smoothness on the JS side.

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native / Expo)                  │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   Auth   │ │  Opport. │ │  QR Scan │ │  Profile │ │  Leader- │ │
│  │  Screen  │ │   Feed   │ │  Camera  │ │ Dashboard│ │   board  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       └─────────────┴─────────────┴────────────┴────────────┘       │
│                                │                                    │
│                   ┌─────────┴──────────┐                           │
│                   │   Zustand + React  │                           │
│                   │  Query (TanStack)  │                           │
│                   └─────────┬──────────┘                           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                    HTTPS / WebSocket (Realtime)
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                       SUPABASE PLATFORM                             │
│                              │                                      │
│  ┌───────────┐  ┌──────────┴──────────┐  ┌───────────────────┐    │
│  │ Supabase  │  │   PostgreSQL DB     │  │  Edge Functions   │    │
│  │   Auth    │  │                     │  │                   │    │
│  │ • Email   │  │ • volunteers        │  │ • QR generator    │    │
│  │ • Google  │  │ • opportunities     │  │ • Priority algo   │    │
│  │ • Magic   │  │ • registrations     │  │ • Notifications   │    │
│  │   Link    │  │ • verifications     │  │ • Email sender    │    │
│  │           │  │ • points/badges     │  │ • Photo verify    │    │
│  └───────────┘  │ • activity_logs     │  └───────────────────┘    │
│                 │ • leaderboard_mv    │                            │
│                 └─────────────────────┘                            │
│                          │                                         │
│                 ┌────────┴────────┐                                │
│                 │ Supabase Storage│                                │
│                 │ (Photo proofs,  │                                │
│                 │  QR codes)      │                                │
│                 └─────────────────┘                                │
│                                                                    │
│                 ┌─────────────────┐                                │
│                 │ Supabase Realtime│                               │
│                 │ (Live feed,      │                               │
│                 │  notifications)  │                               │
│                 └─────────────────┘                                │
└────────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │  EXTERNAL SERVICES  │
                    │ • Resend (Email)    │
                    │ • Expo Push Server  │
                    │ • LinkedIn Share    │
                    └─────────────────────┘
```

### Architecture Decisions

- **Supabase Realtime** — When an admin posts a new opportunity, a Postgres trigger fires → Edge Function sends push notifications to all opted-in volunteers → Realtime channel updates the opportunity feed in the app instantly.
- **Row-Level Security (RLS)** — Volunteers can only read/write their own data. Admins have elevated access. No separate API layer needed.
- **Edge Functions for heavy logic** — The priority algorithm runs server-side in a Supabase Edge Function (Deno). Triggered when registration window closes. Returns ranked list to admin.
- **Materialised View for leaderboard** — `leaderboard_mv` is a Postgres materialized view refreshed every hour. Avoids expensive real-time aggregation queries on every leaderboard load.
- **Photo storage** — Uploaded to Supabase Storage with metadata (GPS, timestamp, event_id) stored in the verifications table. Storage bucket is private; photos are only accessible to the uploader and admins.
