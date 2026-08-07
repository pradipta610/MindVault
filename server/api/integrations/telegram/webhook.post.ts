import { sendTelegramMessage, downloadTelegramPhoto } from '../../../utils/telegram'
import { parseFinanceText } from '../../../utils/parseFinanceText'
import { parseReceiptImage } from '../../../utils/parseReceiptImage'
import { supabaseAdmin } from '../../../utils/supabaseAdmin'
import { getDefaultScopeId } from '../../../utils/getDefaultScopeId'

type Parsed = {
  amount: number
  type: 'income' | 'expense'
  category: string
  categoryEmoji: string
  categoryLabel: string
}

// Phase 3: photos (struk/QRIS) go through Claude Vision instead of just
// being acknowledged. Text still uses the Phase 2 rule-based parser —
// no reason to pay for a model call on "jajan 25000 kopi".
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

  const userId = process.env.TELEGRAM_MINDVAULT_USER_ID
  if (!userId) {
    console.error('[telegram-webhook] TELEGRAM_MINDVAULT_USER_ID missing')
    await sendTelegramMessage(chatId, '⚠️ Bot belum dikonfigurasi lengkap di server.')
    return { ok: true }
  }

  const date = new Date((message.date + 7 * 3600) * 1000).toISOString().split('T')[0]

  const saveAndConfirm = async (parsed: Parsed, note: string, suffix: string) => {
    const scopeId = await getDefaultScopeId(userId)
    const { error } = await supabaseAdmin()
      .from('transactions')
      .insert({
        user_id: userId,
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        note,
        date,
        source: 'telegram',
        scope_id: scopeId,
      })

    if (error) {
      console.error('[telegram-webhook] insert failed:', error)
      await sendTelegramMessage(chatId, '❌ Gagal nyimpen transaksi. Coba lagi atau cek MindVault langsung.')
      return
    }

    const sign = parsed.type === 'income' ? '+' : '-'
    const formattedAmount = parsed.amount.toLocaleString('id-ID')
    await sendTelegramMessage(
      chatId,
      `✅ Tercatat: ${sign}Rp${formattedAmount} — ${parsed.categoryEmoji} ${parsed.categoryLabel}${suffix}`
    )
  }

  const photos = message?.photo
  if (Array.isArray(photos) && photos.length > 0) {
    if (!process.env.GEMINI_API_KEY) {
      console.error('[telegram-webhook] GEMINI_API_KEY missing')
      await sendTelegramMessage(chatId, '⚠️ Pembacaan struk belum dikonfigurasi di server.')
      return { ok: true }
    }

    // Telegram sends multiple resolutions of the same photo, smallest first.
    const largest = photos[photos.length - 1]
    const photo = await downloadTelegramPhoto(largest.file_id)
    if (!photo) {
      await sendTelegramMessage(chatId, '❌ Gagal mengunduh foto dari Telegram. Coba kirim ulang.')
      return { ok: true }
    }

    const receipt = await parseReceiptImage(photo.base64, photo.mediaType)
    if (!receipt) {
      await sendTelegramMessage(chatId, '⚠️ Nggak bisa baca struk/QRIS dari foto itu. Coba foto lebih jelas, atau ketik manual.')
      return { ok: true }
    }

    const note = receipt.merchant ? `${receipt.merchant} (foto)` : 'Struk/QRIS (foto)'
    await saveAndConfirm(receipt, note, ' 📸\n(hasil baca otomatis, cek lagi nominalnya ya)')
    return { ok: true }
  }

  const text = (message?.text as string | undefined)?.trim()
  if (!text || text.startsWith('/')) {
    await sendTelegramMessage(chatId, 'Kirim catatan transaksi, contoh:\n"jajan 25000 kopi"\n"gaji 5000000"\natau foto struk/QRIS.')
    return { ok: true }
  }

  const parsed = parseFinanceText(text)
  if (!parsed) {
    await sendTelegramMessage(chatId, '⚠️ Nggak nemu nominal di pesan itu. Coba sertakan angka, misal "jajan 25000 kopi".')
    return { ok: true }
  }

  await saveAndConfirm(parsed, text, '')
  return { ok: true }
})
