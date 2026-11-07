interface EmailPayload {
  to_email: string
  subject: string
  html_body: string
  volunteer_name: string
}

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS   = 'Maatram Foundation <noreply@maatram.org>'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload: EmailPayload = await req.json()
    const { to_email, subject, html_body, volunteer_name } = payload

    if (!to_email || !subject || !html_body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to_email, subject, html_body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY environment variable not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = {
      from:    FROM_ADDRESS,
      to:      [to_email],
      subject,
      html:    html_body,
    }

    const response = await fetch(RESEND_API_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorText }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log(`Email sent to ${to_email} (${volunteer_name}): ${result?.id ?? 'unknown-id'}`)

    return new Response(
      JSON.stringify({ success: true, id: result?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-email function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
