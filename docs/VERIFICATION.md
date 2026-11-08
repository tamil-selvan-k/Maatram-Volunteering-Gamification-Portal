# Volunteering Verification System

## The Problem

Self-reported volunteering data can't be trusted. Someone could claim "I did a school visit for 2 hours" without ever going. We need concrete proof — without making the process annoying for honest volunteers.

## Trust Pyramid

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

---

## Verification Methods

### QR Check-in / Check-out

- **For:** All physical events
- **How:** Event coordinator displays a QR code at the venue. The QR rotates every 5 minutes (TOTP-style — encodes `event_id + HMAC(secret, floor(time/300))`). Volunteer scans on arrival and departure. App records timestamp + GPS at both scans.
- **Anti-gaming:** QR rotates, so screenshots shared with absent people expire. GPS must be within 500m of event location. Device ID logged to prevent multi-scanning.
- **Duration:** Automatically calculated as `checkout_time - checkin_time`.
- **Forgot checkout?** Capped at event's scheduled end time, flagged for admin review.

### In-App Photo Proof

- **For:** School visits, presentations, physical events
- **How:** Volunteer takes a photo within the app's camera (not gallery picker). App auto-embeds: GPS coordinates, timestamp (server-synced), device ID, event_id.
- **Anti-gaming:** Gallery upload blocked. EXIF data stripped and re-embedded by the app using device sensors at capture time. Duplicate image detection (perceptual hash) prevents reuse.
- **Review:** Photos enter a queue. Approved by coordinator, peer, or admin.

### Peer Cross-Confirmation

- **For:** All activity types
- **How:** After an event ends, all registered attendees receive a prompt: "Confirm who you saw at today's event." Each volunteer sees the attendee list and taps to confirm who was present.
- **Threshold:** 2+ peer confirmations = auto-verified. 1 confirmation = partial (0.8x points). 0 = unverified.
- **Anti-gaming:** Requires multiple colluding accounts. Combined with QR/GPS data, collusion is detectable.

### Online Activity Verification

- **For:** Mock interviews, telephone verifications, BGV calls
- **How:** The beneficiary (student being interviewed, person being verified) receives an SMS/in-app prompt to confirm the call happened and rate the volunteer.
- **Fallback:** Call duration from phone logs (if user consents) or admin manual verification.
- **For BGV:** The completed verification report itself serves as proof.

---

## Verification Score → Points Multiplier

| Verification Level | Multiplier | What It Means |
|---|---|---|
| Self-reported only | **0.5x** | Claimed but no proof. Still logged, but heavily discounted. |
| Photo proof (pending review) | **0.7x** | Photo submitted via in-app camera, awaiting coordinator/admin approval. |
| QR check-in only (no checkout) | **0.7x** | Arrived but didn't scan out. Duration capped at scheduled event end. |
| Peer confirmed (1 peer) | **0.8x** | One other volunteer confirmed your presence. |
| QR check-in + check-out | **1.0x** | Full verified attendance with auto-calculated duration. |
| QR + Peer confirmed (2+) | **1.1x** | Attendance verified by system and community. |
| QR + Photo + Peer + Admin approved | **1.25x** | Gold standard. All verification layers confirmed. Bonus reward. |

### Design Principle

Never block a volunteer from logging their work. Always let them self-report. But verified hours are worth more — this naturally incentivises verification without punishing honest volunteers who forgot to scan.
