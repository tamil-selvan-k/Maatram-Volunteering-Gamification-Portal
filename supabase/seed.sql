-- ─────────────────────────────────────────────────────────────────────────────
-- Maatram Foundation — Phase 5 Seed Data (idempotent demo data)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Volunteers (8 users, fixed UUIDs for idempotency) ───────────────────────

INSERT INTO volunteers (
  id, email, full_name, phone, role,
  employer_org, preferences, skills,
  consent_push, consent_email, consent_linkedin,
  reliability_score, total_points, level, streak_months,
  consecutive_rejections, times_selected, times_completed,
  is_active, do_not_contact, is_admin
) VALUES
  -- Admin 1 (is_admin = true)
  (
    'a1000000-0000-0000-0000-000000000001',
    'arjun.kumar@maatram.org',
    'Arjun Kumar',
    '+919876543210',
    'alumni',
    'Maatram Foundation',
    ARRAY['physical_event','school_visit']::activity_type_enum[],
    ARRAY['Teaching','Event Management','Mentoring'],
    true, true, true,
    0.980, 1840, 5, 8,
    0, 12, 12,
    true, false, true
  ),
  -- Admin 2 (is_admin = true)
  (
    'a2000000-0000-0000-0000-000000000002',
    'priya.natarajan@maatram.org',
    'Priya Natarajan',
    '+919876543211',
    'alumni',
    'Tamil Nadu IT Pvt Ltd',
    ARRAY['physical_verification','office_bg_work']::activity_type_enum[],
    ARRAY['IT/Tech','Fundraising','Legal Aid'],
    true, true, false,
    0.950, 1250, 5, 6,
    0, 9, 9,
    true, false, true
  ),
  -- Volunteer 1
  (
    'b1000000-0000-0000-0000-000000000003',
    'karthik.rajan@example.com',
    'Karthik Rajan',
    '+919876543212',
    'student',
    'IIT Madras',
    ARRAY['school_visit','physical_event']::activity_type_enum[],
    ARRAY['Teaching','IT/Tech','Photography'],
    true, true, false,
    0.920, 640, 4, 4,
    0, 6, 6,
    true, false, false
  ),
  -- Volunteer 2
  (
    'b2000000-0000-0000-0000-000000000004',
    'meena.sundaram@example.com',
    'Meena Sundaram',
    '+919876543213',
    'supporter',
    'Apollo Hospitals',
    ARRAY['physical_event','telephone_verification']::activity_type_enum[],
    ARRAY['Healthcare','Counselling','Cooking'],
    true, true, true,
    0.880, 380, 3, 3,
    1, 5, 4,
    true, false, false
  ),
  -- Volunteer 3
  (
    'b3000000-0000-0000-0000-000000000005',
    'vikram.pillai@example.com',
    'Vikram Pillai',
    '+919876543214',
    'alumni',
    'Cognizant Technology',
    ARRAY['office_bg_work','physical_verification']::activity_type_enum[],
    ARRAY['IT/Tech','Transport','Event Management'],
    true, false, true,
    0.750, 160, 2, 1,
    2, 3, 2,
    true, false, false
  ),
  -- Volunteer 4
  (
    'b4000000-0000-0000-0000-000000000006',
    'kavitha.iyer@example.com',
    'Kavitha Iyer',
    '+919876543215',
    'student',
    'Anna University',
    ARRAY['school_visit','other_small_work']::activity_type_enum[],
    ARRAY['Teaching','Music/Arts','Sports Coaching'],
    true, true, false,
    0.830, 290, 3, 2,
    0, 4, 3,
    true, false, false
  ),
  -- Volunteer 5
  (
    'b5000000-0000-0000-0000-000000000007',
    'suresh.murugan@example.com',
    'Suresh Murugan',
    '+919876543216',
    'supporter',
    'Tamil Nadu Police',
    ARRAY['physical_event','physical_verification']::activity_type_enum[],
    ARRAY['Transport','Construction','Event Management'],
    true, true, false,
    0.900, 450, 3, 3,
    0, 5, 5,
    true, false, false
  ),
  -- Volunteer 6
  (
    'b6000000-0000-0000-0000-000000000008',
    'lakshmi.venkat@example.com',
    'Lakshmi Venkat',
    '+919876543217',
    'student',
    'MOP Vaishnav College',
    ARRAY['telephone_verification','other_small_work']::activity_type_enum[],
    ARRAY['Translation','Counselling','Fundraising'],
    true, true, false,
    0.670, 80, 1, 0,
    1, 2, 1,
    true, false, false
  )
ON CONFLICT (id) DO UPDATE SET
  email               = EXCLUDED.email,
  full_name           = EXCLUDED.full_name,
  reliability_score   = EXCLUDED.reliability_score,
  total_points        = EXCLUDED.total_points,
  level               = EXCLUDED.level,
  streak_months       = EXCLUDED.streak_months,
  times_selected      = EXCLUDED.times_selected,
  times_completed     = EXCLUDED.times_completed,
  is_admin            = EXCLUDED.is_admin;

-- ─── Opportunities (6 events) ────────────────────────────────────────────────

INSERT INTO opportunities (
  id, title, description, activity_type, mode,
  location, location_lat, location_lng,
  event_date, duration_hours, total_slots,
  registration_deadline, required_skills, mandatory_skills,
  status, qr_secret, created_by
) VALUES
  -- Past event 1 (completed)
  (
    'e1000000-0000-0000-0000-000000000001',
    'Flood Relief Distribution — Chennai North',
    'Distribute relief materials (food, water, medicines) to families affected by floods in North Chennai. Volunteers will work in teams of 3.',
    'physical_event',
    'offline',
    'Flood Relief Camp, Anna Nagar West, Chennai',
    13.085503, 80.209824,
    now() - interval '30 days',
    5.0,
    10,
    now() - interval '33 days',
    ARRAY['Transport','Event Management'],
    ARRAY[]::text[],
    'completed',
    'FLOOD-2026-SECRET-QR-01',
    'a1000000-0000-0000-0000-000000000001'
  ),
  -- Past event 2 (completed)
  (
    'e2000000-0000-0000-0000-000000000002',
    'Digital Literacy Camp — Tambaram',
    'Teach basic computer and smartphone skills to senior citizens and housewives in Tambaram. Session covers WhatsApp, banking apps, and government portals.',
    'school_visit',
    'offline',
    'Govt Hr Sec School, Tambaram, Chennai',
    12.924398, 80.125296,
    now() - interval '14 days',
    4.0,
    8,
    now() - interval '17 days',
    ARRAY['Teaching','IT/Tech'],
    ARRAY['Teaching']::text[],
    'completed',
    'DIGITAL-2026-SECRET-QR-02',
    'a1000000-0000-0000-0000-000000000001'
  ),
  -- Current event 1 (open, this week)
  (
    'e3000000-0000-0000-0000-000000000003',
    'Tree Plantation Drive — Guindy',
    'Plant 500 native tree saplings across Guindy National Park buffer zone. Tools and saplings provided. Wear comfortable clothes.',
    'physical_event',
    'offline',
    'Guindy National Park, Velachery Main Rd, Chennai',
    13.006673, 80.219724,
    now() + interval '2 days',
    4.0,
    15,
    now() + interval '1 day',
    ARRAY['Construction'],
    ARRAY[]::text[],
    'open',
    'TREE-2026-SECRET-QR-03',
    'a1000000-0000-0000-0000-000000000001'
  ),
  -- Current event 2 (open, this week)
  (
    'e4000000-0000-0000-0000-000000000004',
    'Blood Donation Camp — T Nagar',
    'Facilitate blood donation drive at the Maatram community centre. Assist donors, maintain records, and coordinate with medical staff.',
    'physical_verification',
    'offline',
    'Maatram Community Centre, T Nagar, Chennai',
    13.040890, 80.233483,
    now() + interval '4 days',
    6.0,
    12,
    now() + interval '3 days',
    ARRAY['Healthcare','Event Management'],
    ARRAY[]::text[],
    'open',
    'BLOOD-2026-SECRET-QR-04',
    'a2000000-0000-0000-0000-000000000002'
  ),
  -- Future event 1
  (
    'e5000000-0000-0000-0000-000000000005',
    'Senior Citizen Wellness Visit — Mylapore',
    'Home visits to elderly residents in Mylapore. Bring companionship, help with minor tasks, and check on their wellbeing. Partner with local temple trust.',
    'telephone_verification',
    'offline',
    'Sri Kapaleeshwarar Temple Area, Mylapore, Chennai',
    13.033680, 80.269409,
    now() + interval '18 days',
    3.0,
    5,
    now() + interval '15 days',
    ARRAY['Counselling','Healthcare'],
    ARRAY[]::text[],
    'open',
    'SENIOR-2026-SECRET-QR-05',
    'a2000000-0000-0000-0000-000000000002'
  ),
  -- Future event 2
  (
    'e6000000-0000-0000-0000-000000000006',
    'Youth Coding Workshop — Anna Nagar',
    'Two-day coding bootcamp for school students (Std 9-12). Teach HTML, CSS, basic Python. Laptop required. Lunch provided.',
    'school_visit',
    'offline',
    'Anna Nagar Community Hall, Chennai',
    13.089847, 80.210629,
    now() + interval '25 days',
    8.0,
    10,
    now() + interval '22 days',
    ARRAY['Teaching','IT/Tech'],
    ARRAY['Teaching','IT/Tech']::text[],
    'open',
    'CODING-2026-SECRET-QR-06',
    'a1000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO UPDATE SET
  title       = EXCLUDED.title,
  status      = EXCLUDED.status,
  event_date  = EXCLUDED.event_date;

-- ─── Registrations ───────────────────────────────────────────────────────────

-- Past event 1 (Flood Relief): 5 volunteers, 3 attended (selected)
INSERT INTO registrations (id, volunteer_id, opportunity_id, priority_score, status, registered_at) VALUES
  ('r1000000-0001-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 95.0, 'selected', now() - interval '35 days'),
  ('r1000000-0001-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 88.0, 'selected', now() - interval '35 days'),
  ('r1000000-0001-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001', 72.0, 'selected', now() - interval '35 days'),
  ('r1000000-0001-0000-0000-000000000004', 'b5000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000001', 65.0, 'declined',  now() - interval '34 days'),
  ('r1000000-0001-0000-0000-000000000005', 'b6000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000001', 50.0, 'no_show',   now() - interval '34 days')
ON CONFLICT (volunteer_id, opportunity_id) DO UPDATE SET status = EXCLUDED.status;

-- Past event 2 (Digital Literacy): 4 volunteers, 3 attended (selected)
INSERT INTO registrations (id, volunteer_id, opportunity_id, priority_score, status, registered_at) VALUES
  ('r2000000-0001-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002', 92.0, 'selected', now() - interval '18 days'),
  ('r2000000-0001-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000002', 80.0, 'selected', now() - interval '18 days'),
  ('r2000000-0001-0000-0000-000000000003', 'b4000000-0000-0000-0000-000000000006', 'e2000000-0000-0000-0000-000000000002', 76.0, 'selected', now() - interval '18 days'),
  ('r2000000-0001-0000-0000-000000000004', 'b5000000-0000-0000-0000-000000000007', 'e2000000-0000-0000-0000-000000000002', 60.0, 'no_show',  now() - interval '17 days')
ON CONFLICT (volunteer_id, opportunity_id) DO UPDATE SET status = EXCLUDED.status;

-- Current event 1 (Tree Plantation): 3 volunteers registered
INSERT INTO registrations (id, volunteer_id, opportunity_id, priority_score, status, registered_at) VALUES
  ('r3000000-0001-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000003', 85.0, 'selected',   now() - interval '3 days'),
  ('r3000000-0001-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000005', 'e3000000-0000-0000-0000-000000000003', 70.0, 'registered',  now() - interval '2 days'),
  ('r3000000-0001-0000-0000-000000000003', 'b6000000-0000-0000-0000-000000000008', 'e3000000-0000-0000-0000-000000000003', 45.0, 'registered',  now() - interval '1 day')
ON CONFLICT (volunteer_id, opportunity_id) DO UPDATE SET status = EXCLUDED.status;

-- Current event 2 (Blood Donation): 4 volunteers registered
INSERT INTO registrations (id, volunteer_id, opportunity_id, priority_score, status, registered_at) VALUES
  ('r4000000-0001-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000004', 96.0, 'selected',   now() - interval '2 days'),
  ('r4000000-0001-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000004', 'e4000000-0000-0000-0000-000000000004', 78.0, 'selected',   now() - interval '2 days'),
  ('r4000000-0001-0000-0000-000000000003', 'b4000000-0000-0000-0000-000000000006', 'e4000000-0000-0000-0000-000000000004', 66.0, 'registered',  now() - interval '1 day'),
  ('r4000000-0001-0000-0000-000000000004', 'b5000000-0000-0000-0000-000000000007', 'e4000000-0000-0000-0000-000000000004', 58.0, 'waitlisted',  now() - interval '1 day')
ON CONFLICT (volunteer_id, opportunity_id) DO UPDATE SET status = EXCLUDED.status;

-- ─── Verifications (for selected registrations from past events) ─────────────

-- Past event 1 — 3 verified registrations
INSERT INTO verifications (
  id, registration_id,
  checkin_time, checkout_time,
  peer_confirms, verification_level,
  verified_hours, points_awarded, admin_approved
) VALUES
  (
    'v1000000-0001-0000-0000-000000000001',
    'r1000000-0001-0000-0000-000000000001',
    now() - interval '30 days',
    now() - interval '30 days' + interval '5 hours',
    2, 'qr_peer', 5.0, 330, true
  ),
  (
    'v1000000-0001-0000-0000-000000000002',
    'r1000000-0001-0000-0000-000000000002',
    now() - interval '30 days',
    now() - interval '30 days' + interval '4 hours',
    1, 'photo_and_qr'::text::verification_level_enum,
    4.0, 240, true
  ),
  (
    'v1000000-0001-0000-0000-000000000003',
    'r1000000-0001-0000-0000-000000000003',
    now() - interval '30 days',
    now() - interval '30 days' + interval '4 hours 30 minutes',
    0, 'qr_full', 4.5, 270, true
  )
ON CONFLICT (registration_id) DO UPDATE SET
  verified_hours  = EXCLUDED.verified_hours,
  points_awarded  = EXCLUDED.points_awarded,
  admin_approved  = EXCLUDED.admin_approved;

-- Past event 2 — 3 verified registrations
INSERT INTO verifications (
  id, registration_id,
  checkin_time, checkout_time,
  peer_confirms, verification_level,
  verified_hours, points_awarded, admin_approved
) VALUES
  (
    'v2000000-0001-0000-0000-000000000001',
    'r2000000-0001-0000-0000-000000000001',
    now() - interval '14 days',
    now() - interval '14 days' + interval '4 hours',
    2, 'qr_peer', 4.0, 176, true
  ),
  (
    'v2000000-0001-0000-0000-000000000002',
    'r2000000-0001-0000-0000-000000000002',
    now() - interval '14 days',
    now() - interval '14 days' + interval '3 hours',
    1, 'qr_full', 3.0, 120, true
  ),
  (
    'v2000000-0001-0000-0000-000000000003',
    'r2000000-0001-0000-0000-000000000003',
    now() - interval '14 days',
    now() - interval '14 days' + interval '3 hours 30 minutes',
    0, 'self_report', 3.5, 70, true
  )
ON CONFLICT (registration_id) DO UPDATE SET
  verified_hours  = EXCLUDED.verified_hours,
  points_awarded  = EXCLUDED.points_awarded,
  admin_approved  = EXCLUDED.admin_approved;

-- ─── Points log ──────────────────────────────────────────────────────────────

-- Flood Relief event points
INSERT INTO points_log (id, volunteer_id, points, reason, reference_id, created_at) VALUES
  ('p1000000-0001-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 330, 'Flood Relief Distribution — qr_peer verification (5h × 60 × 1.1 bonus)', 'e1000000-0000-0000-0000-000000000001', now() - interval '30 days'),
  ('p1000000-0001-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 240, 'Flood Relief Distribution — photo_and_qr verification (4h × 60 × 1.0)', 'e1000000-0000-0000-0000-000000000001', now() - interval '30 days'),
  ('p1000000-0001-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000005', 270, 'Flood Relief Distribution — qr_full verification (4.5h × 60 × 1.0)', 'e1000000-0000-0000-0000-000000000001', now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- Digital Literacy event points
INSERT INTO points_log (id, volunteer_id, points, reason, reference_id, created_at) VALUES
  ('p2000000-0001-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 176, 'Digital Literacy Camp — qr_peer verification (4h × 40 × 1.1)', 'e2000000-0000-0000-0000-000000000002', now() - interval '14 days'),
  ('p2000000-0001-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000004', 120, 'Digital Literacy Camp — qr_full verification (3h × 40 × 1.0)', 'e2000000-0000-0000-0000-000000000002', now() - interval '14 days'),
  ('p2000000-0001-0000-0000-000000000003', 'b4000000-0000-0000-0000-000000000006', 70,  'Digital Literacy Camp — self_report verification (3.5h × 40 × 0.5)', 'e2000000-0000-0000-0000-000000000002', now() - interval '14 days')
ON CONFLICT (id) DO NOTHING;

-- ─── Badges ──────────────────────────────────────────────────────────────────

INSERT INTO badges (id, volunteer_id, badge_type, badge_name, earned_at) VALUES
  -- Arjun Kumar: first_step, five_events, streak_3, reliability_star
  ('bg000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'first_step',       'First Step',         now() - interval '180 days'),
  ('bg000001-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'five_events',      'Five Events',        now() - interval '150 days'),
  ('bg000001-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'streak_3',         'Streak 3',           now() - interval '90 days'),
  ('bg000001-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'reliability_star', 'Reliability Star',   now() - interval '60 days'),
  ('bg000001-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'ten_events',       'Ten Events',         now() - interval '30 days'),
  -- Priya Natarajan: first_step, five_events, streak_3
  ('bg000002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'first_step',       'First Step',         now() - interval '160 days'),
  ('bg000002-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'five_events',      'Five Events',        now() - interval '120 days'),
  ('bg000002-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'streak_3',         'Streak 3',           now() - interval '60 days'),
  -- Karthik Rajan: first_step, five_events
  ('bg000003-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'first_step',       'First Step',         now() - interval '120 days'),
  ('bg000003-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'five_events',      'Five Events',        now() - interval '45 days'),
  -- Suresh Murugan: first_step
  ('bg000004-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000007', 'first_step',       'First Step',         now() - interval '90 days')
ON CONFLICT (volunteer_id, badge_type) DO NOTHING;

-- ─── Notifications ───────────────────────────────────────────────────────────

INSERT INTO notifications (id, volunteer_id, title, body, type, read, created_at) VALUES
  -- Arjun Kumar
  ('n1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Badge Earned: Ten Events', 'You have completed 10 verified activities. Keep it up!',
   'badge_earned', false, now() - interval '30 days'),
  ('n1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   '330 points awarded', 'You earned 330 points for Flood Relief Distribution.',
   'points_awarded', true, now() - interval '30 days'),
  -- Priya Natarajan
  ('n2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
   '176 points awarded', 'You earned 176 points for Digital Literacy Camp.',
   'points_awarded', true, now() - interval '14 days'),
  ('n2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002',
   'New opportunity: Blood Donation Camp', 'A new Physical Verification opportunity matches your preferences.',
   'opportunity_selected', false, now() - interval '3 days'),
  -- Karthik Rajan
  ('n3000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003',
   'Badge Earned: Five Events', 'You have completed 5 verified activities. You are on a roll!',
   'badge_earned', false, now() - interval '45 days'),
  ('n3000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003',
   'Selected: Tree Plantation Drive', 'Congratulations! You have been selected for Tree Plantation Drive — Guindy.',
   'opportunity_selected', false, now() - interval '3 days'),
  -- Meena Sundaram
  ('n4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000004',
   '120 points awarded', 'You earned 120 points for Digital Literacy Camp.',
   'points_awarded', true, now() - interval '14 days'),
  ('n4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000004',
   'Selected: Blood Donation Camp', 'You have been selected for Blood Donation Camp — T Nagar.',
   'opportunity_selected', false, now() - interval '2 days'),
  -- Lakshmi Venkat
  ('n5000000-0000-0000-0000-000000000001', 'b6000000-0000-0000-0000-000000000008',
   'Welcome to Maatram!', 'Your profile is all set. Browse open opportunities and start volunteering.',
   'general', true, now() - interval '7 days')
ON CONFLICT (id) DO NOTHING;

-- ─── Update volunteer aggregates from actual data ─────────────────────────────

UPDATE volunteers v SET
  total_points    = COALESCE((
    SELECT SUM(points) FROM points_log WHERE volunteer_id = v.id
  ), 0) + (
    -- add base points to preserve existing totals above seed
    CASE v.id
      WHEN 'a1000000-0000-0000-0000-000000000001' THEN 1510
      WHEN 'a2000000-0000-0000-0000-000000000002' THEN 1074
      WHEN 'b1000000-0000-0000-0000-000000000003' THEN 400
      WHEN 'b2000000-0000-0000-0000-000000000004' THEN 260
      WHEN 'b3000000-0000-0000-0000-000000000005' THEN 160
      WHEN 'b4000000-0000-0000-0000-000000000006' THEN 220
      WHEN 'b5000000-0000-0000-0000-000000000007' THEN 450
      WHEN 'b6000000-0000-0000-0000-000000000008' THEN 80
      ELSE 0
    END
  ),
  times_completed = (
    SELECT COUNT(*) FROM registrations
    WHERE volunteer_id = v.id AND status = 'selected'
  ),
  times_selected  = (
    SELECT COUNT(*) FROM registrations
    WHERE volunteer_id = v.id AND status IN ('selected', 'waitlisted', 'registered')
  )
WHERE v.id IN (
  'a1000000-0000-0000-0000-000000000001',
  'a2000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000003',
  'b2000000-0000-0000-0000-000000000004',
  'b3000000-0000-0000-0000-000000000005',
  'b4000000-0000-0000-0000-000000000006',
  'b5000000-0000-0000-0000-000000000007',
  'b6000000-0000-0000-0000-000000000008'
);

-- Refresh leaderboard materialized view if it exists
DO $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_mv;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW leaderboard_mv;
END;
$$;
