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
      <DumpReadModal
        v-if="showReadModal"
        :note="readingNote"
        @close="showReadModal = false"
        @edit="editFromRead"
        @delete="deleteFromRead"
      />
      <DumpModal
        v-if="showModal"
        :note="editingNote"
        :initial-raw="form.raw"
        :initial-tag="form.tag"
        @close="showModal = false"
        @save="handleSave"
        @process="handleProcess"
      />
      <TaskModal
        v-if="showTransfer"
        :task="null"
        :initial-text="transferNote?.raw || ''"
        :initial-cat="transferNote?.tag || ''"
        :initial-images="transferNote?.images || []"
        @close="showTransfer = false"
        @save="handleTransferConfirm"
      />

      <!-- Loading overlay -->
      <div v-if="saving" class="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-vault-accent border-t-transparent rounded-full animate-spin" />
          <p class="text-sm text-vault-text font-medium">{{ savingText }}</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { notes, loading, fetchNotes, createNote, updateNote } = useNotes()
const { archiveDump } = useBacklog()
const { createTask, updateTask, deleteTask } = useTasks()
const { schedule, cancel } = useNotifications()
const { show: showToast } = useToast()
const { uploadImages, cleanupOrphanedImages } = useNoteImages()
const { categoryNames, hasCategories, fetchCategories, injectAllStyles, getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()
const tags = categoryNames

const activeTag = ref('all')
const searchQuery = ref('')
const showModal = ref(false)
const editingNote = ref<any>(null)
const form = reactive({ raw: '', tag: '' })
const showReadModal = ref(false)
const readingNote = ref<any>(null)
const showTransfer = ref(false)
const transferNote = ref<any>(null)
const saving = ref(false)
const savingText = ref('Menyimpan...')

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
  form.tag = (activeTag.value !== 'all' ? activeTag.value : categoryNames.value[0]) || ''
  showModal.value = true
}

const openNote = (note: any) => {
  readingNote.value = note
  showReadModal.value = true
}

const editFromRead = () => {
  showReadModal.value = false
  editingNote.value = readingNote.value
  form.raw = readingNote.value.raw
  form.tag = readingNote.value.tag
  showModal.value = true
}

const deleteFromRead = () => {
  showReadModal.value = false
  if (readingNote.value) {
    handleDelete(readingNote.value.id)
  }
}

const openTransfer = (note: any) => {
  transferNote.value = note
  showTransfer.value = true
}

const handleTransferConfirm = async (data: { text: string; cat: string; date: string; pendingFiles: File[]; existingImages: string[]; removedImages: string[]; deadlineAt?: string | null }) => {
  saving.value = true
  savingText.value = 'Membuat task...'
  try {
    const taskPayload: any = { text: data.text, cat: data.cat || null, date: data.date }
    if (data.existingImages.length > 0) taskPayload.images = data.existingImages
    if (data.deadlineAt) taskPayload.deadline_at = data.deadlineAt
    const task = await createTask(taskPayload)
    if (!task) throw new Error('Failed to create task')
    if (data.pendingFiles.length > 0) {
      savingText.value = 'Mengupload foto...'
      const newUrls = await uploadImages(task.id, data.pendingFiles)
      if (newUrls.length > 0) {
        await updateTask(task.id, { images: [...data.existingImages, ...newUrls] })
      }
    }
    // Schedule deadline notification if set
    if (data.deadlineAt) {
      const plainText = (data.text || '').replace(/<[^>]*>/g, '').trim()
      await schedule(
        `task-deadline-${task.id}`,
        'MindVault Deadline',
        plainText.slice(0, 100) || 'Deadline task tiba',
        new Date(data.deadlineAt)
      )
    }
    showTransfer.value = false
    showToast('Task dibuat!')
  } catch (e) {
    showToast('Gagal membuat task')
  } finally {
    saving.value = false
  }
}

const handleSave = async (data: { raw: string; tag: string; reminderAt?: string | null }) => {
  saving.value = true
  savingText.value = 'Menyimpan...'
  showModal.value = false

  try {
    let noteId: string
    if (editingNote.value) {
      noteId = editingNote.value.id

      // Optimistic update local state
      const idx = notes.value.findIndex((n: any) => n.id === noteId)
      if (idx !== -1) {
        notes.value[idx] = { ...notes.value[idx], raw: data.raw, tag: data.tag || null, reminder_at: data.reminderAt }
      }

      // Cleanup orphaned images (removed from editor)
      const oldRaw = editingNote.value.raw || ''
      await cleanupOrphanedImages(oldRaw, data.raw)

      await updateNote(noteId, {
        raw: data.raw,
        tag: data.tag || null,
        reminder_at: data.reminderAt ?? null,
      })
      showToast('Note disimpan!')
    } else {
      const note = await createNote({ raw: data.raw, tag: data.tag || null })
      if (!note) throw new Error('Failed to create note')
      noteId = note.id

      if (data.reminderAt) {
        await updateNote(note.id, { reminder_at: data.reminderAt })
      }
      showToast('Note ditambahkan!')
    }

    // ── Handle reminder → linked task ──────────────────────────────────────
    await _syncReminderTask(noteId, data)

  } catch (e) {
    console.error('Failed to save note:', e)
    showToast('Gagal menyimpan note')
    fetchNotes(activeTag.value)
  } finally {
    saving.value = false
  }
}

const _syncReminderTask = async (
  noteId: string,
  data: { raw: string; tag: string; reminderAt?: string | null }
) => {
  const newReminder = data.reminderAt || null
  const note = notes.value.find((n: any) => n.id === noteId)
  const oldReminder = editingNote.value?.reminder_at || null
  const existingTaskId = editingNote.value?.reminder_task_id || null
  const plainText = (data.raw || '').replace(/<[^>]*>/g, '').trim()

  if (newReminder) {
    const reminderDate = newReminder.split('T')[0]
    const taskPayload = {
      text: data.raw,
      cat: data.tag || null,
      date: reminderDate,
      deadline_at: newReminder,
    }

    let linkedTaskId: string | null = null

    if (existingTaskId) {
      // Update existing linked task
      try {
        await updateTask(existingTaskId, taskPayload)
        linkedTaskId = existingTaskId
      } catch {
        // Task may have been deleted; create a fresh one
        const t = await createTask(taskPayload)
        linkedTaskId = t?.id ?? null
      }
    } else {
      // Create new linked task
      const t = await createTask(taskPayload)
      linkedTaskId = t?.id ?? null
    }

    // Persist reminder_task_id on note
    if (linkedTaskId && linkedTaskId !== existingTaskId) {
      await updateNote(noteId, { reminder_task_id: linkedTaskId })
    }

    // Schedule / re-schedule notification
    await schedule(
      `note-${noteId}`,
      'MindVault Reminder',
      plainText.slice(0, 100) || 'Waktu reminder tiba',
      new Date(newReminder)
    )
  } else if (!newReminder && oldReminder) {
    // Reminder cleared — delete linked task and cancel notification
    if (existingTaskId) {
      try { await deleteTask(existingTaskId) } catch {}
    }
    await updateNote(noteId, { reminder_at: null, reminder_task_id: null })
    cancel(`note-${noteId}`)
  }
}

const handleProcess = async (data: { id: string; result: any }) => {
  saving.value = true
  savingText.value = 'Memproses AI...'
  try {
    await updateNote(data.id, {
      title: data.result.title,
      poin: data.result.poin,
      action: data.result.action,
      fokus: data.result.fokus,
    })
    showToast('AI processing selesai!')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: string) => {
  saving.value = true
  savingText.value = 'Menghapus...'
  // Save note data BEFORE optimistic removal
  const note = notes.value.find((n: any) => n.id === id)
  if (!note) { saving.value = false; return }
  const backup = [...notes.value]
  notes.value = notes.value.filter((n: any) => n.id !== id)
  try {
    // Sequential: insert backlog first, then delete from notes
    await archiveDump(note)
    showToast('Note dipindah ke Backlog')
  } catch (e) {
    // Revert optimistic update
    notes.value = backup
    showToast('Gagal menghapus note')
  } finally {
    saving.value = false
  }
}
</script>
