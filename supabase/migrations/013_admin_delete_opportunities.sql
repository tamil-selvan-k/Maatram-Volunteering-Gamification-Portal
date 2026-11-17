-- Allow admins to delete opportunities
create policy "Opportunities: admin delete"
  on opportunities for delete
  using (exists (
    select 1 from volunteers where id = auth.uid() and is_admin = true
  ));
