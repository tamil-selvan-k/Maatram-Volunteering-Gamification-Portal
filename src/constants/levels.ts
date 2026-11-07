export interface LevelDefinition {
  level: number
  name: string
  minPoints: number
  maxPoints: number
  perks: string
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, name: 'Seed',    minPoints: 0,    maxPoints: 100,      perks: 'Browse & register for opportunities' },
  { level: 2, name: 'Sprout',  minPoints: 100,  maxPoints: 300,      perks: 'Visible on leaderboard' },
  { level: 3, name: 'Sapling', minPoints: 300,  maxPoints: 600,      perks: 'Can peer-verify other volunteers' },
  { level: 4, name: 'Tree',    minPoints: 600,  maxPoints: 1000,     perks: 'Priority boost for preferred activities' },
  { level: 5, name: 'Grove',   minPoints: 1000, maxPoints: 1800,     perks: 'Can mentor newcomers (+15% bonus)' },
  { level: 6, name: 'Forest',  minPoints: 1800, maxPoints: 3000,     perks: 'Featured on monthly spotlight' },
  { level: 7, name: 'Banyan',  minPoints: 3000, maxPoints: Infinity, perks: 'Legacy badge, community elder status' },
]

export const VERIFICATION_MULTIPLIERS = {
  self_report:   0.5,
  photo_pending: 0.7,
  qr_partial:    0.7,
  peer_partial:  0.8,
  qr_full:       1.0,
  qr_peer:       1.1,
  gold_standard: 1.25,
} as const

export const BADGE_DEFINITIONS = [
  // ── Milestone badges (awarded by points engine) ────────────────────────────
  { type: 'first_step',         name: 'First Step',         description: 'Complete your first verified activity',                  icon: '🌱', color: '#22C55E' },
  { type: 'five_events',        name: 'Five Events',        description: 'Complete 5 verified activities',                         icon: '✋', color: '#3B82F6' },
  { type: 'ten_events',         name: 'Ten Events',         description: 'Complete 10 verified activities',                        icon: '🔟', color: '#8B5CF6' },
  { type: 'twenty_five_events', name: '25 Events',          description: 'Complete 25 verified activities',                        icon: '🎖️', color: '#F97316' },
  { type: 'centurion',          name: 'Centurion',          description: 'Complete 100 verified activities',                       icon: '💯', color: '#EF4444' },
  // ── Streak badges ──────────────────────────────────────────────────────────
  { type: 'streak_3',           name: 'Streak 3',           description: 'Maintain a 3-month participation streak',                icon: '🔥', color: '#F97316' },
  { type: 'streak_6',           name: 'Streak 6',           description: 'Maintain a 6-month participation streak',                icon: '🔥', color: '#EF4444' },
  { type: 'streak_12',          name: 'Streak 12',          description: 'Maintain a 12-month participation streak',               icon: '🔥', color: '#DC2626' },
  // ── Quality badges ─────────────────────────────────────────────────────────
  { type: 'reliability_star',   name: 'Reliability Star',   description: '90%+ reliability with 10+ events',                      icon: '⭐', color: '#F5B800' },
  { type: 'gold_standard',      name: 'Gold Standard',      description: '10 activities with QR/peer full verification',           icon: '🏆', color: '#F5B800' },
  // ── Legacy display badges (not awarded by engine, shown for completeness) ──
  { type: 'school_champion',    name: 'School Champion',    description: 'Complete 5 school visits',                               icon: '🏫', color: '#3B82F6' },
  { type: 'all_rounder',        name: 'All-Rounder',        description: 'Complete 1 of every activity type',                     icon: '🌟', color: '#F5B800' },
  { type: 'mentor',             name: 'Mentor',             description: 'Mentor a new volunteer through 3 activities',           icon: '🤝', color: '#EC4899' },
] as const
