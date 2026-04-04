<template>
  <div class="py-4 sm:py-6">
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">Backlog</h2>
      <button
        v-if="mergedItems.length > 0"
        @click="handleClearAll"
        class="text-xs text-red-400/70 hover:text-red-400 font-medium transition-colors"
      >
        Clear Semua
      </button>
    </div>

    <div class="relative mb-3 sm:mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="searchQuery"
        placeholder="Cari backlog..."
        class="w-full bg-vault-card border border-vault-border rounded-xl pl-10 pr-8 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
      />
      <button
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-text transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <button
        v-for="sf in sourceFilters"
        :key="sf.value"
        @click="activeSource = sf.value"
        class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors"
        :class="activeSource === sf.value
          ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        {{ sf.label }}
      </button>
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <div v-else-if="mergedItems.length === 0 && !searchQuery" class="text-center py-16">
      <p class="text-vault-muted">Belum ada item di backlog.</p>
    </div>

    <div v-else-if="filteredItems.length === 0" class="text-center py-16">
      <p class="text-vault-muted">Tidak ada item yang cocok</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in filteredItems"
        :key="item._key"
        class="bg-vault-card border border-vault-border rounded-xl overflow-hidden group"
      >
        <!-- Image thumbnails for dump items with images -->
        <div v-if="item._images && item._images.length > 0" class="flex gap-0.5">
          <img
            v-for="(img, i) in item._images.slice(0, 3)"
            :key="i"
            :src="img"
            class="h-16 object-cover flex-1 min-w-0"
            loading="lazy"
          />
          <div
            v-if="item._images.length > 3"
            class="h-16 w-16 shrink-0 bg-black/40 flex items-center justify-center text-white text-xs font-medium"
          >
            +{{ item._images.length - 3 }}
          </div>
        </div>

        <div class="flex items-center gap-3 px-3 sm:px-4 py-3">
          <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            :class="item._source === 'todo' ? 'bg-teal-500/20' : 'bg-amber-500/20'"
          >
            <svg v-if="item._source === 'todo'" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <div class="prose-editor text-sm text-vault-muted" :class="item._source === 'todo' ? 'line-through' : ''" v-html="highlightText(item._displayText)" />
            <div class="flex items-center gap-2 mt-1">
              <span
                class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                :class="item._source === 'todo' ? 'bg-teal-500/15 text-teal-400' : 'bg-amber-500/15 text-amber-400'"
              >
                {{ item._source === 'todo' ? 'dari to-do' : 'dari dump' }}
              </span>
              <span
                class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5"
                :style="{ backgroundColor: getCategoryColor(item._tag) + '33', color: getCategoryColor(item._tag) }"
              >
                <span class="text-[9px]">{{ getCategoryIcon(item._tag) }}</span>
                {{ getCategoryLabel(item._tag) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <!-- Mobile: "..." trigger for action sheet -->
            <button
              @click="openItemActions(item)"
              class="sm:hidden w-[44px] h-[44px] -mr-2 flex items-center justify-center text-vault-muted hover:text-vault-text transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </button>
            <!-- Desktop: hover buttons -->
            <button
              @click="handleRestoreToNote(item)"
              class="hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-vault-accent transition-all"
              title="Kembalikan ke Dump"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </button>
            <button
              @click="openReactivate(item)"
              class="hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-emerald-400 transition-all"
              title="Aktifkan lagi sebagai task"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </button>
            <button
              @click="handlePermanentDelete(item)"
              class="hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all"
              title="Hapus permanen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <TransferModal
        v-if="showReactivate"
        title="Aktifkan Lagi"
        confirm-label="Aktifkan"
        :initial-text="reactivateItem?._displayText || ''"
        :initial-cat="reactivateItem?._tag || ''"
        :show-text="reactivateItem?._source === 'dump'"
        :show-category="reactivateItem?._source === 'dump'"
        :show-date="true"
        @close="showReactivate = false"
        @confirm="handleReactivateConfirm"
      />

      <div v-if="saving" class="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-vault-accent border-t-transparent rounded-full animate-spin" />
          <p class="text-sm text-vault-text font-medium">{{ savingText }}</p>
        </div>
      </div>
    </Teleport>

    <ActionSheet
      v-if="showItemActions"
      :actions="backlogActionItems"
      @close="showItemActions = false"
      @select="handleItemActionSelect"
    />
  </div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { backlogItems, backlogLoading, fetchBacklog, permanentDelete, restoreToNote, reactivateToTask, clearAll } = useBacklog()
const { createTask } = useTasks()
const { show: showToast } = useToast()
const { fetchCategories, injectAllStyles, getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()

const searchQuery = ref('')
const activeSource = ref('all')
const showReactivate = ref(false)
const reactivateItem = ref<any>(null)
const pageLoading = ref(false)
const showItemActions = ref(false)
const actionTargetItem = ref<any>(null)
const saving = ref(false)
const savingText = ref('')

const sourceFilters = [
  { label: 'Semua', value: 'all' },
  { label: 'Dari To-do', value: 'todo' },
  { label: 'Dari Dump', value: 'dump' },
]

const backlogActionItems = [
  { id: 'restore', label: 'Kembalikan ke Dump', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>' },
  { id: 'reactivate', label: 'Aktifkan sebagai Task', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>' },
  { id: 'delete', label: 'Hapus Permanen', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>', destructive: true },
]

// All items come from the backlog table now
const mergedItems = computed(() => {
  return backlogItems.value.map((b: any) => {
    const sd = b.source_data || {}
    if (b.source_type === 'todo') {
      return {
        ...b,
        _source: 'todo' as const,
        _key: 'backlog_' + b.id,
        _displayText: sd.text || '',
        _tag: sd.cat || null,
        _images: sd.images || [] as string[],
        _sortTime: b.deleted_at || b.created_at,
      }
    } else {
      return {
        ...b,
        _source: 'dump' as const,
        _key: 'backlog_' + b.id,
        _displayText: sd.title || sd.raw || '',
        _tag: sd.tag || null,
        _images: sd.images || [],
        _sortTime: b.deleted_at || b.created_at,
      }
    }
  }).sort((a: any, b: any) =>
    new Date(b._sortTime).getTime() - new Date(a._sortTime).getTime()
  )
})

const filteredItems = computed(() => {
  let result = mergedItems.value
  if (activeSource.value !== 'all') {
    result = result.filter(i => i._source === activeSource.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(i => (i._displayText || '').replace(/<[^>]*>/g, '').toLowerCase().includes(q))
  }
  return result
})

const highlightText = (text: string) => {
  if (!text) return ''
  const sanitized = import.meta.client ? DOMPurify.sanitize(text) : text
  if (!searchQuery.value.trim()) return sanitized
  const escaped = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const highlighted = sanitized.replace(
    /(<[^>]+>|[^<]+)/g,
    (chunk) => chunk.startsWith('<')
      ? chunk
      : chunk.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-vault-accent/30 text-vault-text rounded px-0.5">$1</mark>')
  )
  return import.meta.client
    ? DOMPurify.sanitize(highlighted, { ADD_TAGS: ['mark'], ADD_ATTR: ['class'] })
    : highlighted
}

const openItemActions = (item: any) => {
  actionTargetItem.value = item
  showItemActions.value = true
}

const handleItemActionSelect = (id: string) => {
  showItemActions.value = false
  const item = actionTargetItem.value
  if (!item) return
  if (id === 'restore') handleRestoreToNote(item)
  else if (id === 'reactivate') openReactivate(item)
  else if (id === 'delete') handlePermanentDelete(item)
}

const handleRestoreToNote = async (item: any) => {
  saving.value = true
  savingText.value = 'Mengembalikan...'
  try {
    await restoreToNote(item)
    showToast(item._source === 'dump' ? 'Note dikembalikan ke Dump!' : 'Note dibuat dari task!')
  } catch (e) {
    showToast('Gagal mengembalikan item')
  } finally {
    saving.value = false
  }
}

const openReactivate = (item: any) => {
  reactivateItem.value = item
  showReactivate.value = true
}

const handleReactivateConfirm = async (data: { text: string; cat: string; date: string }) => {
  const item = reactivateItem.value
  if (!item) return
  saving.value = true
  savingText.value = 'Mengaktifkan...'
  try {
    if (item._source === 'todo') {
      // Restore as task from backlog
      await reactivateToTask(item, data.date)
    } else {
      // Create new task from dump backlog item, then remove from backlog
      await createTask({ text: data.text, cat: data.cat, date: data.date })
      await permanentDelete(item.id)
    }
    showReactivate.value = false
    showToast('Task diaktifkan!')
  } catch (e) {
    showToast('Gagal mengaktifkan task')
  } finally {
    saving.value = false
  }
}

const handlePermanentDelete = async (item: any) => {
  if (!confirm('Hapus permanen item ini?')) return
  saving.value = true
  savingText.value = 'Menghapus...'
  try {
    // Pass images for storage cleanup (dump items may have images)
    await permanentDelete(item.id, item._images)
    showToast('Item dihapus permanen')
  } catch (e) {
    showToast('Gagal menghapus item')
  } finally {
    saving.value = false
  }
}

const handleClearAll = async () => {
  if (!confirm('Hapus semua item di backlog?')) return
  saving.value = true
  savingText.value = 'Membersihkan backlog...'
  try {
    await clearAll()
    showToast('Backlog dibersihkan')
  } catch (e) {
    showToast('Gagal membersihkan backlog')
  } finally {
    saving.value = false
  }
}

const loadBacklog = async () => {
  pageLoading.value = true
  await Promise.all([fetchCategories(), fetchBacklog()])
  injectAllStyles()
  pageLoading.value = false
}

watch(user, (newUser) => {
  if (newUser) loadBacklog()
}, { immediate: true })
</script>
