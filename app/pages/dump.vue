<template>
  <div class="py-4 sm:py-6">
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">Dump</h2>
      <button
        @click="openNewNote"
        class="bg-vault-accent text-vault-bg px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors"
      >
        + New
      </button>
    </div>

    <div class="relative mb-3 sm:mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="searchQuery"
        placeholder="Cari notes..."
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

    <div v-if="hasCategories" class="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <button
        @click="activeTag = 'all'; fetchNotes('all')"
        class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors"
        :class="activeTag === 'all'
          ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        Semua
      </button>
      <button
        v-for="t in tags"
        :key="t"
        @click="activeTag = t; fetchNotes(t)"
        class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors inline-flex items-center gap-1"
        :class="activeTag === t
          ? 'border-transparent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
        :style="activeTag === t ? { backgroundColor: getCategoryColor(t) + '33', color: getCategoryColor(t), borderColor: getCategoryColor(t) + '66' } : {}"
      >
        <span class="text-[10px]">{{ getCategoryIcon(t) }}</span>
        {{ t }}
      </button>
    </div>
    <div v-else class="mb-4 sm:mb-6 bg-vault-card border border-vault-border rounded-lg px-4 py-3 flex items-center justify-between">
      <p class="text-xs text-vault-muted">Tambah kategori dulu di Settings</p>
      <NuxtLink to="/settings" class="text-xs text-vault-accent font-medium hover:underline">Ke Settings</NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <div v-else-if="notes.length === 0 && !searchQuery" class="text-center py-16">
      <p class="text-vault-muted">Belum ada notes. Mulai dump pikiranmu!</p>
    </div>

    <div v-else-if="filteredNotes.length === 0" class="text-center py-16">
      <p class="text-vault-muted">Tidak ada notes yang cocok</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
      <DumpCard
        v-for="note in filteredNotes"
        :key="note.id"
        :note="note"
        :search-query="searchQuery"
        @click="openNote(note)"
        @delete="handleDelete(note.id)"
        @transfer="openTransfer(note)"
      />
    </div>

    <Teleport to="body">
      <DumpModal
        v-if="showModal"
        :note="editingNote"
        :initial-raw="form.raw"
        :initial-tag="form.tag"
        @close="showModal = false"
        @save="handleSave"
        @process="handleProcess"
      />
      <TransferModal
        v-if="showTransfer"
        title="Jadikan Task"
        confirm-label="Buat Task"
        :initial-text="transferNote?.title || transferNote?.raw || ''"
        :initial-cat="transferNote?.tag || 'misc'"
        :show-text="true"
        :show-category="true"
        :show-date="true"
        @close="showTransfer = false"
        @confirm="handleTransferConfirm"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { notes, loading, fetchNotes, createNote, updateNote, archiveNote } = useNotes()
const { createTask } = useTasks()
const { show: showToast } = useToast()
const { categoryNames, hasCategories, fetchCategories, injectAllStyles, getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()
const tags = categoryNames

const activeTag = ref('all')
const searchQuery = ref('')
const showModal = ref(false)
const editingNote = ref<any>(null)
const form = reactive({ raw: '', tag: '' })
const showTransfer = ref(false)
const transferNote = ref<any>(null)

const filteredNotes = computed(() => {
  if (!searchQuery.value.trim()) return notes.value
  const q = searchQuery.value.toLowerCase()
  return notes.value.filter((n: any) => {
    const title = (n.title || '').toLowerCase()
    const raw = (n.raw || '').toLowerCase()
    return title.includes(q) || raw.includes(q)
  })
})

watch(user, async (newUser) => {
  if (newUser) {
    await fetchCategories()
    injectAllStyles()
    fetchNotes(activeTag.value)
  }
}, { immediate: true })

const openNewNote = () => {
  editingNote.value = null
  form.raw = ''
  form.tag = categoryNames.value[0] || ''
  showModal.value = true
}

const openNote = (note: any) => {
  editingNote.value = note
  form.raw = note.raw
  form.tag = note.tag
  showModal.value = true
}

const openTransfer = (note: any) => {
  transferNote.value = note
  showTransfer.value = true
}

const handleTransferConfirm = async (data: { text: string; cat: string; date: string }) => {
  await createTask({ text: data.text, cat: data.cat || null, date: data.date })
  showTransfer.value = false
  showToast('Task dibuat!')
}

const handleSave = async (data: { raw: string; tag: string }) => {
  if (editingNote.value) {
    await updateNote(editingNote.value.id, { raw: data.raw, tag: data.tag || null })
  } else {
    await createNote({ raw: data.raw, tag: data.tag || null })
  }
  showModal.value = false
}

const handleProcess = async (data: { id: string; result: any }) => {
  await updateNote(data.id, {
    title: data.result.title,
    poin: data.result.poin,
    action: data.result.action,
    fokus: data.result.fokus,
  })
}

const handleDelete = async (id: string) => {
  await archiveNote(id)
  showToast('Note dipindah ke Backlog')
}
</script>
