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
  { type: 'first_step',       name: 'First Step',       description: 'Complete your first verified activity',        icon: '🌱', color: '#22C55E' },
  { type: 'school_champion',  name: 'School Champion',  description: 'Complete 5 school visits',                     icon: '🏫', color: '#3B82F6' },
  { type: 'interview_pro',    name: 'Interview Pro',    description: 'Complete 10 mock interviews',                  icon: '🎤', color: '#8B5CF6' },
  { type: 'verification_ace', name: 'Verification Ace', description: 'Complete 15 telephone/physical verifications', icon: '✅', color: '#F97316' },
  { type: 'all_rounder',      name: 'All-Rounder',      description: 'Complete 1 of every activity type',            icon: '🌟', color: '#F5B800' },
  { type: 'consistent',       name: 'Consistent',       description: 'Maintain a 3-month participation streak',      icon: '🔥', color: '#EF4444' },
  { type: 'mentor',           name: 'Mentor',           description: 'Mentor a new volunteer through 3 activities',  icon: '🤝', color: '#EC4899' },
  { type: 'show_up',          name: '100% Show-Up',     description: '10+ events with 100% attendance',              icon: '💯', color: '#06B6D4' },
  { type: 'gold_standard',    name: 'Gold Standard',    description: '10 activities with full verification',         icon: '🏆', color: '#F5B800' },
] as const
