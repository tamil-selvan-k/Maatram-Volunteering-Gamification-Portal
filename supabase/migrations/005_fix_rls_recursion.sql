-- Fix: infinite recursion in "Volunteers: read own" policy.
-- The policy queried `volunteers` to check is_admin, which re-fired the same
-- policy. Replace every inline `exists (select 1 from volunteers …)` check
-- with a SECURITY DEFINER helper that bypasses RLS entirely.

-- ─── Helper function ──────────────────────────────────────────────────────────

create or replace function is_current_user_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from volunteers where id = auth.uid()),
    false
  );
$$;

-- ─── Re-create volunteers policies ────────────────────────────────────────────
-- Drop the recursive policy and replace it with one that uses the helper.

drop policy if exists "Volunteers: read own" on volunteers;

create policy "Volunteers: read own"
  on volunteers for select
  using (auth.uid() = id or is_current_user_admin());

-- Allow admins to update any volunteer row (e.g. approve, set is_admin, etc.)
drop policy if exists "Volunteers: admin update" on volunteers;

create policy "Volunteers: admin update"
  on volunteers for update
  using (auth.uid() = id or is_current_user_admin());

-- ─── Fix other tables that also check is_admin via inline volunteers query ────
-- These policies query volunteers from outside the volunteers table, so they
-- don't cause recursion on their own — but switch them to the helper anyway
-- for consistency and to avoid the sub-select overhead.

drop policy if exists "Opportunities: read open"    on opportunities;
drop policy if exists "Opportunities: admin insert" on opportunities;
drop policy if exists "Opportunities: admin update" on opportunities;

create policy "Opportunities: read open"
  on opportunities for select
  using (status = 'open' or is_current_user_admin());

create policy "Opportunities: admin insert"
  on opportunities for insert
  with check (is_current_user_admin());

create policy "Opportunities: admin update"
  on opportunities for update
  using (is_current_user_admin());

drop policy if exists "Registrations: read own" on registrations;

create policy "Registrations: read own"
  on registrations for select
  using (volunteer_id = auth.uid() or is_current_user_admin());

drop policy if exists "Verifications: read own" on verifications;

create policy "Verifications: read own"
  on verifications for select
  using (
    exists (
      select 1 from registrations r
      where r.id = registration_id and r.volunteer_id = auth.uid()
    )
    or is_current_user_admin()
  );

drop policy if exists "Peer confirmations: read own" on peer_confirmations;

create policy "Peer confirmations: read own"
  on peer_confirmations for select
  using (confirmer_id = auth.uid() or is_current_user_admin());
