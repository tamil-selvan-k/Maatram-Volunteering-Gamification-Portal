-- ─────────────────────────────────────────────────────────────────────────────
-- Maatram Foundation — Phase 3: Points Engine
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pg_net";

-- ─── push_tokens table ───────────────────────────────────────────────────────
create table if not exists push_tokens (
  id           uuid primary key default uuid_generate_v4(),
  volunteer_id uuid        not null references volunteers(id) on delete cascade,
  token        text        not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (volunteer_id)
);

alter table push_tokens enable row level security;

create policy "push_tokens: read own"
  on push_tokens for select
  using (volunteer_id = auth.uid());

create policy "push_tokens: upsert own"
  on push_tokens for insert
  with check (volunteer_id = auth.uid());

create policy "push_tokens: update own"
  on push_tokens for update
  using (volunteer_id = auth.uid());

-- ─── compute_final_points ────────────────────────────────────────────────────
-- formula: floor(base_points × (multiplier_x10 / 10.0) × bonus_total)
-- bonus_total = 1 + sum of active flag values
--   first_type_bonus  = 0.20
--   mentoring_bonus   = 0.15
--   weekend_bonus     = 0.10
--   streak_bonuses    = jsonb array of values, capped at 0.25 total
create or replace function compute_final_points(
  base_points    int,
  multiplier_x10 int,
  bonus_flags    jsonb
) returns int
language plpgsql
immutable
as $$
declare
  bonus_total     numeric := 1.0;
  streak_arr      jsonb;
  streak_elem     jsonb;
  streak_subtotal numeric := 0.0;
  v               numeric;
begin
  -- fixed bonuses
  if (bonus_flags->>'first_type_bonus')::boolean then
    bonus_total := bonus_total + 0.20;
  end if;

  if (bonus_flags->>'mentoring_bonus')::boolean then
    bonus_total := bonus_total + 0.15;
  end if;

  if (bonus_flags->>'weekend_bonus')::boolean then
    bonus_total := bonus_total + 0.10;
  end if;

  -- streak bonuses array, capped at 0.25
  streak_arr := bonus_flags->'streak_bonuses';
  if streak_arr is not null and jsonb_typeof(streak_arr) = 'array' then
    for streak_elem in select * from jsonb_array_elements(streak_arr)
    loop
      v := (streak_elem #>> '{}')::numeric;
      streak_subtotal := streak_subtotal + v;
    end loop;
    streak_subtotal := least(streak_subtotal, 0.25);
    bonus_total := bonus_total + streak_subtotal;
  end if;

  return floor(base_points::numeric * (multiplier_x10::numeric / 10.0) * bonus_total)::int;
end;
$$;

-- ─── update_volunteer_streak ─────────────────────────────────────────────────
-- Recalculates streak_months by finding consecutive months with activity ending now
create or replace function update_volunteer_streak(p_volunteer_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  streak       int := 0;
  check_month  date := date_trunc('month', now())::date;
  has_activity boolean;
begin
  loop
    select exists(
      select 1 from points_log
      where volunteer_id = p_volunteer_id
        and date_trunc('month', created_at) = check_month
    ) into has_activity;

    exit when not has_activity;

    streak := streak + 1;
    check_month := (check_month - interval '1 month')::date;
  end loop;

  update volunteers set streak_months = streak where id = p_volunteer_id;
end;
$$;

-- ─── check_and_award_badges ──────────────────────────────────────────────────
create or replace function check_and_award_badges(p_volunteer_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_completed      int;
  v_streak         int;
  v_reliability    numeric;
  v_gold_verifs    int;

  -- badge record
  b_type  text;
  b_name  text;
begin
  -- load volunteer stats
  select times_completed, streak_months, reliability_score
    into v_completed, v_streak, v_reliability
  from volunteers
  where id = p_volunteer_id;

  -- count gold-quality verifications (qr_full, qr_peer, gold_standard)
  select count(*)::int into v_gold_verifs
  from verifications ve
  join registrations r on r.id = ve.registration_id
  where r.volunteer_id = p_volunteer_id
    and ve.verification_level in ('qr_full', 'qr_peer', 'gold_standard');

  -- helper to conditionally insert badge + notify
  -- we iterate over candidate badges
  for b_type, b_name in values
    ('first_step',        'First Step'),
    ('five_events',       'Five Events'),
    ('ten_events',        'Ten Events'),
    ('twenty_five_events','25 Events'),
    ('streak_3',          'Streak 3'),
    ('streak_6',          'Streak 6'),
    ('streak_12',         'Streak 12'),
    ('reliability_star',  'Reliability Star'),
    ('centurion',         'Centurion'),
    ('gold_standard',     'Gold Standard')
  loop
    -- skip already earned
    continue when exists (
      select 1 from badges
      where volunteer_id = p_volunteer_id and badge_type = b_type
    );

    -- check condition per badge type
    declare earned boolean := false;
    begin
      case b_type
        when 'first_step'         then earned := v_completed >= 1;
        when 'five_events'        then earned := v_completed >= 5;
        when 'ten_events'         then earned := v_completed >= 10;
        when 'twenty_five_events' then earned := v_completed >= 25;
        when 'streak_3'           then earned := v_streak >= 3;
        when 'streak_6'           then earned := v_streak >= 6;
        when 'streak_12'          then earned := v_streak >= 12;
        when 'reliability_star'   then earned := v_reliability >= 0.9 and v_completed >= 10;
        when 'centurion'          then earned := v_completed >= 100;
        when 'gold_standard'      then earned := v_gold_verifs >= 10;
        else earned := false;
      end case;

      if earned then
        insert into badges (volunteer_id, badge_type, badge_name)
        values (p_volunteer_id, b_type, b_name)
        on conflict (volunteer_id, badge_type) do nothing;

        -- notify volunteer about new badge
        insert into notifications (volunteer_id, title, body, type)
        values (
          p_volunteer_id,
          'Badge Unlocked! 🏆',
          'You earned the "' || b_name || '" badge.',
          'badge_earned'
        );
      end if;
    end;
  end loop;
end;
$$;

-- ─── award_points ─────────────────────────────────────────────────────────────
create or replace function award_points(
  p_volunteer_id      uuid,
  p_opportunity_id    uuid,
  p_verification_level text,
  p_hours             numeric
) returns int
language plpgsql
security definer
as $$
declare
  v_activity_type   text;
  v_base_per_hour   int;
  v_base_points     int;
  v_multiplier_x10  int;
  v_bonus_flags     jsonb;
  v_is_weekend      boolean;
  v_final_points    int;
  v_streak_months   int;
  v_streak_bonus    numeric;
  v_is_first_type   boolean;
  v_level_before    int;
  v_level_after     int;
  v_new_total       int;
  v_times_completed int;
begin
  -- look up opportunity activity type
  select activity_type::text into v_activity_type
  from opportunities
  where id = p_opportunity_id;

  if v_activity_type is null then
    raise exception 'Opportunity not found: %', p_opportunity_id;
  end if;

  -- base points per hour lookup
  v_base_per_hour := case v_activity_type
    when 'physical_event'         then 60
    when 'physical_verification'  then 50
    when 'school_visit'           then 40
    when 'office_bg_work'         then 30
    when 'telephone_verification' then 20
    when 'other_small_work'       then 10
    else 10
  end;

  v_base_points := round(v_base_per_hour * p_hours)::int;

  -- multiplier x10 lookup
  v_multiplier_x10 := case p_verification_level
    when 'self_report'  then 5
    when 'photo_pending'then 7
    when 'qr_partial'   then 7
    when 'peer_partial' then 8
    when 'qr_full'      then 10
    when 'qr_peer'      then 11
    when 'gold_standard'then 13
    else 5
  end;

  -- weekend bonus: check if opportunity event date is Saturday (6) or Sunday (0)
  select extract(dow from o.event_date) in (0, 6) into v_is_weekend
  from opportunities o where o.id = p_opportunity_id;

  -- first-type bonus: has volunteer done this activity type before?
  -- reference_id in points_log stores the opportunity UUID, so join directly.
  select not exists (
    select 1
    from points_log pl
    join opportunities o2 on o2.id = pl.reference_id
    where pl.volunteer_id = p_volunteer_id
      and o2.activity_type::text = v_activity_type
  ) into v_is_first_type;

  -- streak bonus: 0.05 per streak month up to 5 months
  select streak_months, level into v_streak_months, v_level_before
  from volunteers
  where id = p_volunteer_id;

  v_streak_bonus := least(v_streak_months * 0.05, 0.25);

  -- build bonus_flags
  v_bonus_flags := jsonb_build_object(
    'first_type_bonus', v_is_first_type,
    'mentoring_bonus',  false,
    'weekend_bonus',    v_is_weekend,
    'streak_bonuses',   jsonb_build_array(v_streak_bonus)
  );

  v_final_points := compute_final_points(v_base_points, v_multiplier_x10, v_bonus_flags);

  -- insert points log entry
  insert into points_log (volunteer_id, points, reason, reference_id)
  values (
    p_volunteer_id,
    v_final_points,
    'Activity completion: ' || v_activity_type || ' (' || p_verification_level || ')',
    p_opportunity_id
  );

  -- update volunteer total_points, times_completed, level
  update volunteers
  set
    total_points     = total_points + v_final_points,
    times_completed  = times_completed + 1,
    level = (
      case
        when total_points + v_final_points < 100   then 1
        when total_points + v_final_points < 300   then 2
        when total_points + v_final_points < 600   then 3
        when total_points + v_final_points < 1000  then 4
        when total_points + v_final_points < 1800  then 5
        when total_points + v_final_points < 3000  then 6
        else 7
      end
    )
  where id = p_volunteer_id
  returning total_points, level, times_completed
    into v_new_total, v_level_after, v_times_completed;

  -- notify if levelled up
  if v_level_after > v_level_before then
    insert into notifications (volunteer_id, title, body, type)
    values (
      p_volunteer_id,
      'Level Up! 🌟',
      'You reached level ' || v_level_after || '!',
      'points_awarded'
    );
  end if;

  -- award points notification
  insert into notifications (volunteer_id, title, body, type)
  values (
    p_volunteer_id,
    'Points Awarded',
    v_final_points || ' points awarded for completing an activity.',
    'points_awarded'
  );

  -- update streak
  perform update_volunteer_streak(p_volunteer_id);

  -- check and award badges
  perform check_and_award_badges(p_volunteer_id);

  -- refresh leaderboard
  perform refresh_leaderboard();

  return v_final_points;
end;
$$;

-- ─── update verifications: add check_out_time column alias ───────────────────
-- The verifications table has checkout_time; we reference it as check_out_time
-- in trigger for clarity. No migration needed – use existing column.

-- ─── trigger: after_verification_complete ────────────────────────────────────
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
  -- only fire when verification level set and checkout occurred
  if new.verification_level is null or new.checkout_time is null then
    return new;
  end if;

  -- skip if points already awarded
  if new.points_awarded is not null then
    return new;
  end if;

  -- look up registration → volunteer + opportunity
  select r.volunteer_id, r.opportunity_id
    into v_volunteer_id, v_opportunity_id
  from registrations r
  where r.id = new.registration_id;

  -- compute verified hours
  v_hours := coalesce(
    new.verified_hours,
    extract(epoch from (new.checkout_time - new.checkin_time)) / 3600.0
  );

  if v_hours <= 0 then
    v_hours := 1.0;
  end if;

  -- award points
  declare v_points int;
  begin
    v_points := award_points(
      v_volunteer_id,
      v_opportunity_id,
      new.verification_level::text,
      v_hours
    );

    -- stamp points_awarded back onto verification row
    update verifications
    set points_awarded = v_points
    where id = new.id;
  end;

  return new;
end;
$$;

drop trigger if exists after_verification_complete on verifications;

create trigger after_verification_complete
  after update on verifications
  for each row
  when (
    new.verification_level is not null
    and new.checkout_time is not null
    and old.points_awarded is null
    and new.points_awarded is null
  )
  execute function trigger_award_points_on_verification();

-- ─── push notification trigger (via pg_net) ──────────────────────────────────
create or replace function trigger_send_push_on_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  v_edge_url text;
  v_token    text;
begin
  v_edge_url := current_setting('app.edge_function_url', true);

  if v_edge_url is null or v_edge_url = '' then
    return new;
  end if;

  -- fire-and-forget POST to Edge Function
  perform net.http_post(
    url     := v_edge_url || '/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := jsonb_build_object(
      'volunteer_id', new.volunteer_id,
      'title',        new.title,
      'body',         new.body,
      'data',         jsonb_build_object('type', new.type)
    )
  );

  return new;
exception when others then
  -- never block the insert
  return new;
end;
$$;

drop trigger if exists on_notification_insert on notifications;

create trigger on_notification_insert
  after insert on notifications
  for each row
  execute function trigger_send_push_on_notification();
