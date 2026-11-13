-- Allow admins to update registration status (select/decline participants)
create policy "Registrations: admin update"
  on registrations for update
  using (is_current_user_admin())
  with check (is_current_user_admin());
