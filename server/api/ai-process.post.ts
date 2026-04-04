export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { raw, apiKey } = body

  if (!apiKey) {
    throw createError({ statusCode: 400, message: 'API key is required' })
  }
  if (!raw) {
    throw createError({ statusCode: 400, message: 'Content is required' })
  }

  try {
    const response: any = await $fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Kamu adalah asisten produktivitas. Analisis catatan berikut dan kembalikan dalam format JSON dengan struktur:
{
  "title": "judul singkat deskriptif (bahasa yang sama dengan catatan)",
  "poin": ["poin utama 1", "poin utama 2", ...],
  "action": ["action item 1", "action item 2", ...],
  "fokus": "satu kalimat ringkasan fokus utama dari catatan ini"
}

Catatan:
${raw}

PENTING: Kembalikan HANYA JSON valid tanpa markdown, tanpa backtick, tanpa penjelasan tambahan.`,
          },
        ],
      },
    })

    const text = response.content[0].text
    try {
      return JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return { title: '', poin: [], action: [], fokus: '', _raw: text }
    }
  } catch (e: any) {
    console.error('Anthropic API error:', e)
    throw createError({
      statusCode: e.statusCode || 500,
      message: e.message || 'Failed to process with AI',
    })
  }
})
