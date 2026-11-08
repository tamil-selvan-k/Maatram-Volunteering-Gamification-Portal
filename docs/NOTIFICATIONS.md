# Notification System

## Notification Flow

```
Admin creates opportunity
        │
        ▼
Supabase DB Trigger fires
        │
        ▼
Edge Function: "notify_new_opportunity"
        │
        ├──► Push Notification (Expo Push)
        │    "New opportunity: Mock Interview Panel — Dec 15"
        │    "Tap to register. Window closes in 48hrs."
        │
        └──► In-app Realtime update
             Opportunity feed refreshes instantly

─────────────────────────────────────────────────

Registration window closes
        │
        ▼
Edge Function: "run_priority_allocation"
        │
        ├──► Selected volunteers:
        │    Push: "You've been selected for Mock Interview Panel!"
        │    Email: Confirmation with event details
        │
        └──► Waitlisted volunteers:
             Push: "You're #3 on the waitlist for Mock Interview Panel"
             (Notified if a slot opens)

─────────────────────────────────────────────────

Event ends
        │
        ▼
Edge Function: "post_event_flow"
        │
        ├──► Peer confirmation prompt (push)
        │    "Confirm who attended today's event"
        │
        ├──► Thank-you email (Resend)
        │    Personalised with hours + points earned
        │
        └──► LinkedIn share prompt (push)
             "Share your volunteering on LinkedIn!"
             Pre-filled post opens in browser
```

---

## Notification Types

| Trigger | Channel | Content | Timing |
|---|---|---|---|
| New opportunity posted | Push + In-app | Opportunity details, registration deadline | Immediate |
| Selected for opportunity | Push + Email | Confirmation, event details, prep info | After allocation runs |
| Waitlisted | Push | Position on waitlist, next steps | After allocation runs |
| Event reminder | Push | "Your school visit is tomorrow at 10 AM" | 24 hours + 1 hour before |
| Peer confirmation request | Push | "Confirm who attended today's event" | 1 hour after event end |
| Points awarded | In-app | "+120 points! You're now level Sapling" | After verification complete |
| Streak milestone | Push + In-app | "3-month streak! You earned the Consistent badge" | On milestone hit |
| Inactivity nudge | Push | "3 opportunities match your preferences. Check them out!" | After 30 days inactive + active opportunities exist |
| Thank you | Email | Personalised note + impact summary | After event verification |
| LinkedIn share | In-app | Ready-to-share post with impact stats | After thank-you email |

---

## Consent Requirements

All notifications require **explicit opt-in** during onboarding. Volunteers can toggle each channel (push, email) and each type independently in Settings. No contact happens without consent.
