import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { Opportunity, OpportunityFilters, Result } from '@/types'

export async function getOpportunities(
  filters?: OpportunityFilters
): Promise<Result<Opportunity[]>> {
  try {
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'open')
      .order('event_date', { ascending: true })

    if (filters?.activityType) {
      query = query.eq('activity_type', filters.activityType)
    }
    if (filters?.mode) {
      query = query.eq('mode', filters.mode)
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) return { data: null, error: toAppError(error) }
    return { data: data as Opportunity[], error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getOpportunityById(id: string): Promise<Result<Opportunity>> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as Opportunity, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function registerInterest(
  volunteerId: string,
  opportunityId: string
): Promise<Result<{ id: string }>> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .insert({ volunteer_id: volunteerId, opportunity_id: opportunityId, status: 'registered' })
      .select('id')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as { id: string }, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
