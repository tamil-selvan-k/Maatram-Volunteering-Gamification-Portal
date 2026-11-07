import { LEVEL_DEFINITIONS, type LevelDefinition } from '@/constants/levels'

export function getLevelInfo(points: number): LevelDefinition {
  return (
    LEVEL_DEFINITIONS.find((l) => points >= l.minPoints && points < l.maxPoints) ??
    LEVEL_DEFINITIONS[0]!
  )
}

export function getLevelProgress(points: number): number {
  const level = getLevelInfo(points)
  if (level.maxPoints === Infinity) return 1
  return (points - level.minPoints) / (level.maxPoints - level.minPoints)
}

export function formatTimeLeft(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return 'Closed'
  const hours = Math.floor(ms / 3_600_000)
  return hours < 24 ? `${hours}h left` : `${Math.floor(hours / 24)}d left`
}

export function formatPoints(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatEventDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
