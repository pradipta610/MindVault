import { CATEGORY_META } from './parseFinanceText'

export type ParsedReceipt = {
  amount: number
  type: 'income' | 'expense'
  category: string
  categoryEmoji: string
  categoryLabel: string
  merchant: string | null
}

const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_META))

const PROMPT = `Kamu asisten pencatatan keuangan. Gambar ini adalah foto struk belanja, bukti transfer, atau konfirmasi pembayaran QRIS/e-wallet. Ekstrak transaksinya dan kembalikan HANYA JSON valid (tanpa markdown, tanpa backtick, tanpa penjelasan) dengan struktur persis:
{
  "amount": <jumlah TOTAL transaksi dalam Rupiah, integer, tanpa titik/koma>,
  "type": "expense" atau "income",
  "category": salah satu dari ["makan","transport","belanja","tagihan","hiburan","kesehatan","pendidikan","gaji","freelance","bisnis","investasi","hadiah","lainnya"],
  "merchant": "nama toko/merchant/penerima, singkat, atau null kalau nggak kelihatan"
}

Kalau gambar ini BUKAN struk/bukti transaksi, atau nominalnya nggak kebaca sama sekali, kembalikan {"amount": null}.`

const extractJson = (text: string): any | null => {
  try { return JSON.parse(text) } catch {}
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }
  return null
}

// Google Gemini has a genuine free tier for this volume (personal receipt
// scanning), unlike the Anthropic API — see project chat history for why
// this isn't just calling Claude like server/api/ai-process.post.ts does.
export const parseReceiptImage = async (base64: string, mediaType: string): Promise<ParsedReceipt | null> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('parseReceiptImage: GEMINI_API_KEY missing')
    return null
  }

  let response: any
  try {
    response = await $fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        body: {
          contents: [{
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mediaType, data: base64 } },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        },
      }
    )
  } catch (e) {
    console.error('parseReceiptImage: Gemini API call failed:', e)
    return null
  }

  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text
  const parsed = typeof text === 'string' ? extractJson(text) : null
  if (!parsed || typeof parsed.amount !== 'number' || parsed.amount <= 0) return null

  const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'lainnya'
  const type: 'income' | 'expense' = parsed.type === 'income' ? 'income' : 'expense'
  const meta = CATEGORY_META[category]!

  return {
    amount: Math.round(parsed.amount),
    type,
    category,
    categoryEmoji: meta.emoji,
    categoryLabel: meta.label,
    merchant: typeof parsed.merchant === 'string' && parsed.merchant.trim() ? parsed.merchant.trim() : null,
  }
}
