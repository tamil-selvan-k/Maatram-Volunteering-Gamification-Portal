# Gamification Design

## 1. Points Economy

Points are earned per verified activity, weighted by activity type and duration:

| Activity Type | Weight | Base Points / Hour | Example |
|---|---|---|---|
| Physical Events (panels, large events) | 6x | 60 pts/hr | 4-hour panel = 240 base pts |
| Physical Verifications (home visits) | 5x | 50 pts/hr | 2-hour home visit = 100 base pts |
| School Visits | 4x | 40 pts/hr | 3-hour school visit = 120 base pts |
| Office BG Works | 3x | 30 pts/hr | 2-hour office work = 60 base pts |
| Telephone Verifications | 2x | 20 pts/hr | 1-hour calls = 20 base pts |
| Other Small Works | 1x | 10 pts/hr | 1-hour data entry = 10 base pts |

### Points Formula

```
Final Points = Base Points × Verification Multiplier × Bonus Multiplier
```

### Bonus Multipliers (stackable)

- **First-time activity type:** +20% — encourages trying new things
- **Mentoring a new volunteer:** +15% — bring someone along
- **Weekend/holiday event:** +10% — recognise personal sacrifice
- **Streak bonus:** +5% per active streak month (capped at +25%)

---

## 2. Levels

Thematic progression tied to growth and community:

| Level | Name | Points Required | Perks |
|---|---|---|---|
| 1 | Seed | 0 | Basic profile, can browse & register |
| 2 | Sprout | 100 | Visible on leaderboard |
| 3 | Sapling | 300 | Can peer-verify others |
| 4 | Tree | 600 | Priority boost for preferred activities |
| 5 | Grove | 1,000 | Can mentor newcomers (+15% bonus) |
| 6 | Forest | 1,800 | Featured on monthly spotlight |
| 7 | Banyan | 3,000 | Legacy badge, community elder status |

---

## 3. Flexible Streaks

### Why flexible?

Volunteering opportunities don't come every day. A daily streak punishes volunteers for something outside their control. Our streaks track engagement across **opportunity windows**, not calendar days.

### How streaks work

- An **opportunity window** = any period when at least one opportunity is open for registration
- If there are active opportunities and you **register interest in at least one** → your streak continues
- If there are active opportunities and you **ignore all of them** → streak breaks after a grace period (7 days of open opportunities with no registration)
- If there are **no active opportunities** → streak is frozen (no penalty, no gain)
- **Participation streak** (harder): You actually completed a verified activity within the last 30 days. This is the one displayed prominently.

### Streak display

Flame icon with a counter. Grows in visual intensity with streak length:
- At 3+ months: animated flame
- At 6+ months: golden flame

---

## 4. Badges

| Badge | Criteria |
|---|---|
| First Step | Complete your first verified activity |
| School Champion | Complete 5 school visits |
| Interview Pro | Complete 10 mock interviews |
| Verification Ace | Complete 15 telephone/physical verifications |
| All-Rounder | Complete at least 1 of every activity type |
| Consistent | Maintain a 3-month participation streak |
| Mentor | Bring in and mentor a new volunteer who completes 3 activities |
| 100% Show-Up | 10+ events with 100% attendance rate (no no-shows) |
| Gold Standard | 10 activities with full verification (QR + photo + peer) |
