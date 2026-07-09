<template>
  <div class="py-4 sm:py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">To-Do</h2>
      <div class="flex items-center gap-1.5">
        <!-- Multi-select toggle -->
        <button
          @click="toggleSelectMode"
          class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          :class="selectMode ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
          title="Pilih banyak"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
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
        <!-- Category filter -->
        <TodoFilterSheet
          v-if="hasCategories"
          v-model="activeCat"
          :categories="categories"
        />
        <!-- Calendar / date filter popover -->
        <div class="relative" ref="calendarPopoverRef">
          <button
            @click="toggleCalendarPopover"
            class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative"
            :class="dateFilter ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
            </svg>
            <span v-if="dateFilter" class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-vault-accent" />
          </button>
          <Transition name="fade">
            <div v-if="showCalendarPopover" class="absolute right-0 top-full mt-1.5 z-50 bg-vault-card border border-vault-border rounded-xl shadow-lg p-3 w-[300px]">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs text-vault-muted">Filter tanggal</p>
                <button v-if="dateFilter" @click="clearDateFilter" class="text-[11px] text-vault-accent hover:underline">Reset</button>
              </div>
              <TodoCalendar
                ref="calendarRef"
                :selected-date="dateFilter || todayStr"
                :task-dots="taskDots"
                @select="onSelectDateFilter"
              />
            </div>
          </Transition>
        </div>
        <!-- Manage custom fields -->
        <ManageFieldsPopover ref="manageFieldsRef" />
        <!-- New task (desktop) -->
        <button
          @click="openNewTask"
          class="hidden sm:flex items-center gap-1.5 bg-vault-accent text-vault-bg px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Task Baru
        </button>
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

    <!-- Active date filter chip -->
    <div v-if="dateFilter" class="mb-3 flex items-center gap-2">
      <span class="text-xs bg-vault-accent/15 text-vault-accent px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
        {{ formatDisplayDate(dateFilter) }}
        <button @click="clearDateFilter" class="hover:text-vault-text">✕</button>
      </span>
    </div>

    <!-- No categories banner -->
    <div v-if="!hasCategories" class="mb-4 bg-vault-card border border-vault-border rounded-lg px-4 py-3 flex items-center justify-between">
      <p class="text-xs text-vault-muted">Tambah kategori dulu di Settings</p>
      <NuxtLink to="/settings" class="text-xs text-vault-accent font-medium hover:underline">Ke Settings</NuxtLink>
    </div>

    <SkeletonLoader v-if="neverLoaded && loading" type="task" :count="4" />

    <template v-else>
      <!-- ═══ Desktop (≥768px): table view ═══ -->
      <div class="hidden md:block">
        <TodoTable
          :tasks="sortedTasks"
          :done-tasks="filteredDoneTasks"
          :fields="taskFields"
          :sort-field="sortField"
          :sort-dir="sortDir"
          :category-names="categories"
          :empty-message="emptyMessage"
          :select-mode="selectMode"
          :selected-ids="selectedIds"
          @sort="handleSort"
          @row-click="openTask"
          @toggle-done="handleToggle"
          @cell-update="handleCellUpdate"
          @add-field="manageFieldsRef?.openCreate()"
          @quick-add="handleQuickAdd"
          @toggle-select="handleToggleSelect"
          @toggle-select-all="handleToggleSelectAll"
          @reorder="handleReorder"
          @uncheck-done="handleUncheckDone"
          @archive-done="handleArchiveDone"
          @delete-done="handleDeleteDone"
        />
      </div>

      <!-- ═══ Mobile (<768px): card list ═══ -->
      <div class="md:hidden">
        <div v-if="sortedTasks.length === 0 && filteredDoneTasks.length === 0" class="text-center py-12 pb-24">
          <p class="text-vault-muted text-sm">{{ emptyMessage }}</p>
        </div>
        <div v-else class="space-y-2 pb-24">
          <TaskItem
            v-for="task in sortedTasks"
            :key="task.id"
            :task="task"
            :search-query="searchQuery"
            :select-mode="selectMode"
            :selected="selectedIds.has(task.id)"
            @click="openTask(task)"
            @toggle="handleToggle(task.id)"
            @delete="handleDeleteTask(task.id)"
            @to-note="handleToNote(task)"
            @select="handleToggleSelect(task.id)"
          />

          <!-- Mobile done section -->
          <template v-if="filteredDoneTasks.length > 0">
            <button
              class="w-full text-left px-4 py-2.5 flex items-center justify-between bg-vault-card border border-vault-border rounded-xl"
              @click="mobileDoneExpanded = !mobileDoneExpanded"
            >
              <span class="text-xs font-medium text-vault-muted flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Selesai ({{ filteredDoneTasks.length }})
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted transition-transform" :class="mobileDoneExpanded ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <template v-if="mobileDoneExpanded">
              <div
                v-for="task in filteredDoneTasks"
                :key="task.id"
                class="bg-vault-card border border-vault-border rounded-xl p-3 flex items-center gap-3 opacity-60"
              >
                <button @click="handleUncheckDone(task.id)" class="w-5 h-5 rounded-full border-2 bg-vault-accent border-vault-accent flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </button>
                <p class="text-sm text-vault-muted line-through flex-1 truncate">{{ (task.text || '').replace(/<[^>]*>/g, '').trim() }}</p>
                <button @click="handleArchiveDone(task)" class="text-vault-muted hover:text-vault-accent transition-colors p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </button>
              </div>
            </template>
          </template>
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
    </template>
  </div>

  <!-- Task edit/create modal -->
  <Teleport to="body">
    <TaskModal
      v-if="showTaskModal"
      :task="editingTask"
      :initial-date="dateFilter || todayStr"
      :initial-cat="activeCat !== 'all' ? activeCat : undefined"
      :task-fields="taskFields"
      @close="showTaskModal = false; editingTask = null"
      @save="handleTaskSave"
    />

    <div v-if="saving" class="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-3 border-vault-accent border-t-transparent rounded-full animate-spin" />
        <p class="text-sm text-vault-text font-medium">{{ savingText }}</p>
      </div>
    </div>

    <!-- Bulk action bar -->
    <Transition name="slide-up">
      <div
        v-if="selectMode && selectedIds.size > 0"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-vault-card border border-vault-border rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 flex-wrap max-w-[calc(100vw-2rem)]"
      >
        <span class="text-xs font-medium text-vault-muted shrink-0">{{ selectedIds.size }} dipilih</span>
        <div class="w-px h-4 bg-vault-border shrink-0" />

        <!-- Mark done -->
        <button
          @click="handleBulkMarkDone"
          class="text-xs bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg px-3 py-1.5 hover:bg-green-500/20 transition-colors shrink-0"
        >✓ Selesai</button>

        <!-- Category -->
        <select
          @change="handleBulkChangeCat(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
          class="text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1.5 text-vault-text focus:outline-none"
        >
          <option value="">Kategori...</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>

        <!-- Date -->
        <div class="relative">
          <span class="text-[10px] text-vault-muted absolute -top-2 left-1 bg-vault-card px-0.5">Tanggal</span>
          <input
            type="date"
            @change="handleBulkChangeDate(($event.target as HTMLInputElement).value); ($event.target as HTMLInputElement).value = ''"
            class="text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1.5 text-vault-text focus:outline-none"
          />
        </div>

        <!-- Deadline -->
        <div class="relative">
          <span class="text-[10px] text-vault-muted absolute -top-2 left-1 bg-vault-card px-0.5">Deadline</span>
          <input
            type="datetime-local"
            @change="handleBulkChangeDeadline(($event.target as HTMLInputElement).value); ($event.target as HTMLInputElement).value = ''"
            class="text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1.5 text-vault-text focus:outline-none"
          />
        </div>

        <!-- Custom fields -->
        <template v-for="f in taskFields" :key="f.id">
          <div v-if="f.type === 'select'" class="relative">
            <span class="text-[10px] text-vault-muted absolute -top-2 left-1 bg-vault-card px-0.5 truncate max-w-[80px]">{{ f.label }}</span>
            <select
              @change="handleBulkChangeCustomField(f.key, ($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
              class="text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1.5 text-vault-text focus:outline-none"
            >
              <option value="">{{ f.label }}...</option>
              <option v-for="opt in f.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div v-else-if="f.type === 'checkbox'" class="relative">
            <button
              @click="handleBulkChangeCustomField(f.key, true)"
              class="text-xs bg-vault-bg border border-vault-border rounded-lg px-3 py-1.5 text-vault-muted hover:text-vault-accent transition-colors"
            >{{ f.label }} ✓</button>
          </div>
          <div v-else-if="f.type === 'date'" class="relative">
            <span class="text-[10px] text-vault-muted absolute -top-2 left-1 bg-vault-card px-0.5 truncate max-w-[80px]">{{ f.label }}</span>
            <input
              type="date"
              @change="handleBulkChangeCustomField(f.key, ($event.target as HTMLInputElement).value); ($event.target as HTMLInputElement).value = ''"
              class="text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1.5 text-vault-text focus:outline-none"
            />
          </div>
          <div v-else-if="f.type === 'text' || f.type === 'number'" class="relative">
            <span class="text-[10px] text-vault-muted absolute -top-2 left-1 bg-vault-card px-0.5 truncate max-w-[80px]">{{ f.label }}</span>
            <input
              :type="f.type === 'number' ? 'number' : 'text'"
              :placeholder="f.label + '...'"
              @keydown.enter="handleBulkChangeCustomField(f.key, ($event.target as HTMLInputElement).value); ($event.target as HTMLInputElement).value = ''"
              class="text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1.5 text-vault-text focus:outline-none w-28"
            />
          </div>
        </template>

        <div class="w-px h-4 bg-vault-border shrink-0" />

        <!-- Delete -->
        <button
          @click="handleBulkDelete"
          class="text-xs bg-red-500/10 text-red-400 border border-red-400/20 rounded-lg px-3 py-1.5 hover:bg-red-500/20 transition-colors shrink-0"
        >Hapus ke Backlog</button>

        <button @click="clearSelection" class="text-vault-muted hover:text-vault-text transition-colors shrink-0 ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { tasks, doneTasks, loading, neverLoaded, fetchAllPending, fetchTasksForRange, fetchDoneTasks, rolloverTasks, createTask, updateTask, completeTask, markTaskDone, markTaskUndone, archiveAndRemoveDone, purgeDoneTask, deleteTask } = useTasks()
const { createNote, updateNote } = useNotes()
const { uploadImages, deleteImage } = useNoteImages()
const { show: showToast } = useToast()
const { schedule, cancel } = useNotifications()
const { categoryNames, hasCategories, fetchCategories, injectAllStyles } = useCategories()
const { fields: taskFields, fetchFields } = useTaskFields()

const categories = categoryNames
const todayStr = new Date().toISOString().split('T')[0]
const { register: registerSync } = useBackgroundSync()
registerSync(() => fetchAllPending())
const searchQuery = ref('')
const showSearch = ref(false)
const saving = ref(false)
const savingText = ref('Menyimpan...')
const activeCat = ref('all')
const dateFilter = ref<string | null>(null)
const showTaskModal = ref(false)
const editingTask = ref<any>(null)
const calendarRef = ref<any>(null)
const manageFieldsRef = ref<any>(null)
const taskDots = ref<Record<string, string[]>>({})

const showCalendarPopover = ref(false)
const calendarPopoverRef = ref<HTMLElement | null>(null)

const sortField = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc' | null>(null)

// Multi-select
const selectMode = ref(false)
const selectedIds = ref(new Set<string>())
const clearSelection = () => { selectedIds.value = new Set() }
const toggleSelectMode = () => {
  selectMode.value = !selectMode.value
  if (!selectMode.value) clearSelection()
}
const handleToggleSelect = (id: string) => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  selectedIds.value = next
}
const handleToggleSelectAll = () => {
  if (selectedIds.value.size === sortedTasks.value.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(sortedTasks.value.map((t: any) => t.id))
  }
}

// Row drag order
const taskOrder = ref<string[]>([])
onMounted(() => {
  taskOrder.value = JSON.parse(localStorage.getItem('mv_task_order') || '[]')
})

const handleReorder = (newIds: string[]) => {
  const visibleSet = new Set(newIds)
  const others = taskOrder.value.filter(id => !visibleSet.has(id))
  taskOrder.value = [...newIds, ...others]
  localStorage.setItem('mv_task_order', JSON.stringify(taskOrder.value))
}

const mobileDoneExpanded = ref(false)

// Bulk actions
const handleBulkChangeCat = async (cat: string) => {
  if (!cat) return
  for (const id of selectedIds.value) await updateTask(id, { cat: cat || null })
  clearSelection()
  showToast('Kategori diubah')
}
const handleBulkChangeDate = async (date: string) => {
  if (!date) return
  for (const id of selectedIds.value) await updateTask(id, { date })
  clearSelection()
  showToast('Tanggal diubah')
}
const handleBulkChangeDeadline = async (val: string) => {
  if (!val) return
  const iso = new Date(val).toISOString()
  for (const id of selectedIds.value) await updateTask(id, { deadline_at: iso })
  clearSelection()
  showToast('Deadline diubah')
}
const handleBulkMarkDone = async () => {
  for (const id of selectedIds.value) {
    cancel(`task-deadline-${id}`)
    await markTaskDone(id)
  }
  clearSelection()
  showToast('Task ditandai selesai')
}
const handleBulkChangeCustomField = async (key: string, value: any) => {
  if (value === '' || value === null || value === undefined) return
  for (const id of selectedIds.value) {
    const task = tasks.value.find((t: any) => t.id === id)
    if (!task) continue
    await updateTask(id, { custom_fields: { ...(task.custom_fields || {}), [key]: value } })
  }
  clearSelection()
  showToast('Field diubah')
}
const handleBulkDelete = async () => {
  for (const id of selectedIds.value) {
    const task = tasks.value.find((t: any) => t.id === id)
    if (task) await completeTask({ ...task })
  }
  clearSelection()
  showToast('Task dipindah ke Backlog')
}

// ── Filter pipeline ───────────────────────────────────────────────────────
const filteredTasks = computed(() => {
  let result = tasks.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((t: any) => (t.text || '').replace(/<[^>]*>/g, '').toLowerCase().includes(q))
  }
  if (activeCat.value !== 'all') {
    result = result.filter((t: any) => t.cat === activeCat.value)
  }
  if (dateFilter.value) {
    result = result.filter((t: any) => t.date === dateFilter.value)
  }
  return result
})

const filteredDoneTasks = computed(() => {
  let result = doneTasks.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((t: any) => (t.text || '').replace(/<[^>]*>/g, '').toLowerCase().includes(q))
  }
  if (activeCat.value !== 'all') {
    result = result.filter((t: any) => t.cat === activeCat.value)
  }
  if (dateFilter.value) {
    result = result.filter((t: any) => t.date === dateFilter.value)
  }
  return result
})

const plainText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const sortValue = (task: any, field: string): any => {
  if (field === 'text') return plainText(task.text).toLowerCase()
  if (field === 'cat') return (task.cat || '').toLowerCase()
  if (field === 'date') return task.date || null
  if (field === 'deadline_at') return task.deadline_at || null
  if (field.startsWith('custom:')) {
    const key = field.slice('custom:'.length)
    const fieldDef = taskFields.value.find((f: any) => f.key === key)
    const val = task.custom_fields?.[key]
    if (val === undefined || val === null || val === '') return null
    if (fieldDef?.type === 'select') {
      const opt = (fieldDef.options || []).find((o: any) => o.value === val)
      return (opt?.label || '').toLowerCase()
    }
    return val
  }
  return null
}

const sortedTasks = computed(() => {
  // When no column sort, apply drag order
  if (!sortField.value || !sortDir.value) {
    const order = taskOrder.value
    if (order.length === 0) return filteredTasks.value
    const sorted = order.map(id => filteredTasks.value.find((t: any) => t.id === id)).filter(Boolean) as any[]
    const rest = filteredTasks.value.filter((t: any) => !order.includes(t.id))
    return [...sorted, ...rest]
  }
  const dir = sortDir.value === 'asc' ? 1 : -1
  const field = sortField.value
  return [...filteredTasks.value].sort((a: any, b: any) => {
    const va = sortValue(a, field)
    const vb = sortValue(b, field)
    const aEmpty = va === null || va === undefined || va === ''
    const bEmpty = vb === null || vb === undefined || vb === ''
    if (aEmpty && bEmpty) return 0
    if (aEmpty) return 1
    if (bEmpty) return -1
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

const emptyMessage = computed(() => {
  if (searchQuery.value || activeCat.value !== 'all' || dateFilter.value) return 'Tidak ada task yang cocok'
  return 'Tidak ada task pending.'
})

const handleSort = (field: string) => {
  if (sortField.value !== field) {
    sortField.value = field
    sortDir.value = 'asc'
    return
  }
  if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
    return
  }
  sortField.value = null
  sortDir.value = null
}

// ── Calendar popover (date filter) ───────────────────────────────────────
const toggleCalendarPopover = () => {
  showCalendarPopover.value = !showCalendarPopover.value
  if (showCalendarPopover.value) nextTick(() => loadDots())
}

const clearDateFilter = () => {
  dateFilter.value = null
  showCalendarPopover.value = false
}

const onSelectDateFilter = (date: string) => {
  dateFilter.value = date
  showCalendarPopover.value = false
}

const loadDots = async () => {
  const cal = calendarRef.value
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

const handleClickOutsideCalendar = (e: MouseEvent) => {
  if (calendarPopoverRef.value && !calendarPopoverRef.value.contains(e.target as Node)) {
    showCalendarPopover.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutsideCalendar))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutsideCalendar))

// ── New task ─────────────────────────────────────────────────────────────
const openNewTask = () => {
  editingTask.value = null
  showTaskModal.value = true
}

const openTask = (task: any) => {
  editingTask.value = task
  showTaskModal.value = true
}

// ── Quick-add (inline row in table) ───────────────────────────────────────
const handleQuickAdd = async (text: string) => {
  try {
    await createTask({
      text,
      cat: activeCat.value !== 'all' ? activeCat.value : null,
      date: dateFilter.value || todayStr,
    })
  } catch (e) {
    showToast('Gagal menambah task')
  }
}

// ── Toggle done (stays in todo, not archived) ─────────────────────────────
const handleToggle = async (id: string) => {
  saving.value = true
  savingText.value = 'Menyelesaikan...'
  try {
    cancel(`task-deadline-${id}`)
    await markTaskDone(id)
  } catch (e) {
    showToast('Gagal menyelesaikan task')
  } finally {
    saving.value = false
  }
}

const handleUncheckDone = async (id: string) => {
  try {
    await markTaskUndone(id)
  } catch (e) {
    showToast('Gagal membatalkan selesai')
  }
}

const handleArchiveDone = async (task: any) => {
  saving.value = true
  savingText.value = 'Mengarsipkan...'
  try {
    await archiveAndRemoveDone(task)
    showToast('Task diarsipkan ke Backlog')
  } catch (e) {
    showToast('Gagal mengarsipkan task')
  } finally {
    saving.value = false
  }
}

const handleDeleteDone = async (id: string) => {
  try {
    await purgeDoneTask(id)
    showToast('Task dihapus')
  } catch (e) {
    showToast('Gagal menghapus task')
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
  } catch (e) {
    tasks.value = backup
    showToast('Gagal menghapus task')
  } finally {
    saving.value = false
  }
}

// ── Inline cell edit (table) ──────────────────────────────────────────────
const handleCellUpdate = async (taskId: string, updates: Record<string, any>) => {
  const idx = tasks.value.findIndex((t: any) => t.id === taskId)
  if (idx === -1) return
  const backup = { ...tasks.value[idx] }
  tasks.value[idx] = { ...tasks.value[idx], ...updates }
  try {
    await updateTask(taskId, updates)
  } catch (e) {
    tasks.value[idx] = backup
    showToast('Gagal menyimpan perubahan')
  }
}

// ── Save (edit or create) ────────────────────────────────────────────────
const handleTaskSave = async (data: { text: string; cat: string; date: string; pendingFiles: File[]; existingImages: string[]; removedImages: string[]; deadlineAt?: string | null; customFields?: Record<string, any> }) => {
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
        custom_fields: data.customFields || {},
      }
      if (finalImages.length > 0) updates.images = finalImages
      await updateTask(taskId, updates)

      const plainTextVal = (data.text || '').replace(/<[^>]*>/g, '').trim()
      if (data.deadlineAt) {
        await schedule(`task-deadline-${taskId}`, 'MindVault Deadline', plainTextVal.slice(0, 100) || 'Deadline task tiba', new Date(data.deadlineAt))
      } else if (!data.deadlineAt && oldDeadline) {
        cancel(`task-deadline-${taskId}`)
      }

      showToast('Task disimpan!')
    } catch (e) {
      showToast('Gagal menyimpan task')
    }
  } else {
    // ── Create new task ──
    savingText.value = 'Menambah task...'
    try {
      const task = await createTask({ text: data.text, cat: data.cat || null, date: data.date, custom_fields: data.customFields })
      if (task && data.pendingFiles.length) {
        savingText.value = 'Mengupload foto...'
        const urls = await uploadImages(task.id, data.pendingFiles)
        if (urls.length > 0) await updateTask(task.id, { images: urls })
      }
      if (task && data.deadlineAt) {
        await updateTask(task.id, { deadline_at: data.deadlineAt })
        const plainTextVal = (data.text || '').replace(/<[^>]*>/g, '').trim()
        await schedule(`task-deadline-${task.id}`, 'MindVault Deadline', plainTextVal.slice(0, 100) || 'Deadline task tiba', new Date(data.deadlineAt))
      }
      showToast('Task ditambahkan!')
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
    await Promise.all([fetchCategories(), fetchFields()])
    injectAllStyles()
    await rolloverTasks()
    await Promise.all([fetchAllPending(), fetchDoneTasks()])
  }
}, { immediate: true })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
