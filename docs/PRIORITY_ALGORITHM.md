# Priority Allocation Algorithm

The algorithm determines which volunteers receive opportunities when demand exceeds supply. It replaces first-come-first-served with a **fairness-weighted priority system** that pulls in newcomers, rewards consistency, and ensures everyone gets a chance at impactful work.

**Core Principle:** Opportunities are not given to whoever clicks first. When an opportunity is posted, all volunteers are notified. They register interest within a defined window. Once the window closes, the algorithm ranks all applicants by priority score and assigns slots top-down.

---

## 1. Activity Weight Hierarchy

| Tier | Activity Type | Weight (W) | Examples |
|---|---|---|---|
| T1 | Physical Events | 6 | Admission panel interviews, large outreach events, campus drives |
| T2 | Physical Verifications | 5 | Home visits for student background verification |
| T3 | School Visits | 4 | School talks, presentations, awareness sessions |
| T4 | Office BG Works | 3 | Office-based background verification, document processing |
| T5 | Telephone Verifications | 2 | Phone calls for student/family verification |
| T6 | Other Small Works | 1 | Data entry, minor online tasks, email follow-ups |

---

## 2. Score Components

The priority score is computed from **six independent components**. Each component addresses a specific fairness concern. They are combined into a single score using weighted addition.

### A. Newcomer Boost (N_score)

New volunteers with zero or very few contributions receive maximum priority. The boost decays as they complete activities, handing the advantage to the next newcomer.

```
total_activities = count of all completed, verified activities by this volunteer

if total_activities == 0:
    N_score = 100           # Never volunteered — absolute top priority
elif total_activities <= 3:
    N_score = 80 - (total_activities * 15)
    # 1 activity  → 65
    # 2 activities → 50
    # 3 activities → 35
else:
    N_score = 0             # No longer a newcomer
```

*Why it matters:* Without this, newcomers never break into a system dominated by experienced volunteers. The steep decay (100 → 0 in just 4 activities) ensures the boost is a launchpad, not a permanent advantage.

### B. Opportunity Diversity Gap (D_score)

Measures how impactful the volunteer's past work has been. Someone who has only done low-weight tasks (tele verifications, data entry) deserves a shot at high-impact opportunities before someone who has already done school visits and physical events.

```
# Average weight of the volunteer's past activities
if total_activities == 0:
    avg_past_weight = 0
else:
    avg_past_weight = sum(weight of each past activity) / total_activities

# Weight of the opportunity being applied for
opp_weight = weight of the current opportunity (from tier table)

# The gap: how much MORE impactful this opportunity is compared to their history
diversity_gap = max(0, opp_weight - avg_past_weight)

D_score = diversity_gap * 15
# Scale: 0 to 90 (max gap is 6 - 0 = 6, so 6 * 15 = 90)
```

**Example:** Kavitha has done 4 telephone verifications (weight 2 each). Her avg_past_weight = 2.0. She applies for a Physical Event (weight 6). Her diversity_gap = 6 - 2 = 4. D_score = 4 × 15 = **60**.

**Example:** Ravi has done 3 school visits (weight 4 each). His avg_past_weight = 4.0. He applies for the same Physical Event. His diversity_gap = 6 - 4 = 2. D_score = 2 × 15 = **30**. Kavitha ranks higher even though Ravi applied first.

### C. Recency Fairness (R_score)

Volunteers who haven't been given an opportunity recently should get priority. Prevents the same active group from monopolising all slots.

```
days_since_last = number of days since the volunteer's last completed activity
                  (if never volunteered, use days since registration, capped at 90)

R_score = min(days_since_last / 90, 1.0) * 80
# Scales linearly from 0 (volunteered today) to 80 (90+ days ago)
# Capped at 90 days to prevent infinite accumulation
```

*Why cap at 90 days:* Beyond 3 months of inactivity, additional days don't meaningfully change the picture. The cap prevents someone who registered a year ago and never participated from permanently outranking active volunteers.

### D. Waitlist Frustration Bonus (F_score)

If a volunteer keeps registering but doesn't get selected, their frustration score accumulates. Ensures persistent applicants eventually rise to the top.

```
consecutive_rejections = number of consecutive times the volunteer registered
                         but was not selected (resets to 0 on selection + completion)

F_score = min(consecutive_rejections * 12, 60)
# 1 rejection  → 12
# 2 rejections → 24
# 3 rejections → 36
# 4 rejections → 48
# 5+ rejections → 60 (capped)
```

*Why it matters:* Without this, a volunteer could register 10 times and never get picked. The frustration bonus guarantees they eventually break through. Resets on selection to prevent gaming.

### E. Reliability Score (L_score)

Rewards volunteers who show up when selected. Penalises no-shows. This is the **only negative component**.

```
times_selected  = total times this volunteer was allocated an opportunity
times_completed = total times they actually showed up and completed it

if times_selected == 0:
    reliability_rate = 1.0      # Benefit of the doubt for newcomers
else:
    reliability_rate = times_completed / times_selected

if   reliability_rate >= 0.9:  L_score =  20   # Highly reliable
elif reliability_rate >= 0.7:  L_score =   0   # Acceptable
elif reliability_rate >= 0.5:  L_score = -20   # Concerning
else:                          L_score = -50   # Unreliable
```

*Note:* Newcomers get reliability_rate = 1.0 (benefit of doubt). A single no-show from a volunteer with 1 selection drops them to 0.0 and a -50 penalty — harsh but fair, since that slot could have gone to someone else.

### F. Preference & Skills Match (P_score)

Volunteers specify preferred activity types and skills in their profile. Opportunities can request specific skills.

```
preference_match = 1 if opportunity type is in volunteer's preferred list, else 0
skills_match     = matched required skills / total required skills
                   (if no skills required, skills_match = 1)

P_score = (preference_match * 10) + (skills_match * 15)
# Range: 0 to 25
```

*Why low weight:* Preference matching is a tiebreaker, not a gatekeeper. Fairness should never lose to preference.

---

## 3. Combined Formula

```
Priority Score = N_score + D_score + R_score + F_score + L_score + P_score

Where:
  N_score = Newcomer Boost       (0 to 100)
  D_score = Opportunity Diversity (0 to 90)
  R_score = Recency Fairness     (0 to 80)
  F_score = Waitlist Frustration  (0 to 60)
  L_score = Reliability          (-50 to 20)
  P_score = Preference Match     (0 to 25)

Theoretical range: -50 to 375
Practical range for active volunteers: 20 to 250
```

**Why additive (not multiplicative):** Multiplicative scoring means a zero in any component kills the total. A newcomer with 0 past activities would get 0 diversity score and 0 recency — their newcomer boost would be neutralised. Additive ensures each dimension contributes independently.

### Tie-breaking rule

If two volunteers have the same priority score (within ±1 point), break ties in this order:

1. Higher `consecutive_rejections` (they've waited longer)
2. Fewer `total_activities` (less experienced gets the chance)
3. Earlier registration date (longer-tenured member)
4. Random (true randomness as final tiebreaker — no deterministic bias)

---

## 4. Worked Examples

**Scenario:** A Physical Event (Admission Panel Interview, weight 6) is posted. 3 slots available. 5 volunteers register interest.

### Volunteer 1: Ananya (Brand new — registered 10 days ago, zero activities)

```
N_score = 100  (zero activities → full newcomer boost)
D_score = max(0, 6 - 0) * 15 = 90  (avg_past_weight = 0, opp_weight = 6)
R_score = min(10/90, 1.0) * 80 = 8.9  (10 days since registration)
F_score = 0  (never applied before)
L_score = 20  (reliability = 1.0, benefit of doubt)
P_score = 10 + 15 = 25  (prefers physical events, has all required skills)

Total = 100 + 90 + 8.9 + 0 + 20 + 25 = 243.9
```

### Volunteer 2: Deepak (4 telephone verifications, last activity 20 days ago, 2 consecutive rejections)

```
N_score = 0  (4 activities → no longer a newcomer)
D_score = max(0, 6 - 2.0) * 15 = 60  (avg weight = (2+2+2+2)/4 = 2.0)
R_score = min(20/90, 1.0) * 80 = 17.8  (20 days since last activity)
F_score = min(2 * 12, 60) = 24  (2 consecutive rejections)
L_score = 20  (4/4 completed = 1.0 reliability)
P_score = 10 + 15 = 25  (prefers this type, has skills)

Total = 0 + 60 + 17.8 + 24 + 20 + 25 = 146.8
```

### Volunteer 3: Ravi (3 school visits, last activity 15 days ago, no rejections — he applied first)

```
N_score = 0  (3 activities → no longer a newcomer)
D_score = max(0, 6 - 4.0) * 15 = 30  (avg weight = (4+4+4)/3 = 4.0)
R_score = min(15/90, 1.0) * 80 = 13.3  (15 days since last)
F_score = 0  (no rejections)
L_score = 20  (3/3 completed = 1.0 reliability)
P_score = 0 + 15 = 15  (doesn't prefer this type, but has skills)

Total = 0 + 30 + 13.3 + 0 + 20 + 15 = 78.3
```

### Volunteer 4: Priya (Veteran, 12 activities across all types, last activity 100 days ago — returning)

```
N_score = 0  (12 activities)
D_score = max(0, 6 - 3.5) * 15 = 37.5  (avg weight = 3.5 across mixed activities)
R_score = min(100/90, 1.0) * 80 = 80  (capped at 90 days → full 80 points)
F_score = 0  (hasn't applied recently)
L_score = 20  (11/12 completed = 0.917 → >= 0.9 → +20)
P_score = 10 + 15 = 25  (prefers this, has skills)

Total = 0 + 37.5 + 80 + 0 + 20 + 25 = 162.5
```

### Volunteer 5: Suresh (2 activities, no-showed once, last activity 40 days ago, 3 consecutive rejections)

```
N_score = 0  (2 completed, but 3 selections total → not newcomer)
D_score = max(0, 6 - 1.5) * 15 = 67.5  (avg weight = (2+1)/2 = 1.5)
R_score = min(40/90, 1.0) * 80 = 35.6  (40 days idle)
F_score = min(3 * 12, 60) = 36  (3 consecutive rejections)
L_score = -20  (2/3 completed = 0.67 → moderate penalty)
P_score = 10 + 0 = 10  (prefers this type, but missing required skills)

Total = 0 + 67.5 + 35.6 + 36 + (-20) + 10 = 129.1
```

### Final Ranking (3 slots available)

| Rank | Volunteer | Score | Outcome | Key Factor |
|---|---|---|---|---|
| 1 | Ananya | 243.9 | **SELECTED** | Newcomer boost dominates |
| 2 | Priya | 162.5 | **SELECTED** | Returning veteran — recency score maxed |
| 3 | Deepak | 146.8 | **SELECTED** | Low-weight history → high diversity gap + frustration |
| 4 | Suresh | 129.1 | **WAITLISTED** | No-show penalty dragged score down |
| 5 | Ravi | 78.3 | **NOT SELECTED** | Already has high-weight experience, FCFS doesn't apply |

**Key takeaway:** Ravi applied first but ranked last — because he already has high-weight experience (school visits), his diversity gap is small, he volunteered recently, and he has no frustration bonus. Deepak, who only did telephone verifications, ranked above Ravi because the algorithm recognised he deserves a chance at more impactful work. Ananya, the newcomer, got top priority as intended. This is the algorithm working exactly as designed — **opportunity for all**.

---

## 5. Edge Case Handling

| Edge Case | How It's Handled | Rationale |
|---|---|---|
| Brand new vs. active veteran | Newcomer gets N=100 + full D_score (avg_past_weight=0 → max gap). Almost always outranks a veteran. | Retention depends on newcomers getting their first experience quickly. A veteran missing one opportunity is mildly inconvenienced; a newcomer who is never picked leaves forever. |
| Two veterans, different activity mixes | Lower avg_past_weight → higher D_score. 4 tele-verifications (avg 2.0) outranks 3 school visits (avg 4.0) for a Physical Event. | Fulfils "opportunity for all" — you shouldn't be stuck doing phone calls forever. |
| Always signs up, never picked | F_score accumulates: +12 per rejection, capped at 60. After 5 consecutive rejections, nearly guarantees selection. | The frustration bonus is a pressure valve preventing permanent exclusion. |
| Got picked but no-showed | L_score drops to -20 or -50 depending on severity. Single no-show with 1 selection → reliability 0.0 → -50. Softens with history. | A no-show wastes a slot someone else wanted. Proportional penalty — one mistake in long history is forgiven, patterns are punished. |
| Tied scores | Four-level tiebreaker: (1) more rejections, (2) fewer total activities, (3) earlier registration date, (4) random. | Each level favours the more deserving. Random eliminates systematic bias. |
| More slots than applicants | All applicants selected. Remaining slots marked "open" and second notification round sent. | Slots shouldn't go empty. Second notification creates urgency. |
| Returning veteran (months inactive) | R_score caps at 80 (at 90+ days). Reliability history preserved. No newcomer boost since they have past activities. | Returning volunteers are valuable — they know the process. Their proven track record is an advantage newcomers don't have. |
| Multiple consecutive rejections | F_score grows 12/rejection. At 5 rejections (F=60), the single largest non-newcomer component. Practically guarantees selection. | "I keep trying and nothing happens" is the #1 reason volunteers leave. This is the safety net. |
| Seasonal volunteers | R_score caps at 90 days — 6-month absence = same boost as 3-month. Past reliability preserved. No account expiry. | Seasonal volunteering is legitimate. System treats return as positive, not penalty. |
| Preferences vs. requirements | P_score is small bonus (max 25), not a gate. Hard skill requirements are a pre-filter — you don't enter ranking without them. | Soft preferences influence; hard requirements filter. Keeps algorithm fair while meeting operational needs. |
| Late cancellation / gaming | Cancel before 48hr cutoff = free, slot to waitlist. Cancel after cutoff = counts as no-show. | Life happens — early cancellation shouldn't punish. Last-minute dropouts waste the slot. |
| Multiple newcomers competing | All get N=100, identical D and L. Differentiated by R_score (who registered earlier), P_score, then random. | Among equals, the most eager goes first — but randomness ensures no systematic bias. |

---

## 6. Score Range Summary

| Scenario | Typical Score Range | Why This Order |
|---|---|---|
| New volunteer (0 activities) | 200 – 295 | N=100 + D=up to 90 + L=20 ensures newcomers almost always win |
| Returning veteran (90+ days idle) | 120 – 190 | R=80 is their main engine; past reliability helps |
| Low-weight veteran → high-weight opp | 100 – 170 | D_score high; combined with F_score if repeatedly rejected |
| Frequently rejected volunteer | 80 – 160 | F_score up to 60 acts as rising tide lifting them over time |
| Active, reliable, high-weight veteran | 35 – 85 | Low on most components — they've already had opportunities |
| Unreliable volunteer (no-shows) | -10 – 60 | L_score penalty drags them down; can recover over time |

This ordering matches the design goal: **newcomers first → consistent low-weight contributors next → frequent high-weight veterans last** — while unreliable volunteers are penalised regardless of category.

---

## 7. Pseudocode (Production-Ready)

Can be translated directly to TypeScript for the Supabase Edge Function.

```javascript
// ─── Constants ───────────────────────────────────────────
const ACTIVITY_WEIGHTS = {
  'physical_event':        6,
  'physical_verification': 5,
  'school_visit':          4,
  'office_bg_work':        3,
  'tele_verification':     2,
  'other_small_work':      1,
}

const NEWCOMER_THRESHOLD     = 3
const RECENCY_CAP_DAYS       = 90
const MAX_FRUSTRATION_BONUS  = 60
const FRUSTRATION_PER_REJECT = 12
const DIVERSITY_MULTIPLIER   = 15
const RECENCY_MAX_SCORE      = 80
const CANCEL_CUTOFF_HOURS    = 48


// ─── Score Computation ──────────────────────────────────
function computePriorityScore(volunteer, opportunity) {

  // A. Newcomer Boost
  const totalActivities = volunteer.completedActivities.length

  let N_score
  if (totalActivities === 0) {
    N_score = 100
  } else if (totalActivities <= NEWCOMER_THRESHOLD) {
    N_score = 80 - (totalActivities * 15)
  } else {
    N_score = 0
  }

  // B. Opportunity Diversity Gap
  let avgPastWeight = 0
  if (totalActivities > 0) {
    const totalWeight = volunteer.completedActivities
      .reduce((sum, act) => sum + ACTIVITY_WEIGHTS[act.type], 0)
    avgPastWeight = totalWeight / totalActivities
  }
  const oppWeight = ACTIVITY_WEIGHTS[opportunity.type]
  const diversityGap = Math.max(0, oppWeight - avgPastWeight)
  const D_score = diversityGap * DIVERSITY_MULTIPLIER

  // C. Recency Fairness
  let daysSinceLast
  if (totalActivities === 0) {
    daysSinceLast = Math.min(
      daysBetween(volunteer.registeredAt, now()),
      RECENCY_CAP_DAYS
    )
  } else {
    const lastActivity = volunteer.completedActivities
      .sort((a, b) => b.completedAt - a.completedAt)[0]
    daysSinceLast = daysBetween(lastActivity.completedAt, now())
  }
  const R_score = Math.min(daysSinceLast / RECENCY_CAP_DAYS, 1.0)
                  * RECENCY_MAX_SCORE

  // D. Waitlist Frustration Bonus
  const F_score = Math.min(
    volunteer.consecutiveRejections * FRUSTRATION_PER_REJECT,
    MAX_FRUSTRATION_BONUS
  )

  // E. Reliability Score
  let L_score
  if (volunteer.timesSelected === 0) {
    L_score = 20
  } else {
    const rate = volunteer.timesCompleted / volunteer.timesSelected
    if      (rate >= 0.9) L_score =  20
    else if (rate >= 0.7) L_score =   0
    else if (rate >= 0.5) L_score = -20
    else                  L_score = -50
  }

  // F. Preference & Skills Match
  const prefMatch = volunteer.preferredTypes
    .includes(opportunity.type) ? 10 : 0
  let skillsMatch = 1.0
  if (opportunity.requiredSkills.length > 0) {
    const matched = opportunity.requiredSkills
      .filter(s => volunteer.skills.includes(s)).length
    skillsMatch = matched / opportunity.requiredSkills.length
  }
  const P_score = prefMatch + (skillsMatch * 15)

  // ─── Combined Score ───
  return {
    score: N_score + D_score + R_score + F_score + L_score + P_score,
    breakdown: { N_score, D_score, R_score, F_score, L_score, P_score },
    volunteerId: volunteer.id,
  }
}


// ─── Allocation Engine ───────────────────────────────────
function allocateOpportunity(opportunity, applicants) {

  // Step 1: If fewer applicants than slots, select all
  if (applicants.length <= opportunity.slots) {
    return {
      selected: applicants.map(a => a.id),
      waitlisted: [],
      remainingSlots: opportunity.slots - applicants.length,
      sendSecondNotification: true,
    }
  }

  // Step 2: Pre-filter by hard requirements
  const eligible = applicants.filter(vol =>
    opportunity.mandatorySkills.every(s => vol.skills.includes(s))
  )

  // Step 3: Score each eligible applicant
  const scored = eligible.map(vol =>
    computePriorityScore(vol, opportunity)
  )

  // Step 4: Sort by score, apply tiebreakers
  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 1) return b.score - a.score

    const volA = getVolunteer(a.volunteerId)
    const volB = getVolunteer(b.volunteerId)

    // Tiebreaker 1: more consecutive rejections
    if (volA.consecutiveRejections !== volB.consecutiveRejections)
      return volB.consecutiveRejections - volA.consecutiveRejections

    // Tiebreaker 2: fewer total activities
    if (volA.completedActivities.length !== volB.completedActivities.length)
      return volA.completedActivities.length - volB.completedActivities.length

    // Tiebreaker 3: earlier registration
    if (volA.registeredAt !== volB.registeredAt)
      return volA.registeredAt - volB.registeredAt

    // Tiebreaker 4: random
    return Math.random() - 0.5
  })

  // Step 5: Assign slots
  const selected   = scored.slice(0, opportunity.slots)
    .map(s => s.volunteerId)
  const waitlisted = scored.slice(opportunity.slots)
    .map(s => s.volunteerId)

  // Step 6: Update rejection counters
  selected.forEach(id => resetConsecutiveRejections(id))
  waitlisted.forEach(id => incrementConsecutiveRejections(id))

  return { selected, waitlisted, remainingSlots: 0 }
}


// ─── Cancellation Handling ───────────────────────────────
function handleCancellation(volunteerId, opportunity) {
  const hoursUntilEvent = hoursBetween(now(), opportunity.startTime)

  if (hoursUntilEvent >= CANCEL_CUTOFF_HOURS) {
    removeFromSelected(volunteerId, opportunity.id)
    promoteNextWaitlisted(opportunity.id)    // no penalty
  } else {
    markAsNoShow(volunteerId, opportunity.id) // late = no-show
    promoteNextWaitlisted(opportunity.id)
  }
}
```

---

## 8. Algorithm Flowchart

```
┌─────────────────────────────────┐
│   ADMIN CREATES OPPORTUNITY     │
│   (type, date, slots, skills)   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  NOTIFY ALL ACTIVE VOLUNTEERS   │
│  (push notification + email)    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   REGISTRATION WINDOW OPEN      │
│   (configurable: 24-72 hours)   │
│   Volunteers tap "I'm In"       │
└────────────┬────────────────────┘
             │
             ▼ (window closes)
┌─────────────────────────────────┐
│   APPLICANT COUNT CHECK         │
│                                 │
│   applicants <= slots?          │
│   ├─ YES → Select all, send    │
│   │        second notification  │
│   │        for remaining slots  │
│   └─ NO  → Continue to scoring │
└────────────┬────────────────────┘
             │ (more applicants than slots)
             ▼
┌─────────────────────────────────┐
│  PRE-FILTER: HARD REQUIREMENTS  │
│  Remove applicants who don't    │
│  meet mandatory skills          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  COMPUTE PRIORITY SCORE         │
│  for each remaining applicant   │
│                                 │
│  Score = N + D + R + F + L + P  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  SORT BY SCORE (descending)     │
│                                 │
│  Ties? Apply tiebreakers:       │
│  1. More consecutive rejections │
│  2. Fewer total activities      │
│  3. Earlier registration date   │
│  4. Random                      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  ASSIGN SLOTS                   │
│  Top N → SELECTED               │
│  Remaining → WAITLISTED         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  NOTIFY RESULTS                 │
│  Selected  → reset rejections   │
│  Waitlisted → increment +1     │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  POST-EVENT                     │
│  Completed → update history,    │
│               award points      │
│  No-show   → reliability drops  │
│  Cancel >=48hr → free, backfill │
│  Cancel <48hr  → counts no-show │
└─────────────────────────────────┘
```
