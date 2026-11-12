-- ─────────────────────────────────────────────────────────────────────────────
-- Maatram Foundation — dynamic activity types table
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists activity_types (
  id          uuid primary key default uuid_generate_v4(),
  key         text not null unique,  -- e.g. 'physical_event'
  label       text not null,         -- e.g. 'Physical Event'
  accent      text not null default '#6B7280',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table activity_types enable row level security;

create policy "Activity types: read all" on activity_types
  for select using (true);

create policy "Activity types: admin manage" on activity_types
  for all using (is_current_user_admin());

-- Seed the existing hardcoded types
insert into activity_types (key, label, accent) values
  ('physical_event',        'Physical Event',        '#EAB308'),
  ('physical_verification', 'Physical Verification', '#F97316'),
  ('school_visit',          'School Visit',          '#3B82F6'),
  ('office_bg_work',        'Office / BG Work',      '#A855F7'),
  ('telephone_verification','Telephone Verification','#22C55E'),
  ('other_small_work',      'Other Small Work',      '#6B7280')
on conflict (key) do nothing;
