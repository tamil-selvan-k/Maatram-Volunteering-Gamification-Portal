import type { ActivityType } from '@/types'

export const ACTIVITY_WEIGHTS: Record<ActivityType, number> = {
  physical_event:          6,
  physical_verification:   5,
  school_visit:            4,
  office_bg_work:          3,
  telephone_verification:  2,
  other_small_work:        1,
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  physical_event:          'Physical Event',
  physical_verification:   'Physical Verification',
  school_visit:            'School Visit',
  office_bg_work:          'Office BG Work',
  telephone_verification:  'Telephone Verification',
  other_small_work:        'Other Small Work',
}

export const ACTIVITY_BASE_POINTS_PER_HOUR: Record<ActivityType, number> = {
  physical_event:          60,
  physical_verification:   50,
  school_visit:            40,
  office_bg_work:          30,
  telephone_verification:  20,
  other_small_work:        10,
}

// Tailwind class sets for each activity type
export const ACTIVITY_STYLES: Record<ActivityType, { badge: string; text: string; dot: string }> = {
  physical_event:          { badge: 'bg-yellow-500/15 border border-yellow-500/30', text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  physical_verification:   { badge: 'bg-orange-500/15 border border-orange-500/30', text: 'text-orange-400',  dot: 'bg-orange-400' },
  school_visit:            { badge: 'bg-blue-500/15 border border-blue-500/30',     text: 'text-blue-400',    dot: 'bg-blue-400' },
  office_bg_work:          { badge: 'bg-purple-500/15 border border-purple-500/30', text: 'text-purple-400',  dot: 'bg-purple-400' },
  telephone_verification:  { badge: 'bg-green-500/15 border border-green-500/30',   text: 'text-green-400',   dot: 'bg-green-400' },
  other_small_work:        { badge: 'bg-gray-500/15 border border-gray-500/30',     text: 'text-gray-400',    dot: 'bg-gray-400' },
}
