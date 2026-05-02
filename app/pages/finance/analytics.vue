<template>
  <div class="py-4 sm:py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/finance" class="w-8 h-8 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </NuxtLink>
        <h1 class="font-serif text-2xl text-vault-text">Analisa Keuangan</h1>
      </div>
    </div>

    <!-- Scope switcher -->
    <div class="mb-4">
      <FinanceScopeSwitcher @changed="reloadActiveTab" />
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button
        @click="setTab('monthly')"
        class="px-4 py-1.5 rounded-full text-xs font-medium border transition-colors"
        :class="activeTab === 'monthly' ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent' : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        Bulanan
      </button>
      <button
        @click="setTab('yearly')"
        class="px-4 py-1.5 rounded-full text-xs font-medium border transition-colors"
        :class="activeTab === 'yearly' ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent' : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        Tahunan
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>

      <!-- ══ MONTHLY ══════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'monthly'">
        <!-- Month picker -->
        <div class="flex items-center justify-between mb-5">
          <button @click="prevMonth" class="w-9 h-9 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span class="font-serif text-base text-vault-text capitalize">{{ selectedMonthLabel }}</span>
          <button @click="nextMonth" :disabled="isCurrentMonth" class="w-9 h-9 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors disabled:opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <!-- No data -->
        <div v-if="monthTxs.length === 0" class="text-center py-16">
          <div class="text-4xl mb-3">📊</div>
          <p class="text-vault-muted text-sm">Belum ada transaksi di bulan ini.</p>
          <p class="text-[11px] text-vault-muted/60 mt-1">Analisa akan muncul setelah ada data.</p>
        </div>

        <template v-else>
          <!-- 3-column summary -->
          <div class="grid grid-cols-3 gap-3 mb-5">
            <div class="bg-vault-card border border-vault-border rounded-xl p-3 text-center">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1">Masuk</p>
              <p class="font-serif text-base text-vault-positive leading-tight">{{ formatShort(monthIncome) }}</p>
              <p v-if="incomeChange !== null" class="text-[10px] mt-1" :class="incomeChange >= 0 ? 'text-vault-positive' : 'text-vault-negative'">
                {{ incomeChange >= 0 ? '↑' : '↓' }} {{ Math.abs(incomeChange) }}%
              </p>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl p-3 text-center">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1">Keluar</p>
              <p class="font-serif text-base text-vault-negative leading-tight">{{ formatShort(monthExpense) }}</p>
              <p v-if="expenseChange !== null" class="text-[10px] mt-1" :class="expenseChange <= 0 ? 'text-vault-positive' : 'text-vault-negative'">
                {{ expenseChange >= 0 ? '↑' : '↓' }} {{ Math.abs(expenseChange) }}%
              </p>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl p-3 text-center">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1">Saldo</p>
              <p class="font-serif text-base leading-tight" :class="monthNet >= 0 ? 'text-vault-positive' : 'text-vault-negative'">
                {{ monthNet >= 0 ? '+' : '' }}{{ formatShort(monthNet) }}
              </p>
              <p v-if="monthIncome > 0" class="text-[10px] text-vault-muted mt-1">{{ savingsRate }}% saved</p>
            </div>
          </div>

          <!-- vs prev month -->
          <div v-if="prevMonthTxs.length > 0 && (incomeChange !== null || expenseChange !== null)" class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 mb-5 text-xs text-vault-muted">
            vs bulan lalu:
            <span v-if="incomeChange !== null" class="font-medium ml-1" :class="incomeChange >= 0 ? 'text-vault-positive' : 'text-vault-negative'">
              pemasukan {{ incomeChange >= 0 ? 'naik' : 'turun' }} {{ Math.abs(incomeChange) }}%
            </span>
            <span v-if="expenseChange !== null">
              <span class="mx-1 opacity-40">·</span>
              <span class="font-medium" :class="expenseChange <= 0 ? 'text-vault-positive' : 'text-vault-negative'">
                pengeluaran {{ expenseChange >= 0 ? 'naik' : 'turun' }} {{ Math.abs(expenseChange) }}%
              </span>
            </span>
          </div>

          <!-- Expense by category -->
          <div v-if="expenseCatBreakdown.length > 0" class="mb-5">
            <p class="text-[10px] font-semibold text-vault-muted uppercase tracking-wider mb-3">Pengeluaran per Kategori</p>
            <div class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 space-y-3">
              <div v-for="item in expenseCatBreakdown" :key="item.key" class="flex items-center gap-3">
                <span class="text-base w-6 shrink-0 text-center">{{ item.emoji }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-vault-text">{{ item.label }}</span>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-[10px] text-vault-muted">{{ item.pct }}%</span>
                      <span class="text-xs font-medium text-vault-text">{{ formatIDR(item.amount) }}</span>
                    </div>
                  </div>
                  <div class="h-1.5 bg-vault-border rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :style="{ width: item.pct + '%', backgroundColor: item.color }" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Income by source -->
          <div v-if="incomeCatBreakdown.length > 0" class="mb-5">
            <p class="text-[10px] font-semibold text-vault-muted uppercase tracking-wider mb-3">Pemasukan per Sumber</p>
            <div class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 space-y-3">
              <div v-for="item in incomeCatBreakdown" :key="item.key" class="flex items-center gap-3">
                <span class="text-base w-6 shrink-0 text-center">{{ item.emoji }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-vault-text">{{ item.label }}</span>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-[10px] text-vault-muted">{{ item.pct }}%</span>
                      <span class="text-xs font-medium text-vault-text">{{ formatIDR(item.amount) }}</span>
                    </div>
                  </div>
                  <div class="h-1.5 bg-vault-border rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :style="{ width: item.pct + '%', backgroundColor: item.color }" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Key stats grid -->
          <div class="grid grid-cols-2 gap-3">
            <div v-if="biggestExpenseDay" class="bg-vault-card border border-vault-border rounded-xl p-4">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Hari Paling Boros</p>
              <p class="text-sm font-medium text-vault-text">{{ fmtShortDate(biggestExpenseDay.date) }}</p>
              <p class="text-vault-negative text-sm font-semibold mt-0.5">{{ formatIDR(biggestExpenseDay.amount) }}</p>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl p-4">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Rata-rata / Hari</p>
              <p class="text-xs text-vault-muted">Pengeluaran</p>
              <p class="text-vault-negative text-sm font-semibold mt-0.5">{{ formatIDR(avgDailyExpense) }}</p>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl p-4">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Jumlah Transaksi</p>
              <p class="text-2xl font-serif text-vault-text">{{ monthTxs.length }}</p>
              <p class="text-[10px] text-vault-muted mt-0.5">
                {{ monthTxs.filter(t => t.type === 'expense').length }} keluar · {{ monthTxs.filter(t => t.type === 'income').length }} masuk
              </p>
            </div>
            <div v-if="topExpenseItem" class="bg-vault-card border border-vault-border rounded-xl p-4">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Pengeluaran Terbesar</p>
              <p class="text-sm font-medium text-vault-text truncate">{{ topExpenseItem.note || getCatLabel(topExpenseItem.category, 'expense') }}</p>
              <p class="text-vault-negative text-sm font-semibold mt-0.5">{{ formatIDR(topExpenseItem.amount) }}</p>
            </div>
          </div>
        </template>
      </template>

      <!-- ══ YEARLY ════════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'yearly'">
        <!-- Year picker -->
        <div class="flex items-center justify-between mb-5">
          <button @click="prevYear" class="w-9 h-9 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span class="font-serif text-base text-vault-text">{{ selYear }}</span>
          <button @click="nextYear" :disabled="selYear >= now.getFullYear()" class="w-9 h-9 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors disabled:opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <!-- Not enough data -->
        <div v-if="monthsWithData.length < 2" class="text-center py-16">
          <div class="text-4xl mb-3">📊</div>
          <p class="text-vault-muted text-sm">Butuh minimal 2 bulan data untuk analisa tahunan.</p>
          <p class="text-[11px] text-vault-muted/60 mt-1">Sekarang baru ada {{ monthsWithData.length }} bulan data.</p>
        </div>

        <template v-else>
          <!-- Year totals -->
          <div class="grid grid-cols-3 gap-3 mb-5">
            <div class="bg-vault-card border border-vault-border rounded-xl p-3 text-center">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1">Total Masuk</p>
              <p class="font-serif text-base text-vault-positive">{{ formatShort(yearIncome) }}</p>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl p-3 text-center">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1">Total Keluar</p>
              <p class="font-serif text-base text-vault-negative">{{ formatShort(yearExpense) }}</p>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl p-3 text-center">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1">Net</p>
              <p class="font-serif text-base" :class="yearNet >= 0 ? 'text-vault-positive' : 'text-vault-negative'">{{ formatShort(yearNet) }}</p>
            </div>
          </div>

          <!-- Month-by-month bar chart -->
          <div class="mb-5">
            <p class="text-[10px] font-semibold text-vault-muted uppercase tracking-wider mb-3">Per Bulan</p>
            <div class="bg-vault-card border border-vault-border rounded-xl p-4">
              <div class="flex items-end gap-1.5" style="height: 100px">
                <div v-for="m in monthlyData" :key="m.month" class="flex-1 flex flex-col items-center gap-0.5" style="height: 100px; justify-content: flex-end">
                  <div class="w-full flex flex-col gap-px" :style="{ height: '84px', justifyContent: 'flex-end' }">
                    <div v-if="m.income > 0" class="w-full rounded-t-sm" :style="{ height: Math.max(2, m.income / yearMaxMonthly * 70) + 'px', backgroundColor: 'var(--v-positive)', opacity: '0.75' }" />
                    <div v-if="m.expense > 0" class="w-full" :class="m.income > 0 ? '' : 'rounded-t-sm'" :style="{ height: Math.max(2, m.expense / yearMaxMonthly * 70) + 'px', backgroundColor: 'var(--v-negative)', opacity: '0.75' }" />
                    <div v-if="!m.hasData" class="w-full h-0.5 rounded bg-vault-border opacity-30" />
                  </div>
                  <span class="text-[9px] text-vault-muted mt-1">{{ MONTH_SHORT[m.month - 1] }}</span>
                </div>
              </div>
              <div class="flex items-center gap-4 mt-3 justify-center">
                <div class="flex items-center gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-sm" style="background-color: var(--v-positive); opacity: 0.75" />
                  <span class="text-[10px] text-vault-muted">Pemasukan</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-sm" style="background-color: var(--v-negative); opacity: 0.75" />
                  <span class="text-[10px] text-vault-muted">Pengeluaran</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Best/worst/avg/total grid -->
          <div class="grid grid-cols-2 gap-3 mb-5">
            <div v-if="bestMonth" class="bg-vault-card border border-vault-border rounded-xl p-4">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Bulan Terbaik</p>
              <p class="text-sm font-medium text-vault-text">{{ MONTH_NAMES[bestMonth.month - 1] }}</p>
              <p class="text-vault-positive text-sm font-semibold mt-0.5">+{{ formatShort(bestMonth.net) }}</p>
            </div>
            <div v-if="worstExpenseMonth" class="bg-vault-card border border-vault-border rounded-xl p-4">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Paling Boros</p>
              <p class="text-sm font-medium text-vault-text">{{ MONTH_NAMES[worstExpenseMonth.month - 1] }}</p>
              <p class="text-vault-negative text-sm font-semibold mt-0.5">{{ formatShort(worstExpenseMonth.expense) }}</p>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl p-4">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Rata-rata / Bulan</p>
              <p class="text-xs text-vault-muted">Pengeluaran</p>
              <p class="text-vault-negative text-sm font-semibold">{{ formatShort(Math.round(yearExpense / monthsWithData.length)) }}</p>
            </div>
            <div class="bg-vault-card border border-vault-border rounded-xl p-4">
              <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Total Transaksi</p>
              <p class="text-2xl font-serif text-vault-text">{{ yearTxs.length }}</p>
              <p class="text-[10px] text-vault-muted mt-0.5">{{ monthsWithData.length }} bulan aktif</p>
            </div>
          </div>

          <!-- Top expense categories -->
          <div v-if="yearExpenseCats.length > 0" class="mb-5">
            <p class="text-[10px] font-semibold text-vault-muted uppercase tracking-wider mb-3">Pengeluaran Terbanyak Tahun Ini</p>
            <div class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 space-y-3">
              <div v-for="item in yearExpenseCats" :key="item.key" class="flex items-center gap-3">
                <span class="text-base w-6 shrink-0 text-center">{{ item.emoji }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-vault-text">{{ item.label }}</span>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-[10px] text-vault-muted">{{ item.pct }}%</span>
                      <span class="text-xs font-medium text-vault-text">{{ formatIDR(item.amount) }}</span>
                    </div>
                  </div>
                  <div class="h-1.5 bg-vault-border rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :style="{ width: (item.amount / yearExpenseCats[0].amount * 100) + '%', backgroundColor: item.color }" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top income sources -->
          <div v-if="yearIncomeCats.length > 0">
            <p class="text-[10px] font-semibold text-vault-muted uppercase tracking-wider mb-3">Penghasilan Terbanyak Tahun Ini</p>
            <div class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 space-y-3">
              <div v-for="item in yearIncomeCats" :key="item.key" class="flex items-center gap-3">
                <span class="text-base w-6 shrink-0 text-center">{{ item.emoji }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-vault-text">{{ item.label }}</span>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-[10px] text-vault-muted">{{ item.pct }}%</span>
                      <span class="text-xs font-medium text-vault-text">{{ formatIDR(item.amount) }}</span>
                    </div>
                  </div>
                  <div class="h-1.5 bg-vault-border rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :style="{ width: (item.amount / yearIncomeCats[0].amount * 100) + '%', backgroundColor: item.color }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { fetchMonthData, fetchYearTransactions } = useFinance()
const { fetchScopes, loaded: scopesLoaded } = useFinanceScopes()
const user = useSupabaseUser()

const loading = ref(false)
const activeTab = ref<'monthly' | 'yearly'>('monthly')
const now = new Date()

// ── Month state ────────────────────────────────────────────────────────────
const selMonthYear = ref(now.getFullYear())
const selMonth = ref(now.getMonth() + 1)
const monthTxs = ref<any[]>([])
const prevMonthTxs = ref<any[]>([])

const isCurrentMonth = computed(() => selMonthYear.value === now.getFullYear() && selMonth.value === (now.getMonth() + 1))
const selectedMonthLabel = computed(() => new Date(selMonthYear.value, selMonth.value - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))

const prevMonth = async () => {
  if (selMonth.value === 1) { selMonth.value = 12; selMonthYear.value-- } else selMonth.value--
  await loadMonthData()
}
const nextMonth = async () => {
  if (isCurrentMonth.value) return
  if (selMonth.value === 12) { selMonth.value = 1; selMonthYear.value++ } else selMonth.value++
  await loadMonthData()
}

const loadMonthData = async () => {
  loading.value = true
  const prevY = selMonth.value === 1 ? selMonthYear.value - 1 : selMonthYear.value
  const prevM = selMonth.value === 1 ? 12 : selMonth.value - 1
  ;[monthTxs.value, prevMonthTxs.value] = await Promise.all([
    fetchMonthData(selMonthYear.value, selMonth.value),
    fetchMonthData(prevY, prevM),
  ])
  loading.value = false
}

// ── Year state ─────────────────────────────────────────────────────────────
const selYear = ref(now.getFullYear())
const yearTxs = ref<any[]>([])

const prevYear = async () => { selYear.value--; await loadYearData() }
const nextYear = async () => { if (selYear.value < now.getFullYear()) { selYear.value++; await loadYearData() } }

const loadYearData = async () => {
  loading.value = true
  yearTxs.value = await fetchYearTransactions(selYear.value)
  loading.value = false
}

const setTab = async (tab: 'monthly' | 'yearly') => {
  activeTab.value = tab
  if (tab === 'yearly' && yearTxs.value.length === 0) await loadYearData()
}

// ── Categories ─────────────────────────────────────────────────────────────
const EXPENSE_CATS = [
  { key: 'makan', label: 'Makan', emoji: '🍔', color: '#f59e0b' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3b82f6' },
  { key: 'belanja', label: 'Belanja', emoji: '🛍️', color: '#8b5cf6' },
  { key: 'tagihan', label: 'Tagihan', emoji: '💡', color: '#f43f5e' },
  { key: 'hiburan', label: 'Hiburan', emoji: '🎮', color: '#10b981' },
  { key: 'kesehatan', label: 'Kesehatan', emoji: '💊', color: '#06b6d4' },
  { key: 'pendidikan', label: 'Pendidikan', emoji: '📚', color: '#6366f1' },
  { key: 'lainnya', label: 'Lainnya', emoji: '📦', color: '#6b7280' },
]
const INCOME_CATS = [
  { key: 'gaji', label: 'Gaji', emoji: '💰', color: '#10b981' },
  { key: 'freelance', label: 'Freelance', emoji: '💻', color: '#6366f1' },
  { key: 'bisnis', label: 'Bisnis', emoji: '🏢', color: '#f59e0b' },
  { key: 'investasi', label: 'Investasi', emoji: '📈', color: '#3b82f6' },
  { key: 'hadiah', label: 'Hadiah', emoji: '🎁', color: '#ec4899' },
  { key: 'lainnya', label: 'Lainnya', emoji: '💵', color: '#6b7280' },
]
const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS]
const getCatMeta = (key: string, type: string) =>
  (type === 'income' ? INCOME_CATS : EXPENSE_CATS).find(c => c.key === key)
  ?? ALL_CATS.find(c => c.key === key)
  ?? { key, label: key, emoji: '💸', color: '#6b7280' }
const getCatLabel = (key: string, type: string) => getCatMeta(key, type).label

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

// ── Monthly computed ───────────────────────────────────────────────────────
const monthIncome = computed(() => monthTxs.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const monthExpense = computed(() => monthTxs.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const monthNet = computed(() => monthIncome.value - monthExpense.value)
const savingsRate = computed(() => !monthIncome.value ? 0 : Math.max(0, Math.round(monthNet.value / monthIncome.value * 100)))

const prevIncome = computed(() => prevMonthTxs.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const prevExpense = computed(() => prevMonthTxs.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const incomeChange = computed(() => !prevIncome.value ? null : Math.round((monthIncome.value - prevIncome.value) / prevIncome.value * 100))
const expenseChange = computed(() => !prevExpense.value ? null : Math.round((monthExpense.value - prevExpense.value) / prevExpense.value * 100))

const makeCatBreakdown = (txs: any[], type: string, total: number) => {
  const map: Record<string, number> = {}
  for (const t of txs.filter(t => t.type === type)) map[t.category] = (map[t.category] || 0) + t.amount
  return Object.entries(map)
    .map(([key, amount]) => ({ key, amount, pct: total ? Math.round(amount / total * 100) : 0, ...getCatMeta(key, type) }))
    .sort((a, b) => b.amount - a.amount)
}

const expenseCatBreakdown = computed(() => makeCatBreakdown(monthTxs.value, 'expense', monthExpense.value))
const incomeCatBreakdown = computed(() => makeCatBreakdown(monthTxs.value, 'income', monthIncome.value))

const biggestExpenseDay = computed(() => {
  const map: Record<string, number> = {}
  for (const t of monthTxs.value.filter(t => t.type === 'expense')) map[t.date] = (map[t.date] || 0) + t.amount
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
  return sorted[0] ? { date: sorted[0][0], amount: sorted[0][1] } : null
})
const avgDailyExpense = computed(() => {
  if (!monthTxs.value.length) return 0
  return Math.round(monthExpense.value / new Date(selMonthYear.value, selMonth.value, 0).getDate())
})
const topExpenseItem = computed(() => {
  const e = monthTxs.value.filter(t => t.type === 'expense')
  return e.length ? [...e].sort((a, b) => b.amount - a.amount)[0] : null
})

// ── Yearly computed ────────────────────────────────────────────────────────
const monthlyData = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const txs = yearTxs.value.filter(t => parseInt(t.date.split('-')[1]) === month)
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { month, income, expense, net: income - expense, hasData: txs.length > 0 }
  })
)
const monthsWithData = computed(() => monthlyData.value.filter(m => m.hasData))
const yearMaxMonthly = computed(() => Math.max(...monthlyData.value.flatMap(m => [m.income, m.expense]), 1))
const yearIncome = computed(() => yearTxs.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const yearExpense = computed(() => yearTxs.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const yearNet = computed(() => yearIncome.value - yearExpense.value)
const bestMonth = computed(() => monthsWithData.value.length ? [...monthsWithData.value].sort((a, b) => b.net - a.net)[0] : null)
const worstExpenseMonth = computed(() => monthsWithData.value.length ? [...monthsWithData.value].sort((a, b) => b.expense - a.expense)[0] : null)
const yearExpenseCats = computed(() => makeCatBreakdown(yearTxs.value, 'expense', yearExpense.value).slice(0, 5))
const yearIncomeCats = computed(() => makeCatBreakdown(yearTxs.value, 'income', yearIncome.value).slice(0, 3))

// ── Format ─────────────────────────────────────────────────────────────────
const formatIDR = (n: number) => 'Rp\u00a0' + Math.abs(n).toLocaleString('id-ID')
const formatShort = (n: number) => {
  const abs = Math.abs(n), sign = n < 0 ? '-' : n > 0 && arguments.length > 0 ? '' : ''
  if (abs >= 1_000_000_000) return `${sign}Rp\u00a0${(abs/1_000_000_000).toFixed(1)}M`
  if (abs >= 1_000_000) return `${sign}Rp\u00a0${(abs/1_000_000).toFixed(1)}jt`
  if (abs >= 1_000) return `${sign}Rp\u00a0${(abs/1_000).toFixed(0)}rb`
  return `${sign}Rp\u00a0${abs}`
}
const fmtShortDate = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

// ── Reload when scope changes ────────────────────────────────────────────────
const reloadActiveTab = async () => {
  if (activeTab.value === 'monthly') await loadMonthData()
  else await loadYearData()
}

// ── Init ──────────────────────────────────────────────────────────────────
watch(user, async (u) => {
  if (u) {
    if (!scopesLoaded.value) await fetchScopes()
    await loadMonthData()
  }
}, { immediate: true })
</script>
