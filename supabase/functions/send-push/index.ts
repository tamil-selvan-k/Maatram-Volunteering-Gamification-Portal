import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushPayload {
  volunteer_id: string
  title: string
  body: string
  data?: Record<string, unknown>
}

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default'
  badge?: number
}

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload: PushPayload = await req.json()
    const { volunteer_id, title, body, data } = payload

    if (!volunteer_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Look up push token for the volunteer
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('volunteer_id', volunteer_id)
      .single()

    if (tokenErr || !tokenRow) {
      // No token registered — not an error, volunteer just hasn't enabled push
      return new Response(JSON.stringify({ status: 'no_token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const expoPushToken: string = tokenRow.token

    // Only send to valid Expo push tokens
    if (!expoPushToken.startsWith('ExponentPushToken[')) {
      return new Response(JSON.stringify({ status: 'invalid_token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const message: ExpoPushMessage = {
      to: expoPushToken,
      title,
      body,
      data: data ?? {},
      sound: 'default',
    }

    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!expoRes.ok) {
      const errText = await expoRes.text()
      return new Response(JSON.stringify({ error: 'Expo push failed', detail: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const expoData = await expoRes.json()
    return new Response(JSON.stringify({ status: 'sent', expo: expoData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
