# Maatram Volunteering Gamification Portal — HackForge Proposal

**MH26-02 · SOFTWARE TRACK**
**Team: SoDak Technology | Problem Statement: MH26-02**

---

## 1. The Idea & Problem

Maatram Foundation depends on volunteers — students, alumni, and supporters — who help with school visits, admissions, background verification (BGV), mock interviews, and admission panel interviews. Today, tracking who is helping, how much, and who is drifting away is nearly impossible.

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

## 3. Feature Breakdown

| Feature | User | Priority | Description |
|---------|------|----------|-------------|
| Sign Up / Profile | Volunteer | MUST | Register with name, email, phone, role (student/alumni/supporter), employer org, preferences, consent toggles |
| Opportunity Listing | All | MUST | Browse upcoming opportunities — type, date, mode (online/offline), location, available slots, registration deadline |
| Register Interest | Volunteer | MUST | One-tap "I'm In" for any opportunity. Enters the priority queue. No first-come advantage. |
| Priority Allocation | System | MUST | After registration window closes, algorithm ranks applicants and assigns slots. Admin can override. |
| QR Check-in/out | Volunteer | MUST | Scan rotating QR at event start and end. Auto-calculates verified hours. |
| Photo Proof | Volunteer | MUST | In-app camera capture with auto-embedded GPS + timestamp. Can't pick from gallery. |
| Peer Confirmation | Volunteer | MUST | Post-event, attendees confirm each other's presence. 2+ confirms = auto-verified. |
| Points & Levels | Volunteer | MUST | Earn weighted points per verified activity. Level up through tiers. |
| Leaderboard | All | MUST | Monthly / quarterly / all-time. Filter by activity type, role, organisation. |
| Streaks | Volunteer | SHOULD | Flexible streaks: participate or register in opportunity windows. Not daily. |
| Badges | Volunteer | SHOULD | Milestone badges: "First School Visit", "Mock Pro (10+)", "All-Rounder", "Mentor" |
| Push Notifications | Volunteer | MUST | Instant alerts when new opportunities are posted, when selected, reminders before events. |
| Thank You Email | System | SHOULD | Auto-send personalised thank-you after verified participation. |
| LinkedIn Share | Volunteer | SHOULD | Ready-to-share LinkedIn post with volunteer's impact stats. |
| Admin Dashboard | Admin | MUST | Create events, approve/reject registrations, verify hours, view reports. |
| Reports | Admin | SHOULD | Volunteer activity, consistency tracking, dormant volunteer alerts, employer org summaries. |
| Consent Management | Volunteer | MUST | Opt-in for notifications, emails, LinkedIn posts. Data collected only for portal purposes. |

---

## 4. Tech Stack

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| Mobile App | React Native (Expo) | Single codebase for Android + iOS. Expo gives fast iteration, OTA updates, push notifications, and camera/location APIs. |
| Navigation | React Navigation v7 | Native stack navigator with shared element transitions. |
| Animations | React Native Reanimated 3 + Moti | 60fps animations on the UI thread. Critical for gamification feel. |
| UI Components | NativeWind (Tailwind for RN) | Rapid styling, consistent design system, responsive. |
| Backend + Database | Supabase (PostgreSQL) | Auth, Realtime subscriptions, Row-Level Security, Edge Functions, Storage. |
| Auth | Supabase Auth (Email + Google OAuth) | Built-in, zero config. Supports magic links. |
| Push Notifications | Expo Notifications + Supabase Edge Functions | Expo handles device tokens. Edge Functions trigger notifications. |
| Email | Resend | Simple API, free tier (100 emails/day), React Email for templating. |
| QR Generation | Custom TOTP-like QR (Edge Function) | Server generates time-rotating QR codes. Client scans with expo-camera. |
| LinkedIn Sharing | LinkedIn Share URL API | Pre-filled post via URL params — no OAuth complexity. |
| State Management | Zustand + React Query (TanStack) | Zustand for local state. React Query for server state. |
| Charts/Viz | Victory Native | Animated charts for the dashboard. |
| Lottie Animations | lottie-react-native | Pre-built animation files for level-ups, confetti, badge unlocks. |

---

## 5. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native / Expo)                  │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Auth    │ │  Opport. │ │ QR Scan  │ │ Profile  │ │ Leader-  │ │
│  │  Screen  │ │  Feed    │ │ Camera   │ │ Dashboard│ │ board    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       └─────────────┴─────────────┴────────────┴────────────┘       │
│                              │                                      │
│                   ┌─────────┴──────────┐                            │
│                   │  Zustand + React   │                            │
│                   │  Query (TanStack)  │                            │
│                   └─────────┬──────────┘                            │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                    HTTPS / WebSocket (Realtime)
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                     SUPABASE PLATFORM                               │
│                              │                                      │
│  ┌───────────┐  ┌──────────┴──────────┐  ┌───────────────────┐     │
│  │ Supabase  │  │   PostgreSQL DB     │  │  Edge Functions   │     │
│  │ Auth      │  │                     │  │                   │     │
│  │ • Email   │  │ • volunteers        │  │ • QR generator    │     │
│  │ • Google  │  │ • opportunities     │  │ • Priority algo   │     │
│  │ • Magic   │  │ • registrations     │  │ • Notifications   │     │
│  │   Link    │  │ • verifications     │  │ • Email sender    │     │
│  │           │  │ • points/badges     │  │ • Photo verify    │     │
│  └───────────┘  │ • activity_logs     │  └───────────────────┘     │
│                 │ • leaderboard_mv    │                             │
│                 └─────────────────────┘                             │
│                                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐                  │
│  │  Supabase Storage   │  │  Supabase Realtime   │                 │
│  │  (Photo proofs,     │  │  (Live feed,         │                 │
│  │   QR codes)         │  │   notifications)     │                 │
│  └─────────────────────┘  └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │  EXTERNAL SERVICES  │
                    │  • Resend (Email)   │
                    │  • Expo Push Server │
                    │  • LinkedIn Share   │
                    └─────────────────────┘
```

### Architecture Decisions

- **Supabase Realtime** — When an admin posts a new opportunity, a Postgres trigger fires → Edge Function sends push notifications → Realtime channel updates the feed instantly.
- **Row-Level Security (RLS)** — Volunteers can only read/write their own data. Admins have elevated access.
- **Edge Functions for heavy logic** — Priority algorithm runs server-side in Deno. Triggered when registration window closes.
- **Materialised View for leaderboard** — `leaderboard_mv` refreshed every hour. Avoids expensive real-time aggregation.
- **Photo storage** — Uploaded to Supabase Storage with metadata (GPS, timestamp, event_id). Private bucket.

---

## 6. Volunteering Verification System

### Trust Pyramid

```
        ┌─────────────┐
        │    Admin     │  ← Final authority. Can override anything.
      ┌─┴─────────────┴─┐
      │      Peer       │  ← 2+ co-volunteers confirm attendance
    ┌─┴─────────────────┴─┐
    │     Automated       │  ← QR scan, GPS, in-app camera
  ┌─┴─────────────────────┴─┐
  │     Self-Report         │  ← Lowest trust. Reduced points.
  └─────────────────────────┘
```

Higher layers override lower. Points multiply with verification level.

### Verification Methods

#### QR Check-in / Check-out
- **For:** All physical events
- **How:** QR rotates every 5 minutes (TOTP-style — encodes `event_id + HMAC(secret, floor(time/300))`). Volunteer scans on arrival and departure. GPS + timestamp recorded.
- **Anti-gaming:** QR rotates, GPS within 500m, device ID logged.
- **Duration:** `checkout_time - checkin_time`. Forgot checkout → capped at scheduled end time.

#### In-App Photo Proof
- **For:** School visits, presentations, physical events
- **How:** In-app camera only (not gallery). Auto-embeds GPS, timestamp, device ID, event_id.
- **Anti-gaming:** Gallery blocked, EXIF stripped/re-embedded, perceptual hash for duplicate detection.

#### Peer Cross-Confirmation
- **For:** All activity types
- **How:** Post-event, attendees confirm each other's presence. 2+ confirms = auto-verified.
- **Anti-gaming:** Requires multiple colluding accounts. Combined with QR/GPS data, detectable.

### Verification Score → Points Multiplier

| Verification Level | Multiplier | Meaning |
|---|---|---|
| Self-reported only | 0.5x | Claimed but no proof. |
| Photo proof (pending review) | 0.7x | Photo submitted, awaiting approval. |
| QR check-in only (no checkout) | 0.7x | Arrived but didn't scan out. |
| Peer confirmed (1 peer) | 0.8x | One other volunteer confirmed presence. |
| QR check-in + check-out | 1.0x | Full verified attendance. |
| QR + Peer confirmed (2+) | 1.1x | System and community verified. |
| QR + Photo + Peer + Admin approved | 1.25x | Gold standard. All layers confirmed. |

**Design Principle:** Never block a volunteer from logging work. Always let them self-report. But verified hours are worth more.

---

## 7. Gamification Design

### 7.1 Points Economy

| Activity Type | Weight | Base Points/Hour | Example |
|---|---|---|---|
| Physical Events (panels, large events) | 6x | 60 pts/hr | 4-hour panel = 240 base pts |
| Physical Verifications (home visits) | 5x | 50 pts/hr | 2-hour home visit = 100 base pts |
| School Visits | 4x | 40 pts/hr | 3-hour school visit = 120 base pts |
| Office BG Works | 3x | 30 pts/hr | 2-hour office work = 60 base pts |
| Telephone Verifications | 2x | 20 pts/hr | 1-hour calls = 20 base pts |
| Other Small Works | 1x | 10 pts/hr | 1-hour data entry = 10 base pts |

**Final Points = Base Points × Verification Multiplier × Bonus Multiplier**

Bonus multipliers (stackable):
- **First-time activity type:** +20%
- **Mentoring a new volunteer:** +15%
- **Weekend/holiday event:** +10%
- **Streak bonus:** +5% per active streak month (capped at +25%)

### 7.2 Levels

| Level | Name | Points Required | Perks |
|---|---|---|---|
| 1 | Seed | 0 | Basic profile, can browse & register |
| 2 | Sprout | 100 | Visible on leaderboard |
| 3 | Sapling | 300 | Can peer-verify others |
| 4 | Tree | 600 | Priority boost for preferred activities |
| 5 | Grove | 1,000 | Can mentor newcomers (+15% bonus) |
| 6 | Forest | 1,800 | Featured on monthly spotlight |
| 7 | Banyan | 3,000 | Legacy badge, community elder status |

### 7.3 Flexible Streaks

- An **opportunity window** = any period when at least one opportunity is open for registration
- Active opportunities + register interest in at least one → streak continues
- Active opportunities + ignore all → streak breaks after 7 days grace period
- No active opportunities → streak is frozen (no penalty, no gain)
- **Participation streak** (harder): Completed a verified activity within the last 30 days

**Streak display:** Flame icon with counter. 3+ months: animated flame. 6+ months: golden flame.

### 7.4 Badges

| Badge | Criteria |
|---|---|
| First Step | Complete your first verified activity |
| School Champion | Complete 5 school visits |
| Interview Pro | Complete 10 mock interviews |
| Verification Ace | Complete 15 telephone/physical verifications |
| All-Rounder | Complete at least 1 of every activity type |
| Consistent | Maintain a 3-month participation streak |
| Mentor | Bring in and mentor a new volunteer who completes 3 activities |
| 100% Show-Up | 10+ events with 100% attendance rate |
| Gold Standard | 10 activities with full verification (QR + photo + peer) |

---

## 8. Priority Allocation Algorithm

The algorithm determines which volunteers receive opportunities when demand exceeds supply. It replaces first-come-first-served with a **fairness-weighted priority system**.

### 8.1 Activity Weight Hierarchy

| Tier | Activity Type | Weight (W) |
|---|---|---|
| T1 | Physical Events | 6 |
| T2 | Physical Verifications | 5 |
| T3 | School Visits | 4 |
| T4 | Office BG Works | 3 |
| T5 | Telephone Verifications | 2 |
| T6 | Other Small Works | 1 |

### 8.2 Score Components

```
Priority Score = N_score + D_score + R_score + F_score + L_score + P_score

Where:
  N_score = Newcomer Boost       (0 to 100)
  D_score = Opportunity Diversity (0 to 90)
  R_score = Recency Fairness     (0 to 80)
  F_score = Waitlist Frustration  (0 to 60)
  L_score = Reliability           (-50 to 20)
  P_score = Preference Match      (0 to 25)

Theoretical range: -50 to 375
Practical range for active volunteers: 20 to 250
```

#### A. Newcomer Boost (N_score)
```
if total_activities == 0:     N_score = 100
elif total_activities <= 3:   N_score = 80 - (total_activities * 15)
else:                         N_score = 0
```

#### B. Opportunity Diversity Gap (D_score)
```
avg_past_weight = sum(weight of each past activity) / total_activities
diversity_gap = max(0, opp_weight - avg_past_weight)
D_score = diversity_gap * 15    # Scale: 0 to 90
```

#### C. Recency Fairness (R_score)
```
R_score = min(days_since_last / 90, 1.0) * 80
# Capped at 90 days
```

#### D. Waitlist Frustration Bonus (F_score)
```
F_score = min(consecutive_rejections * 12, 60)
```

#### E. Reliability Score (L_score)
```
reliability_rate = times_completed / times_selected
if rate >= 0.9:  L_score = 20
elif rate >= 0.7: L_score = 0
elif rate >= 0.5: L_score = -20
else:             L_score = -50
```

#### F. Preference & Skills Match (P_score)
```
P_score = (preference_match * 10) + (skills_match * 15)   # Range: 0 to 25
```

### 8.3 Tie-breaking Rule
1. Higher consecutive_rejections
2. Fewer total_activities
3. Earlier registration date
4. Random

### 8.4 Constants
```typescript
const ACTIVITY_WEIGHTS = {
  'physical_event': 6,
  'physical_verification': 5,
  'school_visit': 4,
  'office_bg_work': 3,
  'tele_verification': 2,
  'other_small_work': 1,
}

const NEWCOMER_THRESHOLD = 3
const RECENCY_CAP_DAYS = 90
const MAX_FRUSTRATION_BONUS = 60
const FRUSTRATION_PER_REJECT = 12
const DIVERSITY_MULTIPLIER = 15
const RECENCY_MAX_SCORE = 80
const CANCEL_CUTOFF_HOURS = 48
```

---

## 9. Notification System

| Trigger | Channel | Content | Timing |
|---|---|---|---|
| New opportunity posted | Push + In-app | Opportunity details, registration deadline | Immediate |
| Selected for opportunity | Push + Email | Confirmation, event details, prep info | After allocation |
| Waitlisted | Push | Position on waitlist, next steps | After allocation |
| Event reminder | Push | "Your school visit is tomorrow at 10 AM" | 24h + 1h before |
| Peer confirmation request | Push | "Confirm who attended today's event" | 1h after event end |
| Points awarded | In-app | "+120 points! You're now level Sapling" | After verification |
| Streak milestone | Push + In-app | "3-month streak! Consistent badge earned" | On milestone |
| Inactivity nudge | Push | "3 opportunities match your preferences" | After 30 days inactive |
| Thank you | Email | Personalised note + impact summary | After event verification |
| LinkedIn share | In-app | Ready-to-share post with impact stats | After thank-you email |

**Consent first:** All notifications require explicit opt-in during onboarding. Toggleable per channel and type.

---

## 10. Admin & Office Team Features

### Admin Dashboard
- **Event Creation Wizard:** Type, date/time, location (with map pin), mode, slots, required skills, registration deadline
- **Approval Queue:** Ranked list with priority scores. Admin can approve or drag-and-drop override.
- **Verification Review:** Pending photo proofs, disputed check-ins, self-reported hours
- **Do Not Contact List:** Flag volunteers excluded from notifications and allocations

### Reports

| Report | What It Shows |
|---|---|
| Volunteer Activity Summary | Events attended, hours, points, verification rate, streak status |
| Consistency Tracker | Active (green), declining (yellow), dormant 60+ days (red) |
| Student vs. Alumni Breakdown | Volunteering split by role |
| Availability Calendar | Heat map by day-of-week and time |
| Employer Organisation Summary | "TCS: 8 people, 120 hours this quarter." Exportable PDF. |
| Leaderboard Report | Top contributors, filterable by time period and activity type |

---

## 11. Key Screens & UX Flow

### Volunteer Flow
```
Onboarding → Home Feed → Opportunity Detail → Register
                ↓                                  ↓
          My Dashboard              Selection Result (Selected/Waitlisted)
                ↓                                  ↓
          Leaderboard                    QR Check-in → Photo → Peer Confirm
                                                   ↓
                                         Points Awarded + LinkedIn Share
```

### Key Screen Descriptions

- **Home Feed:** Card-based opportunity feed, live activity ticker, quick stats bar
- **My Dashboard:** Progress ring, GitHub-style heatmap, impact card, badge showcase, streak flame
- **QR Scanner:** Full-screen camera with QR overlay, haptic feedback on success
- **Leaderboard:** Top 3 podium (animated), scrollable ranked list, "Your Position" card, filter tabs

---

## 12. Data Model

### Core Tables

```sql
volunteers (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('student', 'alumni', 'supporter')),
  employer_org TEXT,
  preferences TEXT[],
  skills TEXT[],
  consent_push BOOLEAN DEFAULT FALSE,
  consent_email BOOLEAN DEFAULT FALSE,
  consent_linkedin BOOLEAN DEFAULT FALSE,
  reliability_score FLOAT DEFAULT 1.0,
  total_points INT DEFAULT 0,
  level INT DEFAULT 1,
  streak_months INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  do_not_contact BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE
);

opportunities (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('online', 'offline')),
  location TEXT,
  location_lat FLOAT, location_lng FLOAT,
  event_date TIMESTAMPTZ NOT NULL,
  duration_hours FLOAT,
  total_slots INT NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'open',
  qr_secret TEXT,
  created_by UUID REFERENCES volunteers(id)
);

registrations (
  id UUID PRIMARY KEY,
  volunteer_id UUID REFERENCES volunteers(id),
  opportunity_id UUID REFERENCES opportunities(id),
  priority_score FLOAT,
  status TEXT DEFAULT 'registered',
  waitlist_position INT,
  UNIQUE(volunteer_id, opportunity_id)
);

verifications (
  id UUID PRIMARY KEY,
  registration_id UUID REFERENCES registrations(id),
  checkin_time TIMESTAMPTZ, checkout_time TIMESTAMPTZ,
  checkin_gps POINT, checkout_gps POINT,
  photo_url TEXT, photo_gps POINT, photo_timestamp TIMESTAMPTZ,
  peer_confirms INT DEFAULT 0,
  verification_level TEXT DEFAULT 'self_report',
  verified_hours FLOAT,
  points_awarded INT,
  admin_approved BOOLEAN DEFAULT FALSE
);

peer_confirmations (
  confirmer_id UUID REFERENCES volunteers(id),
  confirmed_id UUID REFERENCES volunteers(id),
  opportunity_id UUID REFERENCES opportunities(id),
  UNIQUE(confirmer_id, confirmed_id, opportunity_id)
);

points_log (
  volunteer_id UUID, opportunity_id UUID,
  base_points INT, verification_multiplier FLOAT,
  bonus_multiplier FLOAT, final_points INT, reason TEXT
);

badges (volunteer_id UUID, badge_type TEXT, badge_name TEXT, earned_at TIMESTAMPTZ);
notifications (volunteer_id UUID, type TEXT, title TEXT, body TEXT, channel TEXT, read BOOLEAN);
```

### Leaderboard Materialised View
```sql
CREATE MATERIALIZED VIEW leaderboard_mv AS
SELECT v.id, v.full_name, v.role, v.employer_org, v.total_points,
       v.level, v.streak_months,
       COUNT(DISTINCT ver.id) AS total_events,
       COALESCE(SUM(ver.verified_hours), 0) AS total_hours,
       RANK() OVER (ORDER BY v.total_points DESC) AS rank
FROM volunteers v
LEFT JOIN registrations r ON r.volunteer_id = v.id AND r.status = 'selected'
LEFT JOIN verifications ver ON ver.registration_id = r.id
WHERE v.is_active = TRUE
GROUP BY v.id
ORDER BY v.total_points DESC;
```

---

## 13. Development Roadmap

### Phase 1: Core (Days 1–3)
- Supabase project setup: tables, RLS policies, auth
- Expo project init, navigation structure, NativeWind setup
- Auth flow (sign up, login, profile, consent toggles)
- Opportunity listing (browse, search, filter)
- Register interest ("I'm In" button)
- Priority allocation algorithm (Edge Function)
- Admin: create opportunity, view registrations, approve allocation

### Phase 2: Verification (Days 4–5)
- QR code generation (TOTP-style rotating QR via Edge Function)
- QR scanner (check-in / check-out)
- In-app camera with GPS/timestamp embedding
- Peer confirmation flow (post-event prompt)
- Verification level calculation and points multiplier

### Phase 3: Gamification (Days 6–7)
- Points engine: calculate and award based on activity + verification
- Level progression with Lottie animations
- My Dashboard: progress ring, heatmap, impact card
- Leaderboard (with materialized view)
- Badges system
- Flexible streak tracking

### Phase 4: Polish (Days 8–9)
- Push notifications (Expo Push + Supabase triggers)
- Thank-you email (Resend + React Email template)
- LinkedIn share integration
- Admin reports: consistency tracker, employer org summary, availability calendar
- UI polish: transitions, haptic feedback, dark mode

### Phase 5: Demo Prep (Day 10)
- Seed dummy volunteer data (realistic scenarios)
- End-to-end demo flow: sign up → register → attend → verify → earn points → leaderboard
- Record demo video backup
- Presentation slides

**Hackathon Strategy:** Phase 1 and 2 are non-negotiable — they form the core USP. Phase 3 makes it visually impressive. Phase 4 is polish. Phase 5 is the safety net. Cut from Phase 4 backwards if time runs short.
