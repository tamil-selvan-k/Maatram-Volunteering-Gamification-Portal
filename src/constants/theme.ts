export const COLORS = {
  bg:              '#0D0D0F',
  bgSecondary:     '#111115',
  surface:         '#1A1A1F',
  surfaceElevated: '#22222A',
  border:          '#2A2A30',
  borderStrong:    '#3A3A42',
  gold:            '#F5B800',
  goldLight:       '#FFD140',
  goldDark:        '#D4A000',
  muted:           '#9CA3AF',
  white:           '#FFFFFF',
  success:         '#22C55E',
  warning:         '#F97316',
  error:           '#EF4444',
} as const

export const SPACING = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
} as const

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 9999,
} as const

export const FONT = {
  weights: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  sizes: {
    xs:    11,
    sm:    13,
    base:  15,
    lg:    17,
    xl:    20,
    '2xl': 24,
    '3xl': 30,
  },
} as const
