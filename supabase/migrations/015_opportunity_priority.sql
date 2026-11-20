-- Phase 2: Per-opportunity priority and allocation reliability

-- Add priority and urgency columns to opportunities
alter table opportunities
  add column if not exists priority smallint not null default 3
    check (priority between 1 and 5),
  add column if not exists urgency text not null default 'standard'
    check (urgency in ('standard', 'urgent', 'emergency'));

-- Allocation runs: one row per allocation execution
create table if not exists allocation_runs (
  id                uuid primary key default uuid_generate_v4(),
  opportunity_id    uuid not null references opportunities(id) on delete cascade,
  algorithm_version text not null default 'v2',
  run_at            timestamptz not null default now(),
  run_by            uuid not null references volunteers(id),
  total_applicants  integer not null,
  eligible_count    integer not null,
  selected_count    integer not null,
  waitlisted_count  integer not null,
  seed              text,
  is_dry_run        boolean not null default false
);

-- Allocation outcomes: one row per applicant per run
create table if not exists allocation_outcomes (
  id                uuid primary key default uuid_generate_v4(),
  run_id            uuid not null references allocation_runs(id) on delete cascade,
  volunteer_id      uuid not null references volunteers(id),
  outcome           text not null check (outcome in ('selected', 'waitlisted', 'excluded')),
  score             numeric(8,3),
  score_breakdown   jsonb,
  exclusion_reason  text,
  waitlist_position smallint,
  created_at        timestamptz not null default now()
);

-- Indexes
create index if not exists idx_allocation_runs_opportunity
  on allocation_runs(opportunity_id);
create index if not exists idx_allocation_outcomes_run
  on allocation_outcomes(run_id);
create index if not exists idx_allocation_outcomes_volunteer
  on allocation_outcomes(volunteer_id);

-- RLS
alter table allocation_runs enable row level security;
alter table allocation_outcomes enable row level security;

create policy "Admins can read allocation_runs"
  on allocation_runs for select
  using (exists (
    select 1 from volunteers where volunteers.id = auth.uid() and volunteers.is_admin = true
  ));

create policy "Admins can insert allocation_runs"
  on allocation_runs for insert
  with check (exists (
    select 1 from volunteers where volunteers.id = auth.uid() and volunteers.is_admin = true
  ));

create policy "Admins can read allocation_outcomes"
  on allocation_outcomes for select
  using (exists (
    select 1 from volunteers where volunteers.id = auth.uid() and volunteers.is_admin = true
  ));

create policy "Admins can insert allocation_outcomes"
  on allocation_outcomes for insert
  with check (exists (
    select 1 from volunteers where volunteers.id = auth.uid() and volunteers.is_admin = true
  ));
