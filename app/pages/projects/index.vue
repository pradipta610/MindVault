<template>
  <div class="py-4 sm:py-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h1 class="font-serif text-2xl sm:text-3xl text-vault-text">Projects</h1>
      <button
        @click="openNew"
        class="bg-vault-accent text-vault-bg px-3 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors"
      >
        + New
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-6">
      <button
        @click="filter = 'active'"
        class="px-4 py-1.5 rounded-full text-xs font-medium border transition-colors"
        :class="filter === 'active'
          ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        Active
      </button>
      <button
        @click="filter = 'done'"
        class="px-4 py-1.5 rounded-full text-xs font-medium border transition-colors"
        :class="filter === 'done'
          ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
      >
        Selesai
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredProjects.length === 0" class="text-center py-16">
      <div class="text-5xl mb-4">📁</div>
      <p class="text-vault-muted text-sm">
        {{ filter === 'done' ? 'Belum ada project yang selesai' : 'Belum ada project aktif. Buat yang pertama!' }}
      </p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ProjectCard v-for="p in filteredProjects" :key="p.id" :project="p" />
    </div>

  </div>

  <!-- New Project Modal -->
  <Teleport to="body">
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showModal = false" />
      <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6">

        <h2 class="font-serif text-xl text-vault-text mb-5">Project Baru</h2>

        <label class="block text-xs text-vault-muted mb-2">Icon</label>
        <div class="flex flex-wrap gap-2 mb-5">
          <button
            v-for="e in emojiOptions"
            :key="e"
            @click="newIcon = e"
            class="w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all"
            :class="newIcon === e ? 'border-vault-accent scale-110 bg-vault-accent/10' : 'border-transparent hover:bg-vault-bg hover:scale-105'"
          >
            {{ e }}
          </button>
        </div>

        <label class="block text-xs text-vault-muted mb-1.5">Nama Project</label>
        <input
          ref="nameInput"
          v-model="newName"
          placeholder="Contoh: Website Baru, Skripsi..."
          class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 mb-5 transition-colors"
          @keydown.enter="saveNew"
          @keydown.esc="showModal = false"
        />

        <label class="block text-xs text-vault-muted mb-2.5">Warna</label>
        <div class="flex gap-3 flex-wrap mb-6">
          <button
            v-for="c in colorOptions"
            :key="c"
            @click="newColor = c"
            class="w-8 h-8 rounded-full border-[3px] transition-all"
            :class="newColor === c ? 'scale-125 border-white/70' : 'border-transparent hover:scale-110'"
            :style="{ backgroundColor: c }"
          />
        </div>

        <div class="flex gap-3">
          <button
            @click="showModal = false"
            class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors"
          >
            Batal
          </button>
          <button
            @click="saveNew"
            :disabled="!newName.trim() || saving"
            class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
          >
            Buat
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { projects, loading, fetchProjects, createProject } = useProjects()
const { show: showToast } = useToast()

const filter = ref<'active' | 'done'>('active')
const showModal = ref(false)
const newName = ref('')
const newColor = ref('#6366f1')
const newIcon = ref('📁')
const saving = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

const colorOptions = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#f43f5e', '#8b5cf6', '#f97316', '#14b8a6',
]

const filteredProjects = computed(() =>
  projects.value.filter((p: any) => p.status === filter.value)
)

const emojiOptions = ['📁', '🚀', '💻', '🎨', '📚', '🎯', '💡', '🔧', '🌟', '🌱', '🏠', '🎵', '📷', '📝', '🧠', '❤️']

const openNew = () => {
  newName.value = ''
  newColor.value = '#6366f1'
  newIcon.value = '📁'
  showModal.value = true
  nextTick(() => nameInput.value?.focus())
}

const saveNew = async () => {
  if (!newName.value.trim() || saving.value) return
  saving.value = true
  try {
    await createProject({ name: newName.value.trim(), color: newColor.value, icon: newIcon.value })
    showModal.value = false
    showToast('Project dibuat!')
  } catch {
    showToast('Gagal membuat project')
  } finally {
    saving.value = false
  }
}

watch(user, (u) => {
  if (u) fetchProjects()
}, { immediate: true })
</script>
