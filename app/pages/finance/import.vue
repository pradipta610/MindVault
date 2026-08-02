<template>
  <div class="py-4 sm:py-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/finance" class="w-8 h-8 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </NuxtLink>
      <h1 class="font-serif text-2xl text-vault-text">Import Bank Statement</h1>
    </div>

    <!-- Step 1: Bank -->
    <div v-if="!previewItems.length" class="space-y-5">
      <div>
        <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-2.5">Pilih Bank</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="b in BANKS"
            :key="b.key"
            @click="selectedBank = b.key"
            class="flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 transition-all"
            :class="selectedBank === b.key ? 'border-vault-accent/60 bg-vault-accent/10' : 'border-vault-border bg-vault-card hover:border-vault-accent/30'"
          >
            <span class="text-2xl">{{ b.emoji }}</span>
            <span class="text-sm text-vault-text">{{ b.label }}</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Account -->
      <div v-if="selectedBank">
        <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-2.5">Pilih Rekening</p>
        <div class="space-y-2">
          <button
            v-for="acc in accountsForBank"
            :key="acc.id"
            @click="selectedAccountId = acc.id"
            class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left"
            :class="selectedAccountId === acc.id ? 'border-vault-accent/60 bg-vault-accent/10' : 'border-vault-border bg-vault-card hover:border-vault-accent/30'"
          >
            <span class="text-sm text-vault-text">{{ acc.account_name }}</span>
            <span v-if="acc.account_number_last4" class="text-xs text-vault-muted">•••• {{ acc.account_number_last4 }}</span>
          </button>

          <!-- Add new account -->
          <div v-if="!showAddAccount" class="w-full">
            <button @click="showAddAccount = true" class="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-vault-border text-vault-muted hover:text-vault-accent hover:border-vault-accent/40 transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah Rekening {{ bankLabel(selectedBank) }}
            </button>
          </div>
          <div v-else class="px-4 py-3 rounded-xl border border-vault-border bg-vault-card space-y-2">
            <input v-model="newAccountName" placeholder="Nama rekening, mis. BCA Utama" class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30" />
            <input v-model="newAccountLast4" placeholder="4 digit terakhir (opsional)" maxlength="4" class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30" />
            <div class="flex gap-2">
              <button @click="showAddAccount = false" class="flex-1 py-2 rounded-lg text-xs text-vault-muted border border-vault-border">Batal</button>
              <button @click="addAccount" :disabled="!newAccountName.trim()" class="flex-1 py-2 rounded-lg text-xs font-semibold bg-vault-accent text-vault-bg disabled:opacity-30">Simpan</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Upload -->
      <div v-if="selectedAccountId">
        <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-2.5">Upload e-Statement (PDF)</p>
        <label class="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-vault-border hover:border-vault-accent/40 cursor-pointer transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
          </svg>
          <span class="text-xs text-vault-muted">{{ file ? file.name : 'Pilih file PDF' }}</span>
          <input type="file" accept="application/pdf" class="hidden" @change="onFileChange" />
        </label>

        <p v-if="error" class="text-xs text-vault-negative mt-3">{{ error }}</p>

        <button
          @click="processStatement"
          :disabled="!file || parsing"
          class="w-full mt-4 py-3 rounded-xl text-sm font-semibold bg-vault-accent text-vault-bg disabled:opacity-30 transition-colors"
        >
          {{ parsing ? 'Memproses...' : 'Proses Statement' }}
        </button>
      </div>
    </div>

    <!-- Step 4: Preview -->
    <div v-else class="space-y-4">
      <div class="bg-vault-card border border-vault-border rounded-xl px-4 py-3">
        <p class="text-sm text-vault-text">{{ previewItems.length }} transaksi ditemukan</p>
        <p class="text-xs text-vault-muted mt-1">
          {{ selectedCount }} akan diimport
          <span v-if="excludedCount > 0">&middot; {{ excludedCount }} dilewati</span>
        </p>
      </div>

      <FinanceImportPreviewList
        :items="previewItems"
        @toggle-selected="toggleItemSelected"
        @set-action="setItemAction"
        @set-category="setItemCategory"
      />

      <div class="flex gap-2 pt-2">
        <button @click="resetFlow" class="flex-1 py-3 rounded-xl text-sm text-vault-muted border border-vault-border">Batal</button>
        <button
          @click="doImport"
          :disabled="selectedCount === 0 || importing"
          class="flex-1 py-3 rounded-xl text-sm font-semibold bg-vault-accent text-vault-bg disabled:opacity-30"
        >
          {{ importing ? 'Mengimport...' : `Import (${selectedCount})` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SupportedBank } from '~/types/finance-import'

definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { show: showToast } = useToast()
const { accounts, fetchAccounts, createAccount } = useFinanceBankAccounts()
const {
  parsing, importing, error, previewItems,
  uploadAndParse, commitImport, setItemCategory, setItemAction, toggleItemSelected,
} = useBankStatementImport()

const BANKS: { key: SupportedBank; label: string; emoji: string }[] = [
  { key: 'bca', label: 'BCA', emoji: '🏦' },
  { key: 'blu', label: 'blu by BCA Digital', emoji: '💙' },
]
const bankLabel = (b: SupportedBank | null) => BANKS.find(x => x.key === b)?.label || ''

const selectedBank = ref<SupportedBank | null>(null)
const selectedAccountId = ref<string | null>(null)
const file = ref<File | null>(null)

const accountsForBank = computed(() => accounts.value.filter(a => a.bank === selectedBank.value))

watch(selectedBank, () => { selectedAccountId.value = null })

const showAddAccount = ref(false)
const newAccountName = ref('')
const newAccountLast4 = ref('')

const addAccount = async () => {
  if (!selectedBank.value || !newAccountName.value.trim()) return
  const created = await createAccount({
    bank: selectedBank.value,
    account_name: newAccountName.value,
    account_number_last4: newAccountLast4.value || undefined,
  })
  if (created) {
    selectedAccountId.value = created.id
    showAddAccount.value = false
    newAccountName.value = ''
    newAccountLast4.value = ''
  }
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  file.value = target.files?.[0] || null
}

const processStatement = async () => {
  if (!file.value || !selectedBank.value || !selectedAccountId.value) return
  try {
    await uploadAndParse(file.value, selectedBank.value, selectedAccountId.value)
  } catch {
    // error state already surfaced via `error` ref
  }
}

const selectedCount = computed(() => previewItems.value.filter(i => i.selected && i.action === 'import').length)
const excludedCount = computed(() => previewItems.value.length - selectedCount.value)

const resetFlow = () => {
  previewItems.value.splice(0, previewItems.value.length)
  file.value = null
}

const doImport = async () => {
  try {
    const created = await commitImport()
    showToast(`${created.length} transaksi berhasil diimport!`)
    await navigateTo('/finance')
  } catch (e: any) {
    showToast(e?.message || 'Gagal mengimport transaksi', 'error')
  }
}

watch(user, async (u) => {
  if (u) await fetchAccounts()
}, { immediate: true })
</script>
