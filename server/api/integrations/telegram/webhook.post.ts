import { sendTelegramMessage } from '../../../utils/telegram'

// Phase 1 (see project chat history): just prove the Telegram -> MindVault
// wire is alive. No transaction parsing, no AI, no DB writes yet — that's
// Phase 2, built on top of this once the connection itself is confirmed
// working end to end.
//
// Telegram calls this endpoint directly (no browser session), so it can't
// use the RLS-backed client the rest of the app uses. Two independent
// checks keep it from being an open relay:
//  1. `secret_token` header must match what we gave Telegram in setWebhook.
//  2. The message's chat id must match the one allowed chat (our own).
// Telegram requires a fast 2xx response regardless of what happens inside,
// or it will retry the same update repeatedly — so every path below
// resolves 200, and failures are logged rather than thrown.
export default defineEventHandler(async (event) => {
  const secretHeader = getHeader(event, 'x-telegram-bot-api-secret-token')
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    setResponseStatus(event, 401)
    return { ok: false }
  }

  const body = await readBody(event)
  const message = body?.message
  const chatId = message?.chat?.id

  if (!chatId || String(chatId) !== process.env.TELEGRAM_ALLOWED_CHAT_ID) {
    // Not our chat — acknowledge quietly, don't reveal anything to a stranger's bot message.
    return { ok: true }
  }

  const text = message?.text as string | undefined
  const hasPhoto = Array.isArray(message?.photo) && message.photo.length > 0

  console.log('[telegram-webhook] received', { hasText: !!text, hasPhoto })

  await sendTelegramMessage(
    chatId,
    hasPhoto
      ? '📸 Foto diterima. (Parsing struk/QRIS belum aktif — masih Phase 1.)'
      : `✅ MindVault nerima: "${text ?? '(pesan tanpa teks)'}"`
  )

  return { ok: true }
})
