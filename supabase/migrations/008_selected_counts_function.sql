-- Returns the count of 'selected' registrations per opportunity.
-- Runs as SECURITY DEFINER so all users see the same slot counts
-- regardless of RLS on the registrations table.
create or replace function get_selected_counts(opp_ids uuid[])
returns table(opportunity_id uuid, count bigint)
language sql
security definer
stable
as $$
  select r.opportunity_id, count(*)::bigint
  from registrations r
  where r.opportunity_id = any(opp_ids)
    and r.status = 'selected'
  group by r.opportunity_id;
$$;
