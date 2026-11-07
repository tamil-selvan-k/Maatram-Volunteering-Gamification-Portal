// ─── Domain enums ────────────────────────────────────────────────────────────

export type ActivityType =
  | 'physical_event'
  | 'physical_verification'
  | 'school_visit'
  | 'office_bg_work'
  | 'telephone_verification'
  | 'other_small_work'

export type VolunteerRole = 'student' | 'alumni' | 'supporter' | 'admin' | 'org_admin'

export type VerificationLevel =
  | 'self_report'
  | 'photo_pending'
  | 'qr_partial'
  | 'peer_partial'
  | 'qr_full'
  | 'qr_peer'
  | 'gold_standard'

export type RegistrationStatus =
  | 'registered'
  | 'selected'
  | 'waitlisted'
  | 'declined'
  | 'no_show'

export type OpportunityStatus =
  | 'open'
  | 'registration_closed'
  | 'allocated'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

// ─── Domain models ───────────────────────────────────────────────────────────

export interface Volunteer {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: VolunteerRole
  employer_org: string | null
  preferences: ActivityType[]
  skills: string[]
  consent_push: boolean
  consent_email: boolean
  consent_linkedin: boolean
  reliability_score: number
  total_points: number
  level: number
  streak_months: number
  consecutive_rejections: number
  times_selected: number
  times_completed: number
  created_at: string
  is_active: boolean
  do_not_contact: boolean
  is_admin: boolean
}

export interface Opportunity {
  id: string
  title: string
  description: string | null
  activity_type: ActivityType
  mode: 'online' | 'offline'
  location: string | null
  location_lat: number | null
  location_lng: number | null
  event_date: string
  duration_hours: number
  total_slots: number
  registration_deadline: string
  required_skills: string[]
  mandatory_skills: string[]
  status: OpportunityStatus
  qr_secret: string | null
  created_by: string
  created_at: string
}

export interface Registration {
  id: string
  volunteer_id: string
  opportunity_id: string
  priority_score: number | null
  status: RegistrationStatus
  waitlist_position: number | null
  registered_at: string
}

export interface Verification {
  id: string
  registration_id: string
  checkin_time: string | null
  checkout_time: string | null
  photo_url: string | null
  peer_confirms: number
  verification_level: VerificationLevel
  verified_hours: number | null
  points_awarded: number | null
  admin_approved: boolean
  created_at: string
}

export interface Badge {
  id: string
  volunteer_id: string
  badge_type: string
  badge_name: string
  earned_at: string
}

export interface LeaderboardEntry {
  id: string
  full_name: string
  role: VolunteerRole
  employer_org: string | null
  total_points: number
  level: number
  streak_months: number
  total_events: number
  total_hours: number
  rank: number
}

// ─── Utility types ───────────────────────────────────────────────────────────

export type Result<T, E = AppError> =
  | { data: T; error: null }
  | { data: null; error: E }

export interface AppError {
  code: string
  message: string
  originalError?: unknown
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface OpportunityFilters {
  activityType?: ActivityType | null
  mode?: 'online' | 'offline' | null
  search?: string
}
