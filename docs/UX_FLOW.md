# Key Screens & UX Flow

## Volunteer Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│              │    │              │    │                      │
│  Onboarding  │───►│  Home Feed   │───►│  Opportunity Detail  │
│  (Sign Up +  │    │  (Upcoming   │    │  (Type, Date, Slots, │
│   Consent)   │    │  Opps + Live │    │  Location, "I'm In") │
│              │    │   Activity)  │    │                      │
└──────────────┘    └──────┬───────┘    └──────────┬───────────┘
                           │                       │
                           │                  [Register]
                           │                       │
                           ▼                       ▼
                    ┌──────────────┐    ┌──────────────────────┐
                    │              │    │                      │
                    │ My Dashboard │    │  Selection Result    │
                    │  (Points,    │    │  (Selected /         │
                    │   Level,     │    │   Waitlisted)        │
                    │   Streak,    │    │                      │
                    │   Heatmap)   │    └──────────┬───────────┘
                    │              │               │
                    └──────┬───────┘          [Event Day]
                           │                       │
                           │                       ▼
                           │         ┌──────────────────────┐
                           │         │                      │
                           │         │    QR Check-in       │
                           │         │    (Scan → Attend →  │
                           │         │     Scan Out → Photo)│
                           │         │                      │
                           │         └──────────┬───────────┘
                           │                    │
                           │               [Post Event]
                           │                    │
                           │                    ▼
                           │         ┌──────────────────────┐
                           │         │                      │
                           │         │  Peer Confirmation   │
                           │         │  + Points Awarded    │
                           │         │  + LinkedIn Share    │
                           │         │                      │
                           │         └──────────────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │                  │
                    │   Leaderboard    │
                    │   (Monthly/All,  │
                    │    My Rank,      │
                    │    Filter by     │
                    │    Type)         │
                    │                  │
                    └──────────────────┘
```

---

## Key Screen Descriptions

### Home Feed
- Card-based opportunity feed (swipeable) — each card shows type tag, date, mode, slots remaining, time left to register
- Live activity ticker at top: "Kavitha just completed a school visit! +120 pts"
- Quick stats bar: your points, streak count, next level progress

### My Dashboard
- Animated progress ring: points toward next level
- GitHub-style heatmap calendar: volunteering days (light = low effort, dark = high effort)
- Impact card: "You've helped **12 students** across **5 events** totaling **18 verified hours**"
- Badge showcase (earned badges with animations, locked badges greyed out)
- Streak flame (animated, grows with streak length)

### QR Scanner
- Full-screen camera with QR overlay
- On successful scan: haptic feedback + success animation
- Shows: "Checked in at 10:02 AM. Enjoy the event! Scan again when leaving."

### Leaderboard
- Top 3 with profile photos on a podium (animated)
- Scrollable ranked list below
- "Your Position" card pinned at bottom if you're not in top 10
- Filter tabs: This Month / This Quarter / All Time / By Activity Type

### Tab Navigation

The app uses a bottom tab bar with 6 tabs:

| Tab | Screen | Description |
|---|---|---|
| Home | Home Feed | Upcoming opportunities + live activity |
| Explore | Browse/Search | Search and filter all opportunities |
| Impact | My Dashboard | Personal stats, heatmap, badges, streak |
| Leaders | Leaderboard | Rankings with filters |
| Alerts | Notifications | All push/in-app notifications |
| Profile | Settings/Profile | Edit profile, preferences, consent toggles |
