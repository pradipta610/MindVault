<template>
  <div class="py-4 sm:py-6">
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">To-Do</h2>
      <div class="flex gap-2">
        <button
          @click="viewMode = 'day'"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="viewMode === 'day' ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text'"
        >
          Hari Ini
        </button>
        <button
          @click="viewMode = 'all'; loadAllPending()"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="viewMode === 'all' ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text'"
        >
          Semua
        </button>
      </div>
    </div>

    <div class="relative mb-3 sm:mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="searchQuery"
        placeholder="Cari task..."
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

    <div class="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
      <button
        v-for="df in dateFilters"
        :key="df.value"
        @click="activeDateFilter = activeDateFilter === df.value ? '' : df.value"
        class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors"
        :class="activeDateFilter === df.value
          ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        {{ df.label }}
      </button>
      <div class="relative">
        <input
          type="date"
          v-model="customDate"
          @change="activeDateFilter = 'custom'"
          class="bg-vault-card border border-vault-border rounded-full text-xs text-vault-muted px-3 py-1.5 focus:outline-none focus:border-vault-accent/30 transition-colors cursor-pointer"
          :class="activeDateFilter === 'custom' ? 'border-vault-accent/40 text-vault-accent' : ''"
        />
      </div>
    </div>

    <div v-if="hasCategories" class="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
      <button
        @click="activeCat = 'all'"
        class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors"
        :class="activeCat === 'all'
          ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        Semua
      </button>
      <button
        v-for="c in categories"
        :key="c"
        @click="activeCat = c"
        class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors inline-flex items-center gap-1"
        :class="activeCat === c
          ? 'border-transparent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
        :style="activeCat === c ? { backgroundColor: getCategoryColor(c) + '33', color: getCategoryColor(c), borderColor: getCategoryColor(c) + '66' } : {}"
      >
        <span class="text-[10px]">{{ getCategoryIcon(c) }}</span>
        {{ c }}
      </button>
      <button
        v-if="hasActiveFilters"
        @click="resetFilters"
        class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
      >
        Reset filter
      </button>
    </div>
    <div v-else class="mb-4 sm:mb-5 bg-vault-card border border-vault-border rounded-lg px-4 py-3 flex items-center justify-between">
      <p class="text-xs text-vault-muted">Tambah kategori dulu di Settings</p>
      <NuxtLink to="/settings" class="text-xs text-vault-accent font-medium hover:underline">Ke Settings</NuxtLink>
    </div>

    <MiniCalendar
      v-if="viewMode === 'day' && !activeDateFilter"
      :selected-date="selectedDate"
      @select="onSelectDate"
      class="mb-4 sm:mb-6"
    />

    <div v-if="viewMode === 'day' && !activeDateFilter" class="mb-4">
      <p class="text-sm text-vault-muted">
        {{ formatDisplayDate(selectedDate) }}
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <div v-if="viewMode === 'day'" class="space-y-2">
        <div v-if="filteredDayTasks.length === 0" class="text-center py-12">
          <p class="text-vault-muted text-sm">{{ hasActiveFilters || searchQuery ? 'Tidak ada task yang cocok' : 'Tidak ada task untuk hari ini.' }}</p>
        </div>
        <TaskItem
          v-for="task in filteredDayTasks"
          :key="task.id"
          :task="task"
          @toggle="handleToggle(task.id, !task.done)"
          @delete="handleDeleteTask(task.id)"
          @to-note="handleToNote(task)"
        />
      </div>

      <div v-else class="space-y-6">
        <div v-if="filteredGroupedTasks.length === 0" class="text-center py-12">
          <p class="text-vault-muted text-sm">{{ hasActiveFilters || searchQuery ? 'Tidak ada task yang cocok' : 'Semua bersih! Tidak ada task pending.' }}</p>
        </div>
        <div v-for="group in filteredGroupedTasks" :key="group.date">
          <p class="text-xs text-vault-muted font-medium mb-2 uppercase tracking-wider">
            {{ formatDisplayDate(group.date) }}
          </p>
          <div class="space-y-2">
            <TaskItem
              v-for="task in group.tasks"
              :key="task.id"
              :task="task"
              @toggle="handleToggle(task.id, !task.done)"
              @delete="handleDeleteTask(task.id)"
              @to-note="handleToNote(task)"
            />
          </div>
        </div>
      </div>
    </template>

    <div class="fixed bottom-20 left-0 right-0 z-40 px-3 sm:px-4">
      <div class="max-w-4xl mx-auto">
        <form @submit.prevent="addTask" class="flex gap-2">
          <div class="flex-1 flex gap-2 bg-vault-card border border-vault-border rounded-xl overflow-hidden">
            <select
              v-if="hasCategories"
              v-model="newCat"
              class="bg-transparent text-xs text-vault-muted px-2 sm:px-3 py-3 focus:outline-none border-r border-vault-border appearance-none cursor-pointer"
            >
              <option v-for="c in categories" :key="c" :value="c">{{ getCategoryIcon(c) }} {{ c }}</option>
            </select>
            <input
              v-model="newTask"
              placeholder="Tambah task baru..."
              class="flex-1 bg-transparent text-sm text-vault-text placeholder:text-vault-muted/50 py-3 pr-3 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            :disabled="!newTask.trim()"
            class="bg-vault-accent text-vault-bg px-4 rounded-xl font-semibold text-sm hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
          >
            +
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- Loading overlay -->
  <Teleport to="body">
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
const { tasks, loading, fetchTasksForDate, fetchAllPending, rolloverTasks, createTask, completeTask, deleteTask } = useTasks()
const { createNote } = useNotes()
const { show: showToast } = useToast()
const { categoryNames, hasCategories, fetchCategories, injectAllStyles, getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()

const categories = categoryNames
const viewMode = ref<'day' | 'all'>('day')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const newTask = ref('')
const newCat = ref('')
const searchQuery = ref('')
const saving = ref(false)
const savingText = ref('Menyimpan...')
const activeCat = ref('all')
const activeDateFilter = ref('')
const customDate = ref('')

const todayStr = computed(() => new Date().toISOString().split('T')[0])

const dateFilters = [
  { label: 'Hari ini', value: 'today' },
  { label: 'Besok', value: 'tomorrow' },
  { label: 'Minggu ini', value: 'week' },
]

const getDateRange = (filter: string): { start: string; end: string } | null => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (filter === 'today') {
    const s = today.toISOString().split('T')[0]
    return { start: s, end: s }
  }
  if (filter === 'tomorrow') {
    const t = new Date(today)
    t.setDate(t.getDate() + 1)
    const s = t.toISOString().split('T')[0]
    return { start: s, end: s }
  }
  if (filter === 'week') {
    const start = today.toISOString().split('T')[0]
    const end = new Date(today)
    end.setDate(end.getDate() + 6)
    return { start, end: end.toISOString().split('T')[0] }
  }
  if (filter === 'custom' && customDate.value) {
    return { start: customDate.value, end: customDate.value }
  }
  return null
}

const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' || activeCat.value !== 'all' || activeDateFilter.value !== ''
})

const applyFilters = (list: any[]) => {
  let result = list
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((t: any) => (t.text || '').toLowerCase().includes(q))
  }
  if (activeCat.value !== 'all') {
    result = result.filter((t: any) => t.cat === activeCat.value)
  }
  const range = getDateRange(activeDateFilter.value)
  if (range) {
    result = result.filter((t: any) => t.date >= range.start && t.date <= range.end)
  }
  return result
}

const filteredDayTasks = computed(() => applyFilters(tasks.value))

const filteredGroupedTasks = computed(() => {
  const filtered = applyFilters(tasks.value)
  const groups: Record<string, any[]> = {}
  for (const task of filtered) {
    if (!groups[task.date]) groups[task.date] = []
    groups[task.date].push(task)
  }
  return Object.entries(groups)
    .map(([date, tasks]) => ({ date, tasks }))
    .sort((a, b) => a.date.localeCompare(b.date))
})

const resetFilters = () => {
  searchQuery.value = ''
  activeCat.value = 'all'
  activeDateFilter.value = ''
  customDate.value = ''
}

const onSelectDate = (date: string) => {
  selectedDate.value = date
  fetchTasksForDate(date)
}

const loadAllPending = () => {
  fetchAllPending()
}

const addTask = async () => {
  if (!newTask.value.trim()) return
  saving.value = true
  savingText.value = 'Menambah task...'
  try {
    const date = viewMode.value === 'day' ? selectedDate.value : todayStr.value
    await createTask({ text: newTask.value.trim(), cat: newCat.value || null, date })
    newTask.value = ''
    showToast('Task ditambahkan!')
  } catch (e) {
    showToast('Gagal menambah task')
  } finally {
    saving.value = false
  }
}

const handleToggle = async (id: string, done: boolean) => {
  if (!done) return // Only handle marking as done
  const task = tasks.value.find((t: any) => t.id === id)
  if (!task) return
  // Save task data before optimistic removal
  const taskData = { ...task }
  const backup = [...tasks.value]
  tasks.value = tasks.value.filter((t: any) => t.id !== id)
  saving.value = true
  savingText.value = 'Menyelesaikan task...'
  try {
    // Sequential: insert backlog first, then delete from tasks
    await completeTask(taskData)
    showToast('Task selesai! Masuk Backlog.')
  } catch (e) {
    // Revert optimistic update
    tasks.value = backup
    showToast('Gagal menyelesaikan task')
  } finally {
    saving.value = false
  }
}

const handleDeleteTask = async (id: string) => {
  saving.value = true
  savingText.value = 'Menghapus...'
  const backup = [...tasks.value]
  tasks.value = tasks.value.filter((t: any) => t.id !== id)
  try {
    await deleteTask(id)
    showToast('Task dihapus')
  } catch (e) {
    tasks.value = backup
    showToast('Gagal menghapus task')
  } finally {
    saving.value = false
  }
}

const handleToNote = async (task: any) => {
  saving.value = true
  savingText.value = 'Membuat note...'
  try {
    await createNote({ raw: task.text, tag: task.cat || null, title: task.text })
    showToast('Note dibuat!')
  } catch (e) {
    showToast('Gagal membuat note')
  } finally {
    saving.value = false
  }
}

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

// BUG 3: Sync newCat with active category filter
watch(activeCat, (cat) => {
  if (cat !== 'all') {
    newCat.value = cat
  }
})

watch(user, async (newUser) => {
  if (newUser) {
    await fetchCategories()
    injectAllStyles()
    if (!newCat.value && categoryNames.value.length > 0) {
      newCat.value = categoryNames.value[0]
    }
    await rolloverTasks()
    fetchTasksForDate(selectedDate.value)
  }
}, { immediate: true })
</script>
