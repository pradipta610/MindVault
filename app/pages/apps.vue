<template>
  <div class="py-4 sm:py-6">
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">Apps</h2>
      <button
        @click="openEditor(null)"
        class="bg-vault-accent text-vault-bg px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors"
      >
        + New App
      </button>
    </div>

    <!-- Search -->
    <div class="relative mb-3 sm:mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="searchQuery"
        placeholder="Cari apps..."
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

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredApps.length === 0" class="text-center py-16">
      <div class="text-4xl mb-3">⚡</div>
      <p class="text-vault-muted text-sm">
        {{ searchQuery ? 'Tidak ada app yang cocok' : 'Belum ada app. Buat app pertamamu!' }}
      </p>
    </div>

    <!-- App cards -->
    <div v-else class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="app in filteredApps"
        :key="app.id"
        class="group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/20 transition-colors cursor-pointer"
        @click="openRunner(app)"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-vault-accent/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-vault-text truncate">{{ app.name }}</h3>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" @click.stop>
            <button
              @click="openEditor(app)"
              class="p-1.5 rounded-lg hover:bg-vault-bg text-vault-muted hover:text-vault-accent transition-colors"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
              </svg>
            </button>
            <button
              @click="handleDelete(app)"
              class="p-1.5 rounded-lg hover:bg-red-500/10 text-vault-muted hover:text-red-400 transition-colors"
              title="Hapus"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
          <!-- Mobile action trigger -->
          <button
            @click.stop="openActions(app)"
            class="sm:hidden p-1.5 rounded-lg text-vault-muted hover:text-vault-text transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </button>
        </div>
        <p v-if="app.description" class="text-xs text-vault-muted leading-relaxed line-clamp-2 mb-2">
          {{ app.description }}
        </p>
        <p class="text-[11px] text-vault-muted/50">
          {{ new Date(app.updated_at || app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
        </p>
      </div>
    </div>

    <!-- Editor Modal -->
    <Teleport to="body">
      <div v-if="showEditor" class="fixed inset-0 z-[100] flex flex-col bg-vault-bg">
        <!-- Editor header -->
        <div class="flex items-center justify-between px-4 h-14 border-b border-vault-border shrink-0">
          <button @click="showEditor = false" class="text-vault-muted hover:text-vault-text transition-colors text-sm">
            Batal
          </button>
          <h3 class="font-serif text-lg text-vault-text">{{ editingApp ? 'Edit App' : 'New App' }}</h3>
          <button
            @click="handleSave"
            :disabled="!editorName.trim() || !editorHtml.trim() || saving"
            class="text-vault-accent font-semibold text-sm disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Simpan' }}
          </button>
        </div>

        <!-- Editor body -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <input
            v-model="editorName"
            placeholder="Nama app"
            class="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
          <input
            v-model="editorDesc"
            placeholder="Deskripsi (opsional)"
            class="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
          <textarea
            v-model="editorHtml"
            placeholder="Paste HTML code di sini..."
            class="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors font-mono resize-none"
            style="min-height: calc(100vh - 280px)"
          />
        </div>
      </div>

      <!-- Fullscreen runner -->
      <div v-if="showRunner" class="fixed inset-0 z-[100] flex flex-col bg-vault-bg">
        <div class="flex items-center justify-between px-4 h-12 border-b border-vault-border shrink-0 bg-vault-bg/95 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-vault-text truncate mr-4">{{ runnerApp?.name }}</h3>
          <button
            @click="showRunner = false"
            class="text-vault-muted hover:text-vault-text transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <iframe
          v-if="runnerApp"
          :srcdoc="runnerApp.html"
          class="flex-1 w-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
        />
      </div>

      <!-- Saving overlay -->
      <div v-if="saving" class="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-3 border-vault-accent border-t-transparent rounded-full animate-spin" />
          <p class="text-sm text-vault-text font-medium">{{ savingText }}</p>
        </div>
      </div>
    </Teleport>

    <!-- Mobile action sheet -->
    <ActionSheet
      v-if="showActions"
      :actions="appActionItems"
      @close="showActions = false"
      @select="handleActionSelect"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { apps, loading, fetchApps, createApp, updateApp, deleteApp } = useApps()
const { show: showToast } = useToast()

const searchQuery = ref('')
const saving = ref(false)
const savingText = ref('')

// Editor state
const showEditor = ref(false)
const editingApp = ref<any>(null)
const editorName = ref('')
const editorDesc = ref('')
const editorHtml = ref('')

// Runner state
const showRunner = ref(false)
const runnerApp = ref<any>(null)

// Mobile actions
const showActions = ref(false)
const actionTarget = ref<any>(null)

const appActionItems = [
  { id: 'run', label: 'Jalankan App', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>' },
  { id: 'edit', label: 'Edit App', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>' },
  { id: 'delete', label: 'Hapus App', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>', destructive: true },
]

const filteredApps = computed(() => {
  if (!searchQuery.value.trim()) return apps.value
  const q = searchQuery.value.toLowerCase()
  return apps.value.filter((a: any) =>
    (a.name || '').toLowerCase().includes(q) ||
    (a.description || '').toLowerCase().includes(q)
  )
})

const openEditor = (app: any) => {
  editingApp.value = app
  editorName.value = app?.name || ''
  editorDesc.value = app?.description || ''
  editorHtml.value = app?.html || ''
  showEditor.value = true
}

const openRunner = (app: any) => {
  runnerApp.value = app
  showRunner.value = true
}

const handleSave = async () => {
  if (!editorName.value.trim() || !editorHtml.value.trim()) return
  saving.value = true
  savingText.value = 'Menyimpan...'
  try {
    if (editingApp.value) {
      await updateApp(editingApp.value.id, {
        name: editorName.value.trim(),
        description: editorDesc.value.trim() || undefined,
        html: editorHtml.value,
      })
      showToast('App diperbarui!')
    } else {
      await createApp({
        name: editorName.value.trim(),
        description: editorDesc.value.trim() || undefined,
        html: editorHtml.value,
      })
      showToast('App disimpan!')
    }
    showEditor.value = false
  } catch (e) {
    showToast('Gagal menyimpan app')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (app: any) => {
  if (!confirm(`Hapus "${app.name}"?`)) return
  saving.value = true
  savingText.value = 'Menghapus...'
  try {
    await deleteApp(app.id)
    showToast('App dihapus')
  } catch (e) {
    showToast('Gagal menghapus app')
  } finally {
    saving.value = false
  }
}

const openActions = (app: any) => {
  actionTarget.value = app
  showActions.value = true
}

const handleActionSelect = (id: string) => {
  showActions.value = false
  const app = actionTarget.value
  if (!app) return
  if (id === 'run') openRunner(app)
  else if (id === 'edit') openEditor(app)
  else if (id === 'delete') handleDelete(app)
}

watch(user, (u) => {
  if (u) fetchApps()
}, { immediate: true })
</script>
