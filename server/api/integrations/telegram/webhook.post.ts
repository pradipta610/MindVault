import { sendTelegramMessage } from '../../../utils/telegram'
import { parseFinanceText } from '../../../utils/parseFinanceText'
import { supabaseAdmin } from '../../../utils/supabaseAdmin'

// Phase 2: text messages become real transactions in `transactions`.
// Photos (struk/QRIS) still just get acknowledged — OCR/AI is a later
// phase, same reasoning as before: prove each step works before adding
// the next one.
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

  const text = (message?.text as string | undefined)?.trim()
  const hasPhoto = Array.isArray(message?.photo) && message.photo.length > 0

  if (hasPhoto) {
    await sendTelegramMessage(chatId, '📸 Foto diterima. (Parsing struk/QRIS belum aktif.)')
    return { ok: true }
  }

  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, 'Kirim catatan transaksi, contoh:\n"jajan 25000 kopi"\n"gaji 5000000"')
    return { ok: true }
  }

  const parsed = parseFinanceText(text)
  if (!parsed) {
    await sendTelegramMessage(chatId, '⚠️ Nggak nemu nominal di pesan itu. Coba sertakan angka, misal "jajan 25000 kopi".')
    return { ok: true }
  }

  const userId = process.env.TELEGRAM_MINDVAULT_USER_ID
  if (!userId) {
    console.error('[telegram-webhook] TELEGRAM_MINDVAULT_USER_ID missing')
    await sendTelegramMessage(chatId, '⚠️ Bot belum dikonfigurasi lengkap di server.')
    return { ok: true }
  }

  const date = new Date((message.date + 7 * 3600) * 1000).toISOString().split('T')[0]

  const { error } = await supabaseAdmin()
    .from('transactions')
    .insert({
      user_id: userId,
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      note: text,
      date,
      source: 'telegram',
    })

  if (error) {
    console.error('[telegram-webhook] insert failed:', error)
    await sendTelegramMessage(chatId, '❌ Gagal nyimpen transaksi. Coba lagi atau cek MindVault langsung.')
    return { ok: true }
  }

  const sign = parsed.type === 'income' ? '+' : '-'
  const formattedAmount = parsed.amount.toLocaleString('id-ID')
  await sendTelegramMessage(
    chatId,
    `✅ Tercatat: ${sign}Rp${formattedAmount} — ${parsed.categoryEmoji} ${parsed.categoryLabel}`
  )

  return { ok: true }
})
