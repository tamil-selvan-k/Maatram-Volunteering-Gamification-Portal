-- ─────────────────────────────────────────────────────────────────────────────
-- Maatram Foundation — initial database schema
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type activity_type_enum as enum (
  'physical_event',
  'physical_verification',
  'school_visit',
  'office_bg_work',
  'telephone_verification',
  'other_small_work'
);

create type volunteer_role_enum as enum ('student', 'alumni', 'supporter');

create type verification_level_enum as enum (
  'self_report',
  'photo_pending',
  'qr_partial',
  'peer_partial',
  'qr_full',
  'qr_peer',
  'gold_standard'
);

create type registration_status_enum as enum (
  'registered',
  'selected',
  'waitlisted',
  'declined',
  'no_show'
);

create type opportunity_status_enum as enum (
  'open',
  'registration_closed',
  'allocated',
  'in_progress',
  'completed',
  'cancelled'
);

-- ─── volunteers ──────────────────────────────────────────────────────────────
create table if not exists volunteers (
  id                     uuid primary key default uuid_generate_v4(),
  email                  text not null unique,
  full_name              text not null,
  phone                  text,
  role                   volunteer_role_enum not null default 'student',
  employer_org           text,
  preferences            activity_type_enum[] not null default '{}',
  skills                 text[]              not null default '{}',
  consent_push           boolean             not null default true,
  consent_email          boolean             not null default true,
  consent_linkedin       boolean             not null default false,
  reliability_score      numeric(4,3)        not null default 1.0
                           check (reliability_score between 0 and 1),
  total_points           integer             not null default 0 check (total_points >= 0),
  level                  smallint            not null default 1 check (level between 1 and 7),
  streak_months          smallint            not null default 0,
  consecutive_rejections smallint            not null default 0,
  times_selected         integer             not null default 0,
  times_completed        integer             not null default 0,
  created_at             timestamptz         not null default now(),
  is_active              boolean             not null default true,
  do_not_contact         boolean             not null default false,
  is_admin               boolean             not null default false
);

-- ─── opportunities ───────────────────────────────────────────────────────────
create table if not exists opportunities (
  id                     uuid primary key default uuid_generate_v4(),
  title                  text                not null,
  description            text,
  activity_type          activity_type_enum  not null,
  mode                   text                not null check (mode in ('online', 'offline')),
  location               text,
  location_lat           numeric(9,6),
  location_lng           numeric(9,6),
  event_date             timestamptz         not null,
  duration_hours         numeric(4,1)        not null check (duration_hours > 0),
  total_slots            smallint            not null check (total_slots > 0),
  registration_deadline  timestamptz         not null,
  required_skills        text[]              not null default '{}',
  mandatory_skills       text[]              not null default '{}',
  status                 opportunity_status_enum not null default 'open',
  qr_secret              text,
  created_by             uuid                not null references volunteers(id),
  created_at             timestamptz         not null default now()
);

create index idx_opportunities_status       on opportunities(status);
create index idx_opportunities_event_date   on opportunities(event_date);
create index idx_opportunities_activity_type on opportunities(activity_type);

-- ─── registrations ───────────────────────────────────────────────────────────
create table if not exists registrations (
  id               uuid primary key default uuid_generate_v4(),
  volunteer_id     uuid not null references volunteers(id)    on delete cascade,
  opportunity_id   uuid not null references opportunities(id) on delete cascade,
  priority_score   numeric(8,3),
  status           registration_status_enum not null default 'registered',
  waitlist_position smallint,
  registered_at    timestamptz not null default now(),
  unique (volunteer_id, opportunity_id)
);

create index idx_registrations_volunteer    on registrations(volunteer_id);
create index idx_registrations_opportunity  on registrations(opportunity_id);
create index idx_registrations_status       on registrations(status);

-- ─── verifications ───────────────────────────────────────────────────────────
create table if not exists verifications (
  id                 uuid primary key default uuid_generate_v4(),
  registration_id    uuid not null references registrations(id) on delete cascade unique,
  checkin_time       timestamptz,
  checkout_time      timestamptz,
  photo_url          text,
  peer_confirms      smallint          not null default 0,
  verification_level verification_level_enum not null default 'self_report',
  verified_hours     numeric(4,1),
  points_awarded     integer,
  admin_approved     boolean           not null default false,
  created_at         timestamptz       not null default now()
);

-- ─── peer_confirmations ──────────────────────────────────────────────────────
create table if not exists peer_confirmations (
  id               uuid primary key default uuid_generate_v4(),
  verification_id  uuid not null references verifications(id) on delete cascade,
  confirmer_id     uuid not null references volunteers(id),
  confirmed_at     timestamptz not null default now(),
  unique (verification_id, confirmer_id)
);

-- ─── points_log ──────────────────────────────────────────────────────────────
create table if not exists points_log (
  id           uuid primary key default uuid_generate_v4(),
  volunteer_id uuid        not null references volunteers(id) on delete cascade,
  points       integer     not null,
  reason       text        not null,
  reference_id uuid,
  created_at   timestamptz not null default now()
);

create index idx_points_log_volunteer on points_log(volunteer_id);

-- ─── badges ──────────────────────────────────────────────────────────────────
create table if not exists badges (
  id           uuid primary key default uuid_generate_v4(),
  volunteer_id uuid        not null references volunteers(id) on delete cascade,
  badge_type   text        not null,
  badge_name   text        not null,
  earned_at    timestamptz not null default now(),
  unique (volunteer_id, badge_type)
);

create index idx_badges_volunteer on badges(volunteer_id);

-- ─── notifications ───────────────────────────────────────────────────────────
create table if not exists notifications (
  id           uuid primary key default uuid_generate_v4(),
  volunteer_id uuid        not null references volunteers(id) on delete cascade,
  title        text        not null,
  body         text        not null,
  type         text        not null default 'general',
  read         boolean     not null default false,
  created_at   timestamptz not null default now()
);

create index idx_notifications_volunteer on notifications(volunteer_id, read);

-- ─── leaderboard_mv (materialized view) ─────────────────────────────────────
create materialized view if not exists leaderboard_mv as
  select
    v.id,
    v.full_name,
    v.role,
    v.employer_org,
    v.total_points,
    v.level,
    v.streak_months,
    count(distinct r.id) filter (where r.status = 'selected') as total_events,
    coalesce(sum(ve.verified_hours) filter (where ve.admin_approved), 0) as total_hours,
    rank() over (order by v.total_points desc) as rank
  from volunteers v
  left join registrations r   on r.volunteer_id = v.id
  left join verifications  ve on ve.registration_id = r.id
  where v.is_active = true
    and v.do_not_contact = false
    and v.total_points > 0
  group by v.id, v.full_name, v.role, v.employer_org, v.total_points, v.level, v.streak_months
  order by v.total_points desc
  limit 50;

create unique index idx_leaderboard_mv_id on leaderboard_mv(id);
create index idx_leaderboard_mv_rank      on leaderboard_mv(rank);

-- Refresh function (call this on a schedule or after points update)
create or replace function refresh_leaderboard()
returns void language plpgsql security definer as $$
begin
  refresh materialized view concurrently leaderboard_mv;
end;
$$;

-- ─── Row-Level Security ───────────────────────────────────────────────────────
alter table volunteers          enable row level security;
alter table opportunities       enable row level security;
alter table registrations       enable row level security;
alter table verifications       enable row level security;
alter table peer_confirmations  enable row level security;
alter table points_log          enable row level security;
alter table badges              enable row level security;
alter table notifications       enable row level security;

-- Volunteers: read own row, admin reads all
create policy "Volunteers: read own"
  on volunteers for select
  using (auth.uid() = id or exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));

create policy "Volunteers: insert own"
  on volunteers for insert
  with check (auth.uid() = id);

create policy "Volunteers: update own"
  on volunteers for update
  using (auth.uid() = id);

-- Opportunities: all authenticated can read open ones
create policy "Opportunities: read open"
  on opportunities for select
  using (status = 'open' or exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));

create policy "Opportunities: admin insert"
  on opportunities for insert
  with check (exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));

create policy "Opportunities: admin update"
  on opportunities for update
  using (exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));

-- Registrations: own rows
create policy "Registrations: read own"
  on registrations for select
  using (volunteer_id = auth.uid() or exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));

create policy "Registrations: insert own"
  on registrations for insert
  with check (volunteer_id = auth.uid());

-- Verifications: read through own registration
create policy "Verifications: read own"
  on verifications for select
  using (exists (
    select 1 from registrations r
    where r.id = registration_id and r.volunteer_id = auth.uid()
  ) or exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));

-- Points log: own rows
create policy "Points log: read own"
  on points_log for select
  using (volunteer_id = auth.uid());

-- Badges: own rows
create policy "Badges: read own"
  on badges for select
  using (volunteer_id = auth.uid());

-- Peer confirmations: own confirmer rows
create policy "Peer confirmations: read own"
  on peer_confirmations for select
  using (confirmer_id = auth.uid() or exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));

create policy "Peer confirmations: insert own"
  on peer_confirmations for insert
  with check (confirmer_id = auth.uid());

-- Notifications: own rows
create policy "Notifications: read own"
  on notifications for select
  using (volunteer_id = auth.uid());

create policy "Notifications: update own"
  on notifications for update
  using (volunteer_id = auth.uid());
