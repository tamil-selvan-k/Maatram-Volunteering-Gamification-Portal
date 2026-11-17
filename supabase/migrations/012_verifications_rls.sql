-- Allow volunteers to insert verification rows for their own registrations
create policy "Verifications: insert own"
  on verifications for insert
  with check (exists (
    select 1 from registrations r
    where r.id = registration_id and r.volunteer_id = auth.uid()
  ));

-- Allow volunteers to update verification rows for their own registrations
create policy "Verifications: update own"
  on verifications for update
  using (exists (
    select 1 from registrations r
    where r.id = registration_id and r.volunteer_id = auth.uid()
  ));

-- Allow admins to insert/update any verification
create policy "Verifications: admin insert"
  on verifications for insert
  with check (exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));

create policy "Verifications: admin update"
  on verifications for update
  using (exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));
