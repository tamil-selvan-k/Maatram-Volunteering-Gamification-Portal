# Maatram Volunteering & Gamification Portal

## Algorithm audit and revised four-phase improvement plan

**Direction:** Evolve the existing architecture rather than replace the entire system. Introduce availability-aware matching first, add opportunity-specific priority, then support matching across multiple opportunities. Do not use rejection history, newcomer boosts, diversity-gap scoring, fairness debt, or other fairness bonuses in candidate ranking. Fairness is to be measured and reported, not used as another score.

## 1. Executive assessment

The repository contains a promising prototype for allocating volunteering opportunities, but the current implementation is not yet reliable enough for production allocation. The existing design ranks applicants using a weighted sum of volunteer-related factors. The main gap is that it does not adequately model whether a volunteer is actually available for the event, and several values used by the algorithm are not consistently maintained or persisted.

The recommended approach is to evolve the current system in four implementation phases. The first phase establishes availability CRUD and availability-aware eligibility/matching. The second adds a priority value to each opportunity. The third introduces matching across multiple opportunities while respecting volunteer capacity and schedule conflicts. The fourth adds fairness measurement, allocation reporting, and validation. Fairness metrics are for evaluation and monitoring only; they must not add fairness points to an individual volunteer's selection score.

## 2. What the current algorithm does

The current implementation is a deterministic-style weighted-sum Multi-Criteria Decision Making (MCDA) ranking approach, with a random tie-break. It calculates a score for each volunteer against an opportunity and ranks applicants.

The documented formula is:

```
S(v,o) = N + D + R + F + L + P
```

| Factor | Current meaning | Documented range |
|--------|----------------|-----------------|
| N — Newcomer boost | Higher score for volunteers with fewer completed activities. | 0 to 100 |
| D — Diversity gap | Rewards volunteers whose past activity mix has less exposure to the opportunity's activity category | 0 to 90 |
| R — Recency | Rewards volunteers who have not participated recently. | 0 to 80 |
| F — Frustration bonus | Adds points based on consecutive rejections. | 0 to 60 |
| L — Reliability | Uses completion rate; new volunteers receive benefit of the doubt. | -50 to +20 |
| P — Preference and skill match | Adds points for matching preferences and skills. | 0 to 25 |

The documented theoretical score range is -50 to 375. This is a heuristic ranking formula, not machine learning and not a global optimization algorithm.

### Current allocation flow

- An administrator creates an opportunity.
- A volunteer registers interest in that opportunity.
- The administrator runs allocation.
- The service calculates applicant scores and ranks applicants.
- The available slots are assigned to selected applicants; remaining applicants are waitlisted.
- The system attempts to send selection and waitlist notifications.

The documentation includes a sample allocation with three slots, where a newcomer and volunteers with different activity histories receive different scores. That is an illustrative example from the documentation, not evidence of live allocation outcomes.

## 3. Audit findings and implementation gaps

### 3.1 Availability is not modelled

The applicant data used by the allocation flow includes fields such as creation date, preferences, skills, consecutive rejections, times selected, and times completed. The inspected model does not provide a complete availability calendar, available time windows, maximum weekly hours, event conflicts, or travel/location capacity. Consequently, the algorithm can rank a volunteer who cannot attend the event.

Availability must be an explicit, volunteer-managed data model. The system should not infer availability from last login, app activity, or how quickly someone sees a WhatsApp message.

### 3.2 There is no per-opportunity priority field

The current opportunity profile includes activity type, required skills, mandatory skills, and total slots. The inspected opportunity schema does not include an individual priority/urgency value for each opportunity. Activity-type weights in the current algorithm are category weights; they are not the priority of a particular event.

### 3.3 Algorithm counters are not consistently maintained

The current scoring logic reads values such as consecutive_rejections, times_selected, and times_completed. In the inspected allocation flow, selected/waitlisted registration statuses are updated, but the selection and rejection counters are not consistently updated. The completion counter has a completion/verification path in the SQL migration, but the inspected code does not establish a complete lifecycle for all counters. Scores based on stale counters cannot be trusted.

### 3.4 Mandatory-skill filtering can be bypassed

The current code has an early return when the number of applicants is less than or equal to the number of slots. Mandatory-skill filtering is performed after that return. This means an applicant may be selected without passing mandatory-skill checks when all applicants fit within the available slots. Eligibility filtering must always happen before capacity shortcuts or ranking.

### 3.5 Scores and waitlist positions are not fully persisted

The registration schema contains priority_score and waitlist_position fields, but the inspected allocation flow updates registration statuses without persisting the calculated score and waitlist position. The system therefore lacks a complete record explaining why each applicant was selected or waitlisted.

### 3.6 Allocation is not safely atomic

The inspected service fetches the opportunity and applicants, calculates allocation in application code, and performs separate database updates for selected and waitlisted registrations. It uses a best-effort rollback approach. It does not establish a robust transaction/lock/idempotency boundary for concurrent allocation runs or repeated runs. This creates risks of duplicate allocation, inconsistent statuses, or exceeding capacity.

Move the authoritative allocation operation to a server-side PostgreSQL function/RPC or equivalent server-side transaction. Lock the opportunity row, validate its state, perform allocation and persist all outcomes in one transaction.

### 3.7 Registration checks need server-side enforcement

The registration service inserts a registered record. The inspected flow does not establish complete server-side enforcement for registration deadlines, opportunity status, availability, or all eligibility conditions. These checks must not rely only on client-side UI validation.

### 3.8 Notification implementation and documentation differ

The notification documentation describes functions for new-opportunity notifications and priority allocation, but the inspected repository's Edge Functions include send-email and send-push rather than the named allocation/notification functions. There is also a type mismatch: the allocation flow inserts selection notifications with type 'selection', while the SQL email trigger checks for type 'opportunity_selected'. As inspected, this mismatch can prevent the expected email trigger from firing.

### 3.9 Random tie-break should be reproducible

The current comparator uses Math.random() during sorting. A random value generated inside a sort comparator can make ordering inconsistent and is not suitable for an auditable allocation. Generate a tie-break value once per applicant per allocation run, persist the seed or key, and use it only after the primary ranking criteria.

## 4. Revised architecture and selection principles

The new architecture should separate eligibility, matching, opportunity priority, and fairness measurement. These are distinct responsibilities.

- **Eligibility:** determine whether a volunteer can and is qualified to take the opportunity. Mandatory skills, availability overlap, time conflicts, location/mode, and workload limits are hard constraints.
- **Matching:** choose an assignment set that respects slots, volunteer capacity, schedule conflicts, and any continuity requirement.
- **Opportunity priority:** represent the relative operational importance or urgency of each opportunity. It belongs to the opportunity, not to a volunteer.
- **Fairness measurement:** report who applied, who was eligible, who was selected, selection rates, and outcomes. Do not turn these measurements into extra candidate score bonuses.

Remove the current newcomer boost, diversity-gap bonus, recency bonus, consecutive-rejection/frustration bonus, and fairness-debt or similar fairness scoring from the revised selection score. Do not replace them with additional fairness scoring factors.

### Volunteer availability model

Availability should be flexible and editable by volunteers. A practical model should support:

- Recurring weekly availability windows and one-off date-specific availability.
- Start and end times, timezone, and date range/validity.
- Availability status such as available, unavailable, or tentative where appropriate.
- Maximum volunteering hours per week and, if needed, maximum simultaneous commitments.
- Remote/online or in-person preference and supported districts/travel radius for physical events.
- Ability to create, read, update, and delete availability entries (CRUD).
- Ability to temporarily mark a period unavailable, edit existing windows, and remove obsolete entries.

### Opportunity model

Each opportunity should support its own priority/urgency value, event date and time, duration or estimated effort, number of slots, required and mandatory skills, location, remote/in-person mode, registration deadline, and any continuity requirement. Priority should be configurable by an authorized administrator and have a clearly defined scale and meaning.

## 5. Four-phase implementation plan

### Phase 1 — Availability CRUD and availability-aware matching

**Goal:** Make sure volunteers are considered only when they can realistically participate. This is the foundation and should be implemented first.

- **Database:** Add volunteer availability tables for recurring weekly windows and date-specific exceptions. Store timezone, start/end time, validity dates, availability status, and optional location/mode constraints.
- **CRUD:** Build create, list/read, update, and delete operations for availability. Volunteers must be able to manage their own availability; administrators may have authorized read/management access where required.
- **Volunteer UI:** Provide a simple availability calendar/form. Support multiple windows, editing, deletion, one-off unavailability, and maximum weekly hours.
- **Opportunity matching:** Compare opportunity date/time/duration with volunteer availability. Exclude candidates with no valid time overlap, conflicting commitments, or incompatible location/mode.
- **Eligibility order:** Apply mandatory skills, availability, schedule conflict, location/mode, and workload checks before ranking or checking whether all applicants fit into the slots.
- **Registration:** Enforce opportunity status and registration deadline on the server. Do not use first-come-first-served as the allocation rule.
- **Testing:** Cover volunteers with no availability, partial overlap, overlapping events, recurring windows, timezone differences, and availability edits after registration.

**Deliverable:** An administrator can run an allocation and see only eligible applicants who satisfy the event's availability and role requirements.

### Phase 2 — Per-opportunity priority and allocation reliability

**Goal:** Let Maatram distinguish the importance of one event from another, and make each allocation traceable and safe.

- **Priority field:** Add an opportunity-specific priority value, configured by an administrator. Define the scale and what each level means. Do not confuse this with activity-category weights.
- **Effort and urgency:** Store estimated duration/effort and, if required, urgency/deadline separately from priority so each value has a clear meaning.
- **Allocation policy:** Apply opportunity priority when deciding how to schedule or choose between competing opportunities. Do not use it to create volunteer fairness bonuses.
- **Persist outcomes:** Store the final score/ranking inputs used, selected/waitlisted status, waitlist position, allocation run ID, algorithm version, and eligibility/exclusion reasons.
- **Atomic allocation:** Move allocation into a server-side transaction/RPC with row locking, capacity validation, idempotency, and safe handling of repeated runs.
- **Counter lifecycle:** Either remove unused rejection-related counters from the new algorithm or maintain only operational counters that are genuinely required. Do not use rejection history to increase selection priority.
- **Notifications:** Align notification type constants, database triggers, Edge Functions, and documentation. Notify applicants of selection/waitlist outcomes and send opportunity announcements/reminders through opted-in channels.

**Deliverable:** Each opportunity has its own priority and every allocation is persisted, explainable, repeatable, and protected against concurrent runs.

### Phase 3 — Multiple-opportunity matching

**Goal:** Allocate volunteers across several opportunities in one matching cycle instead of treating each opportunity independently.

- Represent the problem as a matching/optimization problem: volunteers on one side, opportunity slots on the other, with an edge only where the volunteer is eligible and available.
- Respect each opportunity's slot count, volunteer maximum hours, maximum number of commitments, and overlapping event times.
- Support administrator-defined constraints such as required skill coverage, location/mode, and continuity for recurring programmes.
- Use a batch matching approach such as min-cost max-flow or integer linear programming when the number of simultaneous opportunities makes independent allocation unreliable.
- Use opportunity priority as an opportunity-level input to the allocation objective, with clearly documented policy. Avoid allowing a high-priority event to create impossible schedules or override hard eligibility constraints.
- For recurring tutoring, mentoring, or other relationship-based work, preserve continuity where required instead of randomly reassigning volunteers each cycle.
- Provide a preview/dry-run showing proposed assignments, unfilled slots, conflicts, and reasons before an administrator confirms the batch.

A simplified optimization model is:

```
Maximize Σ x(v,o) × U(v,o)
```

Subject to: assignments per opportunity do not exceed its slots; each volunteer stays within commitment/hour limits; overlapping commitments are prohibited; and every selected volunteer satisfies mandatory eligibility and availability constraints. Here x(v,o) is 1 when volunteer v is assigned to opportunity o, otherwise 0. U(v,o) represents the documented suitability/operational utility for that valid assignment.

**Deliverable:** One allocation run can fill multiple opportunities while respecting availability, skills, workload, capacity, and continuity.

### Phase 4 — Fairness measurement, reporting, and validation

**Goal:** Measure whether the new process is producing fair access and reliable outcomes. Fairness is measured after and across allocation runs; it is not added as a candidate score.

- Track applications, eligible applications, selected applicants, waitlist outcomes, completed activities, cancellations, and no-shows.
- Measure selection rate among eligible applicants, including first-time applicant outcomes and outcomes for volunteers with limited availability. Use these as diagnostic breakdowns, not score bonuses.
- Measure opportunity fill rate, waitlist conversion, completion rate, cancellation/no-show rate, and distribution of assignments across volunteers.
- Compare outcomes across time periods and opportunity types. Interpret small sample sizes carefully.
- Build an administrator dashboard with filters by opportunity, activity type, date range, and volunteer cohort. Show counts and rates with clear denominators.
- Run simulations for high-demand events, low applicant counts, new applicants, experienced applicants, specialists, volunteers with narrow availability, and overlapping opportunities.
- Compare the new workflow with the current workflow using the same test scenarios. Adjust operational rules based on evidence, not by adding unvalidated fairness points.

**Fairness measurement examples:** eligible selection rate = selected eligible applicants ÷ all eligible applicants; fill rate = filled slots ÷ total slots; waitlist conversion = waitlisted applicants later selected ÷ waitlisted applicants; completion rate = completed assignments ÷ selected assignments. Report the denominator and time window with every rate.

**Deliverable:** Maatram administrators can evaluate whether access and outcomes are improving without embedding fairness debt, rejection history, newcomer boosts, or diversity bonuses into the ranking formula.

## 6. Recommended technical safeguards

- Enforce authorization with row-level security and server-side validation for volunteer availability and opportunity management.
- Use database constraints for valid time ranges, duplicate windows where appropriate, and unique volunteer/opportunity registrations.
- Store timestamps consistently and convert using each volunteer's timezone when presenting availability.
- Revalidate availability and capacity immediately before committing an allocation.
- Make allocation idempotent: repeating the same run should not create duplicate assignments.
- Record manual administrator overrides with the actor, timestamp, and reason.
- Keep a versioned allocation policy so past decisions can be interpreted after the algorithm changes.
- Provide an allocation preview and explicit confirmation for administrators.

## 7. Suggested delivery order

| Phase | Primary work | Exit condition |
|-------|-------------|----------------|
| 1 | Availability data model, full CRUD, availability and eligibility matching. | Only eligible, available volunteers enter allocation. |
| 2 | Opportunity-specific priority, persisted outcomes, atomic allocation, registration and notification fixes. | Each allocation is safe, auditable, and uses the opportunity's priority. |
| 3 | Batch matching across multiple opportunities with workload and conflict constraints. | One run can allocate multiple opportunities without overbooking. |
| 4 | Fairness and operational measurement, dashboards, simulations, and validation. | Administrators can measure access and outcomes using reliable data. |

## 8. Final recommendation

Do not discard the existing project or simply add more points to its current formula. Evolve the architecture around four foundations: availability-aware eligibility, opportunity-specific priority, multi-opportunity matching, and measurement.

The most important change is to stop treating volunteer access as a ranking problem alone. A volunteer must first be eligible and available. The system should then allocate opportunities according to the opportunity's operational priority and the constraints of the whole schedule. Fairness should be evaluated through transparent metrics over time, not through newcomer, diversity, rejection-history, or fairness-debt bonuses in the selection score.

For the hackathon, implement Phase 1 completely before attempting advanced optimization. A reliable availability CRUD and matching workflow is more valuable than a sophisticated score built on incomplete availability data.

## 9. Maatram Foundation context and scope

The public Maatram Foundation volunteer registration portal asks for volunteer type, college/company details, interview preferences such as telephone, physical, and panel verification, and district information for physical verification. This supports modelling role, mode, and location as relevant matching attributes.

The Foundation's publicly described work includes volunteer-led data collection and background verification, face-to-face interviews and shortlisting, school visits facilitated by trained alumni, and online tutoring/revision/one-to-one mentoring. These different activities support the need for opportunity-specific skills, mode, location, duration, and continuity requirements.

The public sources do not establish Maatram's internal WhatsApp announcement or allocation rules, nor do they provide internal historical allocation data. The audit therefore evaluates the repository implementation and uses public programme descriptions only as context; it does not claim access to the Foundation's internal operating practices.
