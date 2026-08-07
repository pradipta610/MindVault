import { supabaseAdmin } from './supabaseAdmin'

// Mirrors app/composables/useFinanceScopes.ts: the UI always filters
// transactions by a scope_id (auto-creating a "Pribadi" scope the first
// time it has none), so a server-inserted row with scope_id = null is
// invisible in the app even though it's really there. Reuse whatever
// scope the UI already uses/would create, so bot-created transactions
// show up exactly like manual ones.
export const getDefaultScopeId = async (userId: string): Promise<string | null> => {
  const client = supabaseAdmin()

  const { data: existing, error: fetchError } = await client
    .from('finance_scopes')
    .select('id')
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error('[getDefaultScopeId] fetch failed:', fetchError)
    return null
  }
  if (existing) return existing.id as string

  const { data: created, error: createError } = await client
    .from('finance_scopes')
    .insert({ user_id: userId, name: 'Pribadi', emoji: '👤', color: '#f7ce28', position: 0 })
    .select('id')
    .single()

  if (createError) {
    console.error('[getDefaultScopeId] create failed:', createError)
    return null
  }
  return created.id as string
}
