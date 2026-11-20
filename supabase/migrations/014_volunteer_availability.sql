-- Volunteer availability: recurring weekly slots and date-specific exceptions

create table if not exists volunteer_availability (
  id              uuid primary key default uuid_generate_v4(),
  volunteer_id    uuid not null references volunteers(id) on delete cascade,
  type            text not null check (type in ('recurring', 'exception')),
  day_of_week     smallint check (day_of_week between 0 and 6),
  specific_date   date,
  start_time      time not null,
  end_time        time not null,
  timezone        text not null default 'Asia/Kolkata',
  status          text not null default 'available' check (status in ('available', 'unavailable', 'tentative')),
  mode_preference text not null default 'any' check (mode_preference in ('online', 'offline', 'any')),
  max_weekly_hours numeric(4,1),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint chk_recurring check (type != 'recurring' or day_of_week is not null),
  constraint chk_exception check (type != 'exception' or specific_date is not null),
  constraint chk_time_order check (end_time > start_time)
);

create index idx_availability_volunteer on volunteer_availability(volunteer_id);
create index idx_availability_day on volunteer_availability(day_of_week) where type = 'recurring';
create index idx_availability_date on volunteer_availability(specific_date) where type = 'exception';

-- RLS
alter table volunteer_availability enable row level security;

create policy "Volunteers can read own availability"
  on volunteer_availability for select
  using (volunteer_id = auth.uid());

create policy "Volunteers can insert own availability"
  on volunteer_availability for insert
  with check (volunteer_id = auth.uid());

create policy "Volunteers can update own availability"
  on volunteer_availability for update
  using (volunteer_id = auth.uid());

create policy "Volunteers can delete own availability"
  on volunteer_availability for delete
  using (volunteer_id = auth.uid());

create policy "Admins can read all availability"
  on volunteer_availability for select
  using (
    exists (
      select 1 from volunteers
      where volunteers.id = auth.uid()
        and volunteers.is_admin = true
    )
  );
