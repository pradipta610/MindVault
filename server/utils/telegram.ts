// Minimal Telegram Bot API client — just the one call Phase 1 needs.
// No SDK dependency; Telegram's HTTP API is simple enough not to need one.
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
