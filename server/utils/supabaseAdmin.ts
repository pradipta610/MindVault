import { createClient } from '@supabase/supabase-js'

// Service-role client for server routes that have no browser session to
// piggyback on (e.g. the Telegram webhook, which is called by Telegram's
// servers, not the user's browser). Bypasses RLS — only use it after the
// caller has been verified some other way (see the webhook's chat-id check).
let client: ReturnType<typeof createClient> | null = null

export const supabaseAdmin = () => {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase service role tidak dikonfigurasi' })
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}
