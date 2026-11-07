// ─── Row types (what you get back from SELECT) ───────────────────────────────
// Must be `type` (not `interface`) to satisfy Record<string, unknown> constraint
// in @supabase/postgrest-js's GenericTable type.

type VolunteerRow = {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'student' | 'alumni' | 'supporter'
  employer_org: string | null
  preferences: string[]
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

type OpportunityRow = {
  id: string
  title: string
  description: string | null
  activity_type: string
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
  status: string
  qr_secret: string | null
  created_by: string
  created_at: string
}

type RegistrationRow = {
  id: string
  volunteer_id: string
  opportunity_id: string
  priority_score: number | null
  status: string
  waitlist_position: number | null
  registered_at: string
}

type VerificationRow = {
  id: string
  registration_id: string
  checkin_time: string | null
  checkout_time: string | null
  checkin_location: string | null
  checkout_location: string | null
  photo_url: string | null
  photo_location: string | null
  qr_payload: string | null
  peer_confirms: number
  verification_level: string
  verified_hours: number | null
  points_awarded: number | null
  admin_approved: boolean
  created_at: string
}

type PeerConfirmationRow = {
  id: string
  confirmer_volunteer_id: string
  confirmed_volunteer_id: string
  opportunity_id: string
  confirmed_at: string
}

type PointsLogRow = {
  id: string
  volunteer_id: string
  points: number
  reason: string
  reference_id: string | null
  created_at: string
}

type BadgeRow = {
  id: string
  volunteer_id: string
  badge_type: string
  badge_name: string
  earned_at: string
}

type NotificationRow = {
  id: string
  volunteer_id: string
  title: string
  body: string
  type: string
  read: boolean
  created_at: string
}

type LeaderboardMvRow = {
  id: string
  full_name: string
  role: string
  employer_org: string | null
  total_points: number
  level: number
  streak_months: number
  total_events: number
  total_hours: number
  rank: number
}

// ─── Insert / Update types ────────────────────────────────────────────────────

type VolunteerInsert = {
  id?: string
  email: string
  full_name: string
  phone?: string | null
  role?: 'student' | 'alumni' | 'supporter'
  employer_org?: string | null
  preferences?: string[]
  skills?: string[]
  consent_push?: boolean
  consent_email?: boolean
  consent_linkedin?: boolean
  reliability_score?: number
  total_points?: number
  level?: number
  streak_months?: number
  consecutive_rejections?: number
  times_selected?: number
  times_completed?: number
  created_at?: string
  is_active?: boolean
  do_not_contact?: boolean
  is_admin?: boolean
}

type OpportunityInsert = {
  id?: string
  title: string
  description?: string | null
  activity_type: string
  mode: 'online' | 'offline'
  location?: string | null
  location_lat?: number | null
  location_lng?: number | null
  event_date: string
  duration_hours: number
  total_slots: number
  registration_deadline: string
  required_skills?: string[]
  mandatory_skills?: string[]
  status?: string
  qr_secret?: string | null
  created_by: string
  created_at?: string
}

type RegistrationInsert = {
  id?: string
  volunteer_id: string
  opportunity_id: string
  priority_score?: number | null
  status?: string
  waitlist_position?: number | null
  registered_at?: string
}

type VerificationInsert = {
  id?: string
  registration_id: string
  checkin_time?: string | null
  checkout_time?: string | null
  checkin_location?: string | null
  checkout_location?: string | null
  photo_url?: string | null
  photo_location?: string | null
  qr_payload?: string | null
  peer_confirms?: number
  verification_level?: string
  verified_hours?: number | null
  points_awarded?: number | null
  admin_approved?: boolean
  created_at?: string
}

type PeerConfirmationInsert = {
  id?: string
  confirmer_volunteer_id: string
  confirmed_volunteer_id: string
  opportunity_id: string
  confirmed_at?: string
}

type PointsLogInsert = {
  id?: string
  volunteer_id: string
  points: number
  reason: string
  reference_id?: string | null
  created_at?: string
}

type BadgeInsert = {
  id?: string
  volunteer_id: string
  badge_type: string
  badge_name: string
  earned_at?: string
}

type NotificationInsert = {
  id?: string
  volunteer_id: string
  title: string
  body: string
  type?: string
  read?: boolean
  created_at?: string
}

// ─── Database type (matches @supabase/postgrest-js GenericTable / GenericSchema) ─

export type Database = {
  public: {
    Tables: {
      volunteers: {
        Row: VolunteerRow
        Insert: VolunteerInsert
        Update: Partial<VolunteerRow>
        Relationships: []
      }
      opportunities: {
        Row: OpportunityRow
        Insert: OpportunityInsert
        Update: Partial<OpportunityRow>
        Relationships: []
      }
      registrations: {
        Row: RegistrationRow
        Insert: RegistrationInsert
        Update: Partial<RegistrationRow>
        Relationships: []
      }
      verifications: {
        Row: VerificationRow
        Insert: VerificationInsert
        Update: Partial<VerificationRow>
        Relationships: []
      }
      peer_confirmations: {
        Row: PeerConfirmationRow
        Insert: PeerConfirmationInsert
        Update: Partial<PeerConfirmationRow>
        Relationships: []
      }
      points_log: {
        Row: PointsLogRow
        Insert: PointsLogInsert
        Update: Partial<PointsLogRow>
        Relationships: []
      }
      badges: {
        Row: BadgeRow
        Insert: BadgeInsert
        Update: Partial<BadgeRow>
        Relationships: []
      }
      notifications: {
        Row: NotificationRow
        Insert: NotificationInsert
        Update: Partial<NotificationRow>
        Relationships: []
      }
    }
    Views: {
      leaderboard_mv: {
        Row: LeaderboardMvRow
        Relationships: []
      }
    }
    Functions: {
      increment_peer_confirms: {
        Args: { p_volunteer_id: string; p_opportunity_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}
