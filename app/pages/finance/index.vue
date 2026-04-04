<template>
  <div class="px-4 py-6 max-w-4xl mx-auto w-full pb-16" style="touch-action: manipulation" @touchend="handleTap">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="w-8 h-8 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </NuxtLink>
        <h1 class="font-serif text-2xl text-vault-text">Keuangan</h1>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/finance/analytics"
          class="text-xs text-vault-muted hover:text-vault-accent border border-vault-border hover:border-vault-accent/40 px-3 py-1.5 rounded-lg transition-colors"
        >
          Analisa
        </NuxtLink>
        <button
          @click="openAdd"
          class="bg-vault-accent text-vault-bg px-3 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors"
        >
          + Tambah
        </button>
      </div>
    </div>

    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-4">
      <button @click="prevMonth" class="w-9 h-9 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span class="font-serif text-lg text-vault-text capitalize">{{ monthLabel }}</span>
      <button @click="nextMonth" :disabled="isCurrentMonth" class="w-9 h-9 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors disabled:opacity-30 disabled:cursor-default">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-5">
      <button
        v-for="f in filterOptions"
        :key="f.value"
        @click="filterType = f.value"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
        :class="filterType === f.value
          ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <!-- Summary Card -->
      <div class="bg-vault-card border border-vault-border rounded-2xl p-5 mb-5">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1">Pemasukan</p>
            <p class="font-serif text-xl text-vault-positive">{{ formatIDR(totalIncome) }}</p>
          </div>
          <div>
            <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1">Pengeluaran</p>
            <p class="font-serif text-xl text-vault-negative">{{ formatIDR(totalExpense) }}</p>
          </div>
        </div>
        <div class="border-t border-vault-border pt-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-vault-muted">Saldo bulan ini</span>
            <span class="text-sm font-semibold" :class="netBalance >= 0 ? 'text-vault-positive' : 'text-vault-negative'">
              {{ netBalance >= 0 ? '+' : '' }}{{ formatIDR(netBalance) }}
            </span>
          </div>
          <div v-if="totalIncome > 0" class="space-y-1">
            <div class="h-2 bg-vault-border rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="expenseRatio > 90 ? 'bg-vault-negative' : expenseRatio > 70 ? 'bg-amber-500' : 'bg-vault-positive'"
                :style="{ width: Math.min(100, expenseRatio) + '%' }"
              />
            </div>
            <p class="text-[10px] text-vault-muted text-right">{{ expenseRatio }}% dari pemasukan terpakai</p>
          </div>
          <div v-else-if="totalExpense > 0" class="mt-1">
            <p class="text-[10px] text-amber-500">Belum ada pemasukan dicatat bulan ini</p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="transactions.length === 0" class="text-center py-12">
        <div class="text-5xl mb-4">💰</div>
        <p class="text-vault-muted text-sm">Belum ada transaksi bulan ini.</p>
        <button @click="openAdd" class="mt-4 text-vault-accent text-sm hover:underline">Tambah transaksi pertama</button>
      </div>

      <template v-else>
        <!-- Category Breakdown (top expenses, hidden when filtering income) -->
        <div v-if="categoryBreakdown.length > 0 && filterType !== 'income'" class="mb-5">
          <p class="text-[10px] font-semibold text-vault-muted uppercase tracking-wider mb-3">Top Pengeluaran</p>
          <div class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 space-y-3">
            <div v-for="item in categoryBreakdown" :key="item.key" class="flex items-center gap-3">
              <span class="text-lg w-6 shrink-0">{{ item.emoji }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-vault-text">{{ item.label }}</span>
                  <span class="text-xs font-medium text-vault-text shrink-0 ml-2">{{ formatIDR(item.amount) }}</span>
                </div>
                <div class="h-1 bg-vault-border rounded-full overflow-hidden">
                  <div class="h-full rounded-full" :style="{ width: (item.amount / categoryBreakdown[0].amount * 100) + '%', backgroundColor: item.color }" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty filtered state -->
        <div v-if="filteredGroupedByDate.length === 0" class="text-center py-8">
          <p class="text-vault-muted text-sm">Tidak ada {{ filterType === 'income' ? 'pemasukan' : 'pengeluaran' }} bulan ini.</p>
        </div>

        <!-- Transaction list grouped by date -->
        <div v-else class="space-y-5">
          <div v-for="group in filteredGroupedByDate" :key="group.date">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-vault-muted">{{ formatGroupDate(group.date) }}</span>
              <span class="text-[10px] font-medium" :class="group.dayNet >= 0 ? 'text-vault-positive' : 'text-vault-negative'">
                {{ group.dayNet >= 0 ? '+' : '' }}{{ formatIDR(group.dayNet) }}
              </span>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl overflow-hidden">
              <div
                v-for="(trx, i) in group.items"
                :key="trx.id"
                @click="openEdit(trx)"
                class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-vault-bg/50 group transition-colors"
                :class="{ 'border-t border-vault-border': i > 0 }"
              >
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" :style="{ backgroundColor: getCatColor(trx.category, trx.type) + '22' }">
                  {{ getCatEmoji(trx.category, trx.type) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-vault-text leading-tight">{{ getCatLabel(trx.category, trx.type) }}</p>
                  <p v-if="trx.note" class="text-[11px] text-vault-muted mt-0.5 truncate">{{ trx.note }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-sm font-semibold" :class="trx.type === 'income' ? 'text-vault-positive' : 'text-vault-negative'">
                    {{ trx.type === 'income' ? '+' : '-' }}{{ formatIDR(trx.amount) }}
                  </span>
                  <button @click.stop="removeTransaction(trx.id)" class="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-vault-negative transition-all w-7 h-7 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- ── Add / Edit Modal ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col max-h-[92vh]">
          <div class="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <h2 class="font-serif text-lg text-vault-text">{{ editingTrx ? 'Edit Transaksi' : 'Tambah Transaksi' }}</h2>
            <button @click="closeModal" class="text-vault-muted hover:text-vault-text transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
            <!-- Type toggle -->
            <div class="grid grid-cols-2 gap-2 bg-vault-bg rounded-xl p-1">
              <button @click="formType = 'expense'" class="py-2.5 rounded-lg text-sm font-semibold transition-all" :class="formType === 'expense' ? 'bg-vault-negative/15 text-vault-negative shadow-sm' : 'text-vault-muted hover:text-vault-text'">
                Keluar
              </button>
              <button @click="formType = 'income'" class="py-2.5 rounded-lg text-sm font-semibold transition-all" :class="formType === 'income' ? 'bg-vault-positive/15 text-vault-positive shadow-sm' : 'text-vault-muted hover:text-vault-text'">
                Masuk
              </button>
            </div>
            <!-- Amount -->
            <div class="bg-vault-bg border border-vault-border rounded-xl px-5 py-4 text-center">
              <p class="text-[10px] text-vault-muted mb-2 uppercase tracking-wider">Nominal (Rp)</p>
              <input ref="amountInput" v-model="formAmount" type="number" min="0" placeholder="0" class="w-full bg-transparent text-3xl font-serif text-center text-vault-text focus:outline-none placeholder:text-vault-muted/30" inputmode="numeric" />
              <p v-if="formAmount" class="text-xs text-vault-muted mt-1">{{ formatIDR(Number(formAmount)) }}</p>
            </div>
            <!-- Category grid -->
            <div>
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-2.5">Kategori</p>
              <div class="grid grid-cols-4 gap-2">
                <button v-for="cat in activeCategories" :key="cat.key" @click="formCategory = cat.key" class="flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all" :class="formCategory === cat.key ? 'border-transparent shadow-sm' : 'border-vault-border bg-vault-bg hover:border-vault-accent/30'" :style="formCategory === cat.key ? { backgroundColor: cat.color + '22', borderColor: cat.color + '66' } : {}">
                  <span class="text-xl leading-none">{{ cat.emoji }}</span>
                  <span class="text-[10px] font-medium text-vault-muted leading-tight text-center">{{ cat.label }}</span>
                </button>
              </div>
            </div>
            <!-- Note -->
            <div>
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Catatan <span class="normal-case font-normal">(opsional)</span></p>
              <input v-model="formNote" placeholder="Contoh: Makan siang sama temen..." class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors" />
            </div>
            <!-- Date -->
            <div>
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Tanggal</p>
              <input v-model="formDate" type="date" class="bg-vault-bg border border-vault-border rounded-xl px-4 py-2.5 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors" />
            </div>
          </div>
          <div class="px-5 pb-6 pt-3 border-t border-vault-border shrink-0">
            <button @click="saveTransaction" :disabled="!formAmount || Number(formAmount) <= 0 || !formCategory || saving" class="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-30" :class="formType === 'expense' ? 'bg-vault-negative/80 hover:bg-vault-negative/70 text-white' : 'bg-vault-positive/80 hover:bg-vault-positive/70 text-white'">
              {{ editingTrx ? 'Simpan Perubahan' : (formType === 'expense' ? 'Catat Pengeluaran' : 'Catat Pemasukan') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })

const user = useSupabaseUser()
const { transactions, loading, fetchMonthTransactions, createTransaction, updateTransaction, deleteTransaction } = useFinance()
const { show: showToast } = useToast()

// ── Month navigation ─────────────────────────────────────────────────���──────
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)

const isCurrentMonth = computed(() =>
  currentYear.value === now.getFullYear() && currentMonth.value === (now.getMonth() + 1)
)
const monthLabel = computed(() => new Date(currentYear.value, currentMonth.value - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))

const prevMonth = () => {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
  loadTransactions()
}
const nextMonth = () => {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
  loadTransactions()
}
const loadTransactions = () => fetchMonthTransactions(currentYear.value, currentMonth.value)

// ── Filter ──────────────────────────────────────────────────────────────────
const filterType = ref<'all' | 'income' | 'expense'>('all')
const filterOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'expense', label: 'Pengeluaran' },
]

// ── Categories ──────────────────────────────────────────────────────────────
const expenseCategories = [
  { key: 'makan', label: 'Makan', emoji: '🍔', color: '#f59e0b' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3b82f6' },
  { key: 'belanja', label: 'Belanja', emoji: '🛍️', color: '#8b5cf6' },
  { key: 'tagihan', label: 'Tagihan', emoji: '💡', color: '#f43f5e' },
  { key: 'hiburan', label: 'Hiburan', emoji: '🎮', color: '#10b981' },
  { key: 'kesehatan', label: 'Kesehatan', emoji: '💊', color: '#06b6d4' },
  { key: 'pendidikan', label: 'Pendidikan', emoji: '📚', color: '#6366f1' },
  { key: 'lainnya', label: 'Lainnya', emoji: '📦', color: '#6b7280' },
]
const incomeCategories = [
  { key: 'gaji', label: 'Gaji', emoji: '💰', color: '#10b981' },
  { key: 'freelance', label: 'Freelance', emoji: '💻', color: '#6366f1' },
  { key: 'bisnis', label: 'Bisnis', emoji: '🏢', color: '#f59e0b' },
  { key: 'investasi', label: 'Investasi', emoji: '📈', color: '#3b82f6' },
  { key: 'hadiah', label: 'Hadiah', emoji: '🎁', color: '#ec4899' },
  { key: 'lainnya', label: 'Lainnya', emoji: '💵', color: '#6b7280' },
]
const allCategories = [...expenseCategories, ...incomeCategories]
const getCatMeta = (key: string, type: string) =>
  (type === 'income' ? incomeCategories : expenseCategories).find(c => c.key === key)
  ?? allCategories.find(c => c.key === key)
  ?? { key, label: key, emoji: '💸', color: '#6b7280' }
const getCatEmoji = (key: string, type: string) => getCatMeta(key, type).emoji
const getCatLabel = (key: string, type: string) => getCatMeta(key, type).label
const getCatColor = (key: string, type: string) => getCatMeta(key, type).color

// ── Summary ─────────────────────────────────────────────────────────────────
const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const totalExpense = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const netBalance = computed(() => totalIncome.value - totalExpense.value)
const expenseRatio = computed(() => !totalIncome.value ? 0 : Math.round((totalExpense.value / totalIncome.value) * 100))

const categoryBreakdown = computed(() => {
  const map: Record<string, number> = {}
  for (const t of transactions.value.filter(t => t.type === 'expense')) map[t.category] = (map[t.category] || 0) + t.amount
  return Object.entries(map).map(([key, amount]) => ({ key, amount, ...getCatMeta(key, 'expense') })).sort((a, b) => b.amount - a.amount).slice(0, 4)
})

// ── Grouped + filtered ──────────────────────────────────────────────────────
const filteredGroupedByDate = computed(() => {
  const filtered = filterType.value === 'all' ? transactions.value : transactions.value.filter(t => t.type === filterType.value)
  const groups: Record<string, any[]> = {}
  for (const t of filtered) {
    if (!groups[t.date]) groups[t.date] = []
    groups[t.date].push(t)
  }
  return Object.entries(groups).map(([date, items]) => ({
    date, items,
    dayNet: items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
  })).sort((a, b) => b.date.localeCompare(a.date))
})

// ── Format ──────────────────────────────────────────────────────────────────
const formatIDR = (amount: number) => 'Rp\u00a0' + Math.abs(amount).toLocaleString('id-ID')
const formatGroupDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Hari ini'
  if (diff === -1) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── Modal ────────────────────────────────────────────────────────────────────
const showModal = ref(false)
const editingTrx = ref<any>(null)
const formType = ref<'expense' | 'income'>('expense')
const formAmount = ref('')
const formCategory = ref('')
const formNote = ref('')
const formDate = ref('')
const saving = ref(false)
const amountInput = ref<HTMLInputElement | null>(null)

const activeCategories = computed(() => formType.value === 'expense' ? expenseCategories : incomeCategories)

watch(formType, (newType) => {
  const cats = newType === 'expense' ? expenseCategories : incomeCategories
  if (!cats.find(c => c.key === formCategory.value)) formCategory.value = cats[0].key
})

const todayStr = () => new Date().toISOString().split('T')[0]

const openAdd = () => {
  editingTrx.value = null
  formType.value = 'expense'
  formAmount.value = ''
  formCategory.value = expenseCategories[0].key
  formNote.value = ''
  formDate.value = todayStr()
  showModal.value = true
  nextTick(() => amountInput.value?.focus())
}
const openEdit = (trx: any) => {
  editingTrx.value = trx
  formType.value = trx.type
  formAmount.value = String(trx.amount)
  formCategory.value = trx.category
  formNote.value = trx.note || ''
  formDate.value = trx.date
  showModal.value = true
}
const closeModal = () => { showModal.value = false; editingTrx.value = null }

const saveTransaction = async () => {
  const amount = Number(formAmount.value)
  if (!amount || amount <= 0 || !formCategory.value || saving.value) return
  saving.value = true
  const txDate = formDate.value
  const txYear = parseInt(txDate.split('-')[0])
  const txMonth = parseInt(txDate.split('-')[1])
  const isInViewedMonth = txYear === currentYear.value && txMonth === currentMonth.value
  try {
    const payload = { type: formType.value, amount, category: formCategory.value, note: formNote.value.trim(), date: formDate.value }
    if (editingTrx.value) {
      const updated = await updateTransaction(editingTrx.value.id, payload)
      if (updated) {
        const idx = transactions.value.findIndex(t => t.id === editingTrx.value.id)
        if (idx !== -1) {
          if (isInViewedMonth) transactions.value[idx] = updated
          else transactions.value.splice(idx, 1)
        }
      }
      showToast('Transaksi diupdate!')
    } else {
      const created = await createTransaction(payload)
      if (created && isInViewedMonth) transactions.value.unshift(created)
      showToast(formType.value === 'expense' ? 'Pengeluaran dicatat!' : 'Pemasukan dicatat!')
    }
    closeModal()
  } finally { saving.value = false }
}

const removeTransaction = async (id: string) => {
  transactions.value = transactions.value.filter(t => t.id !== id)
  await deleteTransaction(id)
  showToast('Transaksi dihapus')
}

watch(user, (u) => { if (u) loadTransactions() }, { immediate: true })

// ── Back Tap shortcut via ?add=1 ────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

watch(user, (u) => {
  if (u && route.query.add === '1') {
    router.replace({ query: {} })
    nextTick(() => openAdd())
  }
}, { immediate: true })

// ── Double tap to quick add ─────────────────────────────────────────────────
let tapCount = 0
let tapTimer: ReturnType<typeof setTimeout> | null = null

const handleTap = (e: TouchEvent) => {
  const target = e.target as HTMLElement
  // Ignore taps on interactive elements
  if (target.closest('button, a, input, textarea, select')) return

  tapCount++
  if (tapTimer) clearTimeout(tapTimer)
  tapTimer = setTimeout(() => {
    if (tapCount >= 2) openAdd()
    tapCount = 0
  }, 350)
}

onUnmounted(() => {
  if (tapTimer) clearTimeout(tapTimer)
})
</script>
