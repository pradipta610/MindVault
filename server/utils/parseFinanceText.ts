// Rule-based extraction for Telegram text messages like "jajan 25000 kopi"
// or "gaji 5000000". Deliberately not AI-based yet — same reasoning as the
// webhook itself: prove the simple path works before reaching for a model.
//
// Category keys/emoji mirror app/composables/useFinanceCategories.ts (the
// UI's single source of truth) so bot-created transactions render exactly
// like manually-entered ones.

export type ParsedFinanceText = {
  amount: number
  type: 'income' | 'expense'
  category: string
  categoryEmoji: string
  categoryLabel: string
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  makan: ['makan', 'jajan', 'kopi', 'sarapan', 'nasi', 'kuliner', 'resto', 'warung', 'cafe', 'minum', 'gofood', 'grabfood'],
  transport: ['bensin', 'ojek', 'gojek', 'grab', 'parkir', 'tol', 'transport', 'taxi', 'taksi', 'kereta', 'krl', 'mrt', 'busway', 'bus'],
  belanja: ['belanja', 'beli', 'shopping', 'baju', 'sepatu', 'skincare'],
  tagihan: ['tagihan', 'listrik', 'wifi', 'internet', 'pulsa', 'token', 'pdam', 'bpjs', 'cicilan', 'langganan', 'subscription'],
  hiburan: ['nonton', 'bioskop', 'game', 'hiburan', 'netflix', 'spotify', 'konser', 'liburan'],
  kesehatan: ['obat', 'dokter', 'rumah sakit', 'apotek', 'kesehatan', 'vitamin'],
  pendidikan: ['kursus', 'buku', 'sekolah', 'kuliah', 'pendidikan', 'seminar'],
  gaji: ['gaji', 'payroll'],
  freelance: ['freelance', 'proyek', 'klien'],
  bisnis: ['bisnis', 'usaha', 'jualan'],
  investasi: ['investasi', 'saham', 'reksadana', 'dividen', 'crypto'],
  hadiah: ['hadiah', 'bonus', 'thr', 'gift'],
}

const INCOME_CATEGORIES = new Set(['gaji', 'freelance', 'bisnis', 'investasi', 'hadiah'])

export const CATEGORY_META: Record<string, { emoji: string, label: string }> = {
  makan: { emoji: '🍔', label: 'Makan' },
  transport: { emoji: '🚗', label: 'Transport' },
  belanja: { emoji: '🛍️', label: 'Belanja' },
  tagihan: { emoji: '💡', label: 'Tagihan' },
  hiburan: { emoji: '🎮', label: 'Hiburan' },
  kesehatan: { emoji: '💊', label: 'Kesehatan' },
  pendidikan: { emoji: '📚', label: 'Pendidikan' },
  gaji: { emoji: '💰', label: 'Gaji' },
  freelance: { emoji: '💻', label: 'Freelance' },
  bisnis: { emoji: '🏢', label: 'Bisnis' },
  investasi: { emoji: '📈', label: 'Investasi' },
  hadiah: { emoji: '🎁', label: 'Hadiah' },
  lainnya: { emoji: '📦', label: 'Lainnya' },
}

const INCOME_SIGNAL = /\b(gaji|terima|masuk|dapat|untung|profit|cashback|bonus)\b/i

const parseAmount = (text: string): number | null => {
  // \b after the unit is required — without it "25000 kopi" matches "k"
  // as the "ribu" suffix (from the start of "kopi") and multiplies by
  // 1000 on top of the already-literal 25000.
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:(ribu|rb|jt|juta|k)\b)?/i)
  if (!m) return null

  const suffix = m[2]?.toLowerCase()
  if (suffix) {
    const n = parseFloat(m[1]!.replace(',', '.'))
    if (isNaN(n)) return null
    const mult = suffix === 'jt' || suffix === 'juta' ? 1_000_000 : 1_000
    return Math.round(n * mult)
  }

  // No unit suffix: '.' / ',' here are Indonesian thousands separators,
  // not decimals — this app only ever stores whole Rupiah.
  const n = parseInt(m[1]!.replace(/[.,]/g, ''), 10)
  return isNaN(n) ? null : n
}

const detectCategory = (text: string): string | null => {
  const lower = text.toLowerCase()
  for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return key
  }
  return null
}

export const parseFinanceText = (text: string): ParsedFinanceText | null => {
  const amount = parseAmount(text)
  if (amount === null || amount <= 0) return null

  const category = detectCategory(text) ?? 'lainnya'
  const type: 'income' | 'expense' = INCOME_CATEGORIES.has(category) || INCOME_SIGNAL.test(text)
    ? 'income'
    : 'expense'

  const meta = CATEGORY_META[category]!
  return { amount, type, category, categoryEmoji: meta.emoji, categoryLabel: meta.label }
}
