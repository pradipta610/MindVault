// Minimal Telegram Bot API client. No SDK dependency; Telegram's HTTP API
// is simple enough not to need one.
export const sendTelegramMessage = async (chatId: number | string, text: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('sendTelegramMessage: TELEGRAM_BOT_TOKEN missing')
    return
  }
  try {
    await $fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      body: { chat_id: chatId, text },
    })
  } catch (e) {
    // Never let a failed reply crash the webhook — Telegram already got its 200.
    console.error('sendTelegramMessage failed:', e)
  }
}

// Photos arrive as a file_id, not bytes — Telegram requires a two-step
// fetch: resolve file_id -> file_path via getFile, then download from the
// file host. Returns base64 (what the Anthropic vision API wants) plus a
// best-guess media type from the file extension (Telegram always transcodes
// photos to jpeg, but this stays correct if that ever changes).
export const downloadTelegramPhoto = async (fileId: string): Promise<{ base64: string, mediaType: string } | null> => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('downloadTelegramPhoto: TELEGRAM_BOT_TOKEN missing')
    return null
  }
  try {
    const fileInfo: any = await $fetch(`https://api.telegram.org/bot${token}/getFile`, {
      query: { file_id: fileId },
    })
    const filePath = fileInfo?.result?.file_path
    if (!filePath) return null

    const bytes = await $fetch<ArrayBuffer>(`https://api.telegram.org/file/bot${token}/${filePath}`, {
      responseType: 'arrayBuffer',
    })

    const mediaType = filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
    return { base64: Buffer.from(bytes).toString('base64'), mediaType }
  } catch (e) {
    console.error('downloadTelegramPhoto failed:', e)
    return null
  }
}
