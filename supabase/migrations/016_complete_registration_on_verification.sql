-- Migration 016: Add completed/cancelled to registration enum, auto-complete on verification
--
-- The original enum lacked 'completed' and 'cancelled' values.
-- The trigger_award_points_on_verification() awarded points but never
-- updated registration status, so volunteer completion counts stayed at 0.

-- Step 1: extend the enum (cannot run inside a transaction in some PG versions)
ALTER TYPE registration_status_enum ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE registration_status_enum ADD VALUE IF NOT EXISTS 'cancelled';

-- Step 2: replace trigger to also mark registration completed
create or replace function trigger_award_points_on_verification()
returns trigger
language plpgsql
security definer
as $$
declare
  v_volunteer_id   uuid;
  v_opportunity_id uuid;
  v_hours          numeric;
begin
  if new.verification_level is null or new.checkout_time is null then
    return new;
  end if;

  if new.points_awarded is not null then
    return new;
  end if;

  select r.volunteer_id, r.opportunity_id
    into v_volunteer_id, v_opportunity_id
  from registrations r
  where r.id = new.registration_id;

  v_hours := coalesce(
    new.verified_hours,
    extract(epoch from (new.checkout_time - new.checkin_time)) / 3600.0
  );

  if v_hours <= 0 then
    v_hours := 1.0;
  end if;

  declare v_points int;
  begin
    v_points := award_points(
      v_volunteer_id,
      v_opportunity_id,
      new.verification_level::text,
      v_hours
    );

    update verifications
    set points_awarded = v_points
    where id = new.id;
  end;

  -- mark registration as completed
  update registrations
  set status = 'completed'
  where id = new.registration_id
    and status = 'selected';

  return new;
end;
$$;

-- Retroactively fix already-verified registrations
update registrations
set status = 'completed'
where id in (
  select r.id
  from registrations r
  join verifications v on v.registration_id = r.id
  where r.status = 'selected'
    and v.checkout_time is not null
    and v.points_awarded is not null
);
