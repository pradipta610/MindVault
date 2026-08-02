// Single source of truth for finance categories. Previously duplicated
// verbatim in finance/index.vue and finance/analytics.vue — extracted
// here so the bank statement importer can reuse the exact same list
// instead of inventing a second category system.

export type FinanceCategory = {
  key: string
  label: string
  emoji: string
  color: string
}

const EXPENSE_CATEGORIES: FinanceCategory[] = [
  { key: 'makan', label: 'Makan', emoji: '🍔', color: '#f59e0b' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3b82f6' },
  { key: 'belanja', label: 'Belanja', emoji: '🛍️', color: '#8b5cf6' },
  { key: 'tagihan', label: 'Tagihan', emoji: '💡', color: '#f43f5e' },
  { key: 'hiburan', label: 'Hiburan', emoji: '🎮', color: '#10b981' },
  { key: 'kesehatan', label: 'Kesehatan', emoji: '💊', color: '#06b6d4' },
  { key: 'pendidikan', label: 'Pendidikan', emoji: '📚', color: '#6366f1' },
  { key: 'lainnya', label: 'Lainnya', emoji: '📦', color: '#6b7280' },
]

const INCOME_CATEGORIES: FinanceCategory[] = [
  { key: 'gaji', label: 'Gaji', emoji: '💰', color: '#10b981' },
  { key: 'freelance', label: 'Freelance', emoji: '💻', color: '#6366f1' },
  { key: 'bisnis', label: 'Bisnis', emoji: '🏢', color: '#f59e0b' },
  { key: 'investasi', label: 'Investasi', emoji: '📈', color: '#3b82f6' },
  { key: 'hadiah', label: 'Hadiah', emoji: '🎁', color: '#ec4899' },
  { key: 'lainnya', label: 'Lainnya', emoji: '💵', color: '#6b7280' },
]

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

const FALLBACK_CATEGORY = (key: string): FinanceCategory => ({ key, label: key, emoji: '💸', color: '#6b7280' })

export const useFinanceCategories = () => {
  const categoriesForType = (type: string): FinanceCategory[] =>
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const getCategoryMeta = (key: string, type: string): FinanceCategory =>
    categoriesForType(type).find(c => c.key === key)
    ?? ALL_CATEGORIES.find(c => c.key === key)
    ?? FALLBACK_CATEGORY(key)

  return {
    expenseCategories: EXPENSE_CATEGORIES,
    incomeCategories: INCOME_CATEGORIES,
    allCategories: ALL_CATEGORIES,
    categoriesForType,
    getCategoryMeta,
  }
}
