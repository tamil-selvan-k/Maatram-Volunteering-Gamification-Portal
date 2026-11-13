-- Allow admins to delete registrations (remove a participant).
create policy "Registrations: admin delete"
  on registrations for delete
  using (is_current_user_admin());
