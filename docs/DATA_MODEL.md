# Data Model

Complete PostgreSQL schema for all tables.

## Core Tables

```sql
-- Core tables

volunteers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            TEXT UNIQUE NOT NULL,
    full_name        TEXT NOT NULL,
    phone            TEXT,
    role             TEXT CHECK (role IN ('student', 'alumni', 'supporter')),
    employer_org     TEXT,
    preferences      TEXT[],          -- array of preferred activity types
    skills           TEXT[],          -- array of volunteer skills
    consent_push     BOOLEAN DEFAULT FALSE,
    consent_email    BOOLEAN DEFAULT FALSE,
    consent_linkedin BOOLEAN DEFAULT FALSE,
    reliability_score FLOAT DEFAULT 1.0,   -- 0.0 to 1.0
    total_points     INT DEFAULT 0,
    level            INT DEFAULT 1,
    streak_months    INT DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    is_active        BOOLEAN DEFAULT TRUE,
    do_not_contact   BOOLEAN DEFAULT FALSE
);

opportunities (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                 TEXT NOT NULL,
    description           TEXT,
    activity_type         TEXT NOT NULL CHECK (activity_type IN (
                              'physical_event', 'physical_verification',
                              'school_visit', 'office_bg_work',
                              'telephone_verification', 'other_small_work'
                          )),
    mode                  TEXT CHECK (mode IN ('online', 'offline')),
    location              TEXT,
    location_lat          FLOAT,
    location_lng          FLOAT,
    event_date            TIMESTAMPTZ NOT NULL,
    duration_hours        FLOAT,
    total_slots           INT NOT NULL,
    registration_deadline TIMESTAMPTZ NOT NULL,
    required_skills       TEXT[],
    mandatory_skills      TEXT[],
    status                TEXT DEFAULT 'open' CHECK (status IN (
                              'open', 'registration_closed', 'allocated',
                              'in_progress', 'completed', 'cancelled'
                          )),
    qr_secret             TEXT,          -- TOTP secret for rotating QR
    created_by            UUID REFERENCES volunteers(id),
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

registrations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id     UUID REFERENCES volunteers(id),
    opportunity_id   UUID REFERENCES opportunities(id),
    priority_score   FLOAT,           -- calculated by algorithm
    status           TEXT DEFAULT 'registered' CHECK (status IN (
                         'registered', 'selected', 'waitlisted',
                         'declined', 'no_show'
                     )),
    waitlist_position INT,
    registered_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(volunteer_id, opportunity_id)
);

verifications (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id    UUID REFERENCES registrations(id),
    checkin_time       TIMESTAMPTZ,
    checkout_time      TIMESTAMPTZ,
    checkin_gps        POINT,
    checkout_gps       POINT,
    photo_url          TEXT,
    photo_gps          POINT,
    photo_timestamp    TIMESTAMPTZ,
    peer_confirms      INT DEFAULT 0,
    verification_level TEXT DEFAULT 'self_report' CHECK (verification_level IN (
                           'self_report', 'photo_pending', 'qr_partial',
                           'peer_partial', 'qr_full', 'qr_peer',
                           'gold_standard'
                       )),
    verified_hours     FLOAT,
    points_awarded     INT,
    admin_approved     BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

peer_confirmations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confirmer_id    UUID REFERENCES volunteers(id),
    confirmed_id    UUID REFERENCES volunteers(id),
    opportunity_id  UUID REFERENCES opportunities(id),
    confirmed_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(confirmer_id, confirmed_id, opportunity_id)
);

points_log (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id             UUID REFERENCES volunteers(id),
    opportunity_id           UUID REFERENCES opportunities(id),
    base_points              INT,
    verification_multiplier  FLOAT,
    bonus_multiplier         FLOAT,
    final_points             INT,
    reason                   TEXT,
    created_at               TIMESTAMPTZ DEFAULT NOW()
);

badges (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id  UUID REFERENCES volunteers(id),
    badge_type    TEXT NOT NULL,
    badge_name    TEXT NOT NULL,
    earned_at     TIMESTAMPTZ DEFAULT NOW()
);

notifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id  UUID REFERENCES volunteers(id),
    type          TEXT NOT NULL,
    title         TEXT NOT NULL,
    body          TEXT,
    channel       TEXT CHECK (channel IN ('push', 'email', 'in_app')),
    read          BOOLEAN DEFAULT FALSE,
    sent_at       TIMESTAMPTZ DEFAULT NOW()
);

push_tokens (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id  UUID REFERENCES volunteers(id) UNIQUE,
    token         TEXT NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

## Materialised View for Leaderboard

Refreshed hourly via `pg_cron`.

```sql
CREATE MATERIALIZED VIEW leaderboard_mv AS
SELECT
    v.id,
    v.full_name,
    v.role,
    v.employer_org,
    v.total_points,
    v.level,
    v.streak_months,
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

## Key Relationships

- `volunteers` 1:N `registrations` — a volunteer registers for many opportunities
- `opportunities` 1:N `registrations` — an opportunity has many registrants
- `registrations` 1:1 `verifications` — each selected registration gets one verification record
- `volunteers` N:N `peer_confirmations` — volunteers confirm each other (self-referencing through confirmer_id / confirmed_id)
- `volunteers` 1:N `points_log` — audit trail of all points awarded
- `volunteers` 1:N `badges` — earned badges
- `volunteers` 1:N `notifications` — all notifications sent
