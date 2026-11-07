-- ─────────────────────────────────────────────────────────────────────────────
-- Maatram Foundation — auto-create volunteer row when a new auth user signs up
-- ─────────────────────────────────────────────────────────────────────────────

-- Function called by the trigger; runs as the DB owner so it bypasses RLS.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  insert into public.volunteers (
    id,
    email,
    full_name,
    phone,
    role,
    employer_org
  ) values (
    new.id,
    new.email,
    coalesce(nullif(trim(meta->>'full_name'), ''), 'New Volunteer'),
    nullif(trim(meta->>'phone'), ''),
    coalesce(
      (meta->>'role')::volunteer_role_enum,
      'student'::volunteer_role_enum
    ),
    nullif(trim(meta->>'employer_org'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger fires after every INSERT on auth.users (i.e. on every new sign-up).
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();
