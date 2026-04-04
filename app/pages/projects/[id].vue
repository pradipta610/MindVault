<template>
  <div class="px-4 py-6 max-w-4xl mx-auto w-full pb-12">

    <!-- Loading project -->
    <div v-if="projectLoading" class="flex justify-center py-16">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else-if="project">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <NuxtLink
            to="/projects"
            class="mt-1 w-8 h-8 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </NuxtLink>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <div class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: project.color }" />
              <!-- Editable name -->
              <input
                v-if="editingName"
                v-model="editNameValue"
                ref="nameEditInput"
                class="flex-1 font-serif text-2xl text-vault-text bg-transparent border-b border-vault-accent/40 focus:outline-none"
                @keydown.enter="saveNameEdit"
                @keydown.esc="cancelNameEdit"
                @blur="saveNameEdit"
              />
              <h1
                v-else
                class="font-serif text-2xl text-vault-text cursor-pointer hover:text-vault-accent/80 transition-colors truncate"
                @click="startNameEdit"
              >
                {{ project.name }}
              </h1>
            </div>
            <span
              v-if="project.status === 'done'"
              class="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full ml-5"
            >
              Selesai
            </span>
          </div>
        </div>

        <!-- Desktop actions -->
        <div class="hidden sm:flex items-center gap-2 shrink-0 ml-3">
          <button
            v-if="project.status === 'active'"
            @click="markDone"
            class="text-xs px-3 py-1.5 border border-green-400/30 text-green-400 rounded-lg hover:bg-green-400/10 transition-colors"
          >
            Tandai Selesai
          </button>
          <button
            v-else
            @click="markActive"
            class="text-xs px-3 py-1.5 border border-vault-border text-vault-muted rounded-lg hover:bg-vault-card transition-colors"
          >
            Aktifkan Lagi
          </button>
          <button
            @click="confirmDelete"
            class="text-xs px-3 py-1.5 border border-red-400/30 text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            Hapus
          </button>
        </div>

        <!-- Mobile action button -->
        <button
          @click="showMenu = true"
          class="sm:hidden w-10 h-10 flex items-center justify-center text-vault-muted hover:text-vault-text transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </button>
      </div>

      <!-- Progress Card -->
      <div
        v-if="tasks.length > 0"
        class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 mb-6"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-vault-muted">Progress</span>
          <span class="text-xs font-semibold" :style="{ color: project.color }">
            {{ doneTasks }}/{{ tasks.length }} tasks selesai
          </span>
        </div>
        <div class="h-2 bg-vault-border rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: progressPct + '%', backgroundColor: project.color }"
          />
        </div>
      </div>

      <!-- ── Tasks Section ─────────────────────────────────────────────── -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-vault-muted uppercase tracking-wider">Tasks</h2>
          <span class="text-[10px] text-vault-muted">{{ doneTasks }}/{{ tasks.length }}</span>
        </div>

        <div v-if="tasksLoading" class="flex justify-center py-6">
          <div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else class="space-y-2 mb-3">
          <div v-if="tasks.length === 0" class="text-sm text-vault-muted text-center py-4">
            Belum ada tasks. Tambah di bawah!
          </div>

          <div
            v-for="task in tasks"
            :key="task.id"
            class="flex items-center gap-3 bg-vault-card border border-vault-border rounded-xl px-4 py-3 group"
            :class="{ 'opacity-60': task.done }"
          >
            <!-- Checkbox -->
            <button
              @click="toggleTask(task)"
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="task.done
                ? 'bg-vault-accent border-vault-accent'
                : 'border-vault-muted hover:border-vault-accent'"
            >
              <svg v-if="task.done" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </button>

            <span
              class="flex-1 text-sm text-vault-text"
              :class="{ 'line-through text-vault-muted': task.done }"
            >
              {{ task.text }}
            </span>

            <!-- Delete -->
            <button
              @click="removeTask(task.id)"
              class="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all w-8 h-8 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Quick add task -->
        <form @submit.prevent="addTask" class="flex gap-2">
          <input
            v-model="newTaskText"
            placeholder="Tambah task baru..."
            class="flex-1 bg-vault-card border border-vault-border rounded-xl px-4 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
          <button
            type="submit"
            :disabled="!newTaskText.trim()"
            class="bg-vault-accent text-vault-bg px-4 rounded-xl font-semibold text-sm hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
          >
            +
          </button>
        </form>
      </div>

      <!-- ── Notes Section ─────────────────────────────────────────────── -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-vault-muted uppercase tracking-wider">Notes</h2>
          <button
            @click="openNote(null)"
            class="text-xs text-vault-accent hover:text-vault-accent-dim transition-colors font-medium"
          >
            + Tambah
          </button>
        </div>

        <div v-if="notesLoading" class="flex justify-center py-6">
          <div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else-if="notes.length === 0" class="text-sm text-vault-muted text-center py-6">
          Belum ada notes untuk project ini.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="note in notes"
            :key="note.id"
            @click="openNote(note)"
            class="bg-vault-card border border-vault-border rounded-xl p-4 cursor-pointer hover:border-vault-accent/20 group transition-colors"
          >
            <p class="text-sm text-vault-text line-clamp-4 whitespace-pre-line leading-relaxed">{{ note.raw }}</p>
            <div class="flex items-center justify-between mt-3">
              <span class="text-[10px] text-vault-muted">{{ formatDate(note.created_at) }}</span>
              <button
                @click.stop="removeNote(note.id)"
                class="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all text-[10px]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Project not found -->
    <div v-else class="text-center py-16">
      <p class="text-vault-muted mb-4">Project tidak ditemukan.</p>
      <NuxtLink to="/projects" class="text-vault-accent text-sm hover:underline">Kembali ke Projects</NuxtLink>
    </div>

    <!-- Mobile action sheet -->
    <ActionSheet
      v-if="showMenu"
      :actions="menuActions"
      @close="showMenu = false"
      @select="handleMenu"
    />

    <!-- Note Modal -->
    <Teleport to="body">
      <div v-if="showNoteModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeNoteModal" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col max-h-[80vh]">
          <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-vault-border shrink-0">
            <h2 class="font-serif text-lg text-vault-text">{{ editingNote ? 'Edit Note' : 'Note Baru' }}</h2>
            <button @click="closeNoteModal" class="text-vault-muted hover:text-vault-text transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <textarea
              v-model="noteText"
              ref="noteTextarea"
              placeholder="Tulis note untuk project ini..."
              class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 resize-none transition-colors"
              rows="8"
            />
          </div>
          <div class="flex gap-3 px-6 pb-6 shrink-0">
            <button
              @click="closeNoteModal"
              class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors"
            >
              Batal
            </button>
            <button
              @click="saveNote"
              :disabled="!noteText.trim() || noteSaving"
              class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      <!-- Saving overlay -->
      <div v-if="saving" class="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="w-8 h-8 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })

const route = useRoute()
const router = useRouter()
const { show: showToast } = useToast()
const {
  fetchProject, updateProject, deleteProject,
  fetchProjectTasks, createProjectTask, toggleProjectTask, deleteProjectTask,
  fetchProjectNotes, createProjectNote, updateProjectNote, deleteProjectNote,
} = useProjects()

const projectId = route.params.id as string

// ── Project ────────────────────────────────────────────────────────────────
const project = ref<any>(null)
const projectLoading = ref(true)
const saving = ref(false)

// Inline name editing
const editingName = ref(false)
const editNameValue = ref('')
const nameEditInput = ref<HTMLInputElement | null>(null)

const startNameEdit = () => {
  editNameValue.value = project.value?.name || ''
  editingName.value = true
  nextTick(() => nameEditInput.value?.focus())
}

const saveNameEdit = async () => {
  if (!editNameValue.value.trim() || editNameValue.value === project.value?.name) {
    editingName.value = false
    return
  }
  await updateProject(projectId, { name: editNameValue.value.trim() })
  project.value = { ...project.value, name: editNameValue.value.trim() }
  editingName.value = false
}

const cancelNameEdit = () => {
  editingName.value = false
}

const markDone = async () => {
  saving.value = true
  try {
    await updateProject(projectId, { status: 'done' })
    project.value = { ...project.value, status: 'done' }
    showToast('Project ditandai selesai!')
  } finally {
    saving.value = false
  }
}

const markActive = async () => {
  saving.value = true
  try {
    await updateProject(projectId, { status: 'active' })
    project.value = { ...project.value, status: 'active' }
    showToast('Project diaktifkan kembali!')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!confirm(`Hapus project "${project.value?.name}"? Semua tasks dan notes akan ikut terhapus.`)) return
  saving.value = true
  try {
    await deleteProject(projectId)
    showToast('Project dihapus')
    router.push('/projects')
  } finally {
    saving.value = false
  }
}

// ── Mobile menu ────────────────────────────────────────────────────────────
const showMenu = ref(false)

const menuActions = computed(() => [
  project.value?.status === 'active'
    ? { id: 'done', label: 'Tandai Selesai', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>' }
    : { id: 'active', label: 'Aktifkan Lagi', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>' },
  { id: 'delete', label: 'Hapus Project', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>', destructive: true },
])

const handleMenu = (id: string) => {
  if (id === 'done') markDone()
  else if (id === 'active') markActive()
  else if (id === 'delete') confirmDelete()
}

// ── Tasks ──────────────────────────────────────────────────────────────────
const tasks = ref<any[]>([])
const tasksLoading = ref(false)
const newTaskText = ref('')

const doneTasks = computed(() => tasks.value.filter(t => t.done).length)
const progressPct = computed(() => {
  if (!tasks.value.length) return 0
  return Math.round((doneTasks.value / tasks.value.length) * 100)
})

const loadTasks = async () => {
  tasksLoading.value = true
  tasks.value = await fetchProjectTasks(projectId)
  tasksLoading.value = false
}

const addTask = async () => {
  if (!newTaskText.value.trim()) return
  const text = newTaskText.value.trim()
  newTaskText.value = ''
  const task = await createProjectTask(projectId, text)
  if (task) tasks.value.push(task)
}

const toggleTask = async (task: any) => {
  const updated = await toggleProjectTask(task.id, !task.done)
  if (updated) {
    const idx = tasks.value.findIndex(t => t.id === task.id)
    if (idx !== -1) tasks.value[idx] = { ...tasks.value[idx], done: updated.done }
  }
}

const removeTask = async (taskId: string) => {
  tasks.value = tasks.value.filter(t => t.id !== taskId)
  await deleteProjectTask(taskId)
}

// ── Notes ──────────────────────────────────────────────────────────────────
const notes = ref<any[]>([])
const notesLoading = ref(false)
const showNoteModal = ref(false)
const editingNote = ref<any>(null)
const noteText = ref('')
const noteSaving = ref(false)
const noteTextarea = ref<HTMLTextAreaElement | null>(null)

const loadNotes = async () => {
  notesLoading.value = true
  notes.value = await fetchProjectNotes(projectId)
  notesLoading.value = false
}

const openNote = (note: any | null) => {
  editingNote.value = note
  noteText.value = note?.raw || ''
  showNoteModal.value = true
  nextTick(() => noteTextarea.value?.focus())
}

const closeNoteModal = () => {
  showNoteModal.value = false
  editingNote.value = null
  noteText.value = ''
}

const saveNote = async () => {
  if (!noteText.value.trim() || noteSaving.value) return
  noteSaving.value = true
  try {
    if (editingNote.value) {
      const updated = await updateProjectNote(editingNote.value.id, noteText.value.trim())
      if (updated) {
        const idx = notes.value.findIndex(n => n.id === editingNote.value.id)
        if (idx !== -1) notes.value[idx] = { ...notes.value[idx], raw: updated.raw }
      }
      showToast('Note disimpan!')
    } else {
      const created = await createProjectNote(projectId, noteText.value.trim())
      if (created) notes.value.unshift(created)
      showToast('Note ditambahkan!')
    }
    closeNoteModal()
  } finally {
    noteSaving.value = false
  }
}

const removeNote = async (noteId: string) => {
  notes.value = notes.value.filter(n => n.id !== noteId)
  await deleteProjectNote(noteId)
  showToast('Note dihapus')
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  projectLoading.value = true
  project.value = await fetchProject(projectId)
  projectLoading.value = false
  if (!project.value) return
  await Promise.all([loadTasks(), loadNotes()])
})
</script>
