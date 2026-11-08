# Development Roadmap

## Phase 1: Core (Days 1-3)

- Supabase project setup: tables, RLS policies, auth
- Expo project init, navigation structure, NativeWind setup
- Auth flow (sign up, login, profile, consent toggles)
- Opportunity listing (browse, search, filter)
- Register interest ("I'm In" button)
- Priority allocation algorithm (Edge Function)
- Admin: create opportunity, view registrations, approve allocation

## Phase 2: Verification (Days 4-5)

- QR code generation (TOTP-style rotating QR via Edge Function)
- QR scanner (check-in / check-out)
- In-app camera with GPS/timestamp embedding
- Peer confirmation flow (post-event prompt)
- Verification level calculation and points multiplier

## Phase 3: Gamification (Days 6-7)

- Points engine: calculate and award based on activity + verification
- Level progression with Lottie animations
- My Dashboard: progress ring, heatmap, impact card
- Leaderboard (with materialized view)
- Badges system
- Flexible streak tracking

## Phase 4: Polish (Days 8-9)

- Push notifications (Expo Push + Supabase triggers)
- Thank-you email (Resend + React Email template)
- LinkedIn share integration
- Admin reports: consistency tracker, employer org summary, availability calendar
- UI polish: transitions, haptic feedback, dark mode

## Phase 5: Demo Prep (Day 10)

- Seed dummy volunteer data (realistic scenarios)
- End-to-end demo flow: sign up → register → attend → verify → earn points → leaderboard
- Record demo video backup
- Presentation slides

---

## Hackathon Strategy

Phase 1 and 2 are non-negotiable — they form the core USP. Phase 3 makes it visually impressive for the demo. Phase 4 is polish that makes it feel production-ready. Phase 5 is the safety net. **If time runs short, cut from Phase 4 backwards.**
