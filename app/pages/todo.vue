<template>
  <div class="py-4 sm:py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">To-Do</h2>
      <div class="flex items-center gap-2">
        <!-- Search toggle -->
        <button
          @click="showSearch = !showSearch"
          class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          :class="showSearch ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
        <!-- Filter button -->
        <TodoFilterSheet
          v-if="hasCategories"
          v-model="activeCat"
          :categories="categories"
        />
      </div>
    </div>

    <!-- Search bar (collapsible) -->
    <div v-if="showSearch" class="relative mb-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="searchQuery"
        placeholder="Cari task..."
        class="w-full bg-vault-card border border-vault-border rounded-xl pl-10 pr-8 py-2.5 text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
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

    <!-- No categories banner -->
    <div v-if="!hasCategories" class="mb-4 bg-vault-card border border-vault-border rounded-lg px-4 py-3 flex items-center justify-between">
      <p class="text-xs text-vault-muted">Tambah kategori dulu di Settings</p>
      <NuxtLink to="/settings" class="text-xs text-vault-accent font-medium hover:underline">Ke Settings</NuxtLink>
    </div>

    <!-- ═══ Desktop layout (>768px): side by side ═══ -->
    <div class="hidden md:grid md:grid-cols-[340px_1fr] md:gap-6">
      <!-- Left: Calendar -->
      <div>
        <div class="bg-vault-card border border-vault-border rounded-xl p-4 sticky top-4">
          <TodoCalendar
            ref="calendarRef"
            :selected-date="selectedDate"
            :task-dots="taskDots"
            @select="onSelectDate"
          />
        </div>
      </div>

      <!-- Right: Task list -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium text-vault-text">{{ formatDisplayDate(selectedDate) }}</p>
          <button
            @click="openNewTask"
            class="flex items-center gap-1.5 bg-vault-accent text-vault-bg px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Task Baru
          </button>
        </div>

        <SkeletonLoader v-if="neverLoaded && loading" type="task" :count="4" />
        <div v-else-if="filteredTasks.length === 0 && !neverLoaded" class="text-center py-12">
          <p class="text-vault-muted text-sm">{{ searchQuery || activeCat !== 'all' ? 'Tidak ada task yang cocok' : 'Tidak ada task untuk hari ini.' }}</p>
        </div>
        <div v-else class="space-y-2">
          <TaskItem
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            :search-query="searchQuery"
            @click="openTask(task)"
            @toggle="handleToggle(task.id, !task.done)"
            @delete="handleDeleteTask(task.id)"
            @to-note="handleToNote(task)"
          />
        </div>
      </div>
    </div>

    <!-- ═══ Mobile layout (≤768px): stacked ═══ -->
    <div class="md:hidden">
      <!-- Calendar -->
      <div class="bg-vault-card border border-vault-border rounded-xl p-3 mb-4">
        <TodoCalendar
          ref="calendarMobileRef"
          :selected-date="selectedDate"
          :task-dots="taskDots"
          @select="onSelectDate"
        />
      </div>

      <!-- Date label -->
      <p class="text-sm font-medium text-vault-text mb-3">{{ formatDisplayDate(selectedDate) }}</p>

      <!-- Task list -->
      <SkeletonLoader v-if="neverLoaded && loading" type="task" :count="4" />
      <div v-else-if="filteredTasks.length === 0 && !neverLoaded" class="text-center py-12 pb-24">
        <p class="text-vault-muted text-sm">{{ searchQuery || activeCat !== 'all' ? 'Tidak ada task yang cocok' : 'Tidak ada task untuk hari ini.' }}</p>
      </div>
      <div v-else class="space-y-2 pb-24">
        <TaskItem
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          :search-query="searchQuery"
          @click="openTask(task)"
          @toggle="handleToggle(task.id, !task.done)"
          @delete="handleDeleteTask(task.id)"
          @to-note="handleToNote(task)"
        />
      </div>

      <!-- FAB -->
      <button
        @click="openNewTask"
        class="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-vault-accent text-vault-bg shadow-lg flex items-center justify-center hover:bg-vault-accent-dim transition-colors active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Task edit/create modal -->
  <Teleport to="body">
    <TaskModal
      v-if="showTaskModal"
      :task="editingTask"
      :initial-date="selectedDate"
      :initial-cat="activeCat !== 'all' ? activeCat : undefined"
      @close="showTaskModal = false; editingTask = null"
      @save="handleTaskSave"
    />

    <div v-if="saving" class="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-3 border-vault-accent border-t-transparent rounded-full animate-spin" />
        <p class="text-sm text-vault-text font-medium">{{ savingText }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { tasks, loading, neverLoaded, fetchTasksForDate, fetchTasksForRange, rolloverTasks, createTask, updateTask, completeTask, deleteTask } = useTasks()
const { createNote, updateNote } = useNotes()
const { uploadImages, deleteImage } = useNoteImages()
const { show: showToast } = useToast()
const { schedule, cancel } = useNotifications()
const { categoryNames, hasCategories, fetchCategories, injectAllStyles, getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()

const categories = categoryNames
const selectedDate = ref(toDateString(new Date()))
const { register: registerSync } = useBackgroundSync()
registerSync(() => fetchTasksForDate(selectedDate.value))
const searchQuery = ref('')
const showSearch = ref(false)
const saving = ref(false)
const savingText = ref('Menyimpan...')
const activeCat = ref('all')
const showTaskModal = ref(false)
const editingTask = ref<any>(null)
const calendarRef = ref<any>(null)
const calendarMobileRef = ref<any>(null)
const taskDots = ref<Record<string, string[]>>({})

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Filtered tasks for selected date ─────────────────────────────────────
const filteredTasks = computed(() => {
  let result = tasks.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((t: any) => (t.text || '').replace(/<[^>]*>/g, '').toLowerCase().includes(q))
  }
  if (activeCat.value !== 'all') {
    result = result.filter((t: any) => t.cat === activeCat.value)
  }
  return result
})

// ── Calendar dots (category colors per date) ─────────────────────────────
const loadDots = async () => {
  const cal = calendarRef.value || calendarMobileRef.value
  if (!cal?.visibleRange) return
  const { start, end } = cal.visibleRange
  if (!start || !end) return
  const rangeTasks = await fetchTasksForRange(start, end)
  const dots: Record<string, string[]> = {}
  for (const t of rangeTasks) {
    if (!dots[t.date]) dots[t.date] = []
    dots[t.date].push(t.cat || null)
  }
  taskDots.value = dots
}

// ── Date selection ───────────────────────────────────────────────────────
const onSelectDate = (date: string) => {
  selectedDate.value = date
  fetchTasksForDate(date)
  loadDots()
}

// ── New task ─────────────────────────────────────────────────────────────
const openNewTask = () => {
  editingTask.value = null
  showTaskModal.value = true
}

const openTask = (task: any) => {
  editingTask.value = task
  showTaskModal.value = true
}

// ── Toggle (mark as done → backlog) ──────────────────────────────────────
const handleToggle = async (id: string, done: boolean) => {
  if (!done) return
  const task = tasks.value.find((t: any) => t.id === id)
  if (!task) return
  const taskData = { ...task }
  const backup = [...tasks.value]
  tasks.value = tasks.value.filter((t: any) => t.id !== id)
  saving.value = true
  savingText.value = 'Menyelesaikan task...'
  try {
    cancel(`task-deadline-${id}`)
    await completeTask(taskData)
    showToast('Task selesai! Masuk Backlog.')
    loadDots()
  } catch (e) {
    tasks.value = backup
    showToast('Gagal menyelesaikan task')
  } finally {
    saving.value = false
  }
}

// ── Delete → backlog ─────────────────────────────────────────────────────
const handleDeleteTask = async (id: string) => {
  saving.value = true
  savingText.value = 'Menghapus...'
  const task = tasks.value.find((t: any) => t.id === id)
  if (!task) { saving.value = false; return }
  const backup = [...tasks.value]
  tasks.value = tasks.value.filter((t: any) => t.id !== id)
  try {
    cancel(`task-deadline-${id}`)
    await completeTask({ ...task })
    showToast('Task dihapus ke Backlog')
    loadDots()
  } catch (e) {
    tasks.value = backup
    showToast('Gagal menghapus task')
  } finally {
    saving.value = false
  }
}

// ── Save (edit or create) ────────────────────────────────────────────────
const handleTaskSave = async (data: { text: string; cat: string; date: string; pendingFiles: File[]; existingImages: string[]; removedImages: string[]; deadlineAt?: string | null }) => {
  saving.value = true
  showTaskModal.value = false

  if (editingTask.value) {
    // ── Edit existing task ──
    savingText.value = 'Menyimpan task...'
    const taskId = editingTask.value.id
    const oldDeadline = editingTask.value.deadline_at || null
    try {
      if (data.removedImages.length) {
        await Promise.all(data.removedImages.map(url => deleteImage(taskId, url)))
      }
      let newUrls: string[] = []
      if (data.pendingFiles.length) {
        savingText.value = 'Mengupload foto...'
        newUrls = await uploadImages(taskId, data.pendingFiles)
      }
      const finalImages = [...data.existingImages, ...newUrls]
      const updates: Record<string, any> = {
        text: data.text,
        cat: data.cat || null,
        date: data.date,
        deadline_at: data.deadlineAt ?? null,
      }
      if (finalImages.length > 0) updates.images = finalImages
      await updateTask(taskId, updates)

      const plainText = (data.text || '').replace(/<[^>]*>/g, '').trim()
      if (data.deadlineAt) {
        await schedule(`task-deadline-${taskId}`, 'MindVault Deadline', plainText.slice(0, 100) || 'Deadline task tiba', new Date(data.deadlineAt))
      } else if (!data.deadlineAt && oldDeadline) {
        cancel(`task-deadline-${taskId}`)
      }

      // Refresh if the date changed
      if (data.date !== selectedDate.value) {
        fetchTasksForDate(selectedDate.value)
      }
      showToast('Task disimpan!')
      loadDots()
    } catch (e) {
      showToast('Gagal menyimpan task')
    }
  } else {
    // ── Create new task ──
    savingText.value = 'Menambah task...'
    try {
      const task = await createTask({ text: data.text, cat: data.cat || null, date: data.date })
      if (task && data.pendingFiles.length) {
        savingText.value = 'Mengupload foto...'
        const urls = await uploadImages(task.id, data.pendingFiles)
        if (urls.length > 0) await updateTask(task.id, { images: urls })
      }
      if (task && data.deadlineAt) {
        await updateTask(task.id, { deadline_at: data.deadlineAt })
        const plainText = (data.text || '').replace(/<[^>]*>/g, '').trim()
        await schedule(`task-deadline-${task.id}`, 'MindVault Deadline', plainText.slice(0, 100) || 'Deadline task tiba', new Date(data.deadlineAt))
      }
      // Refresh if created for a different date
      if (data.date !== selectedDate.value) {
        fetchTasksForDate(selectedDate.value)
      }
      showToast('Task ditambahkan!')
      loadDots()
    } catch (e) {
      showToast('Gagal menambah task')
    }
  }

  editingTask.value = null
  saving.value = false
}

// ── To note ──────────────────────────────────────────────────────────────
const handleToNote = async (task: any) => {
  saving.value = true
  savingText.value = 'Membuat note...'
  try {
    const note = await createNote({ raw: task.text, tag: task.cat || null })
    if (note && task.images && task.images.length > 0) {
      await updateNote(note.id, { images: task.images })
    }
    showToast('Note dibuat!')
  } catch (e) {
    showToast('Gagal membuat note')
  } finally {
    saving.value = false
  }
}

// ── Format ───────────────────────────────────────────────────────────────
const formatDisplayDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = d.getTime() - today.getTime()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Besok'
  if (days === -1) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── Init ─────────────────────────────────────────────────────────────────
watch(user, async (newUser) => {
  if (newUser) {
    await fetchCategories()
    injectAllStyles()
    await rolloverTasks()
    fetchTasksForDate(selectedDate.value)
    nextTick(() => loadDots())
  }
}, { immediate: true })
</script>
