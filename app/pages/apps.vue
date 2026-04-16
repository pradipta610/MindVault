<template>
  <FileExplorer
    ref="explorerRef"
    root-label="Apps"
    new-item-label="+ New App"
    search-placeholder="Cari apps..."
    empty-icon="⚡"
    empty-text="Belum ada app. Buat app pertamamu!"
    item-type-label="App"
    :folders="appFolders"
    :items="apps"
    :loading="loading"
    @create-folder="handleCreateFolder"
    @new-item="openEditor(null, $event)"
    @open-item="openRunner"
    @rename-folder="handleRenameFolder"
    @delete-folder="handleDeleteFolder"
    @move-item="handleMoveItem"
    @move-folder="handleMoveFolder"
  >
    <!-- Grid icon for apps -->
    <template #item-icon="{ item }">
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-vault-accent/10 flex items-center justify-center mb-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
        <span v-if="item.share_token" class="absolute -top-0.5 -right-0.5 text-[10px]">🔗</span>
      </div>
    </template>

    <!-- List icon for apps -->
    <template #list-icon="{ item }">
      <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      </div>
    </template>

    <!-- Context menu for app items -->
    <template #context-menu="{ item, close }">
      <button @click="close(); openRunner(item)" class="w-full px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-bg transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
        Run
      </button>
      <button @click="close(); openEditor(item)" class="w-full px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-bg transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
        Edit
      </button>
      <button @click="close(); openShareModal(item)" class="w-full px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-bg transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" /></svg>
        Share
      </button>
      <button @click="close(); handleDelete(item)" class="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
        Delete
      </button>
    </template>
  </FileExplorer>

  <!-- Editor Modal -->
  <Teleport to="body">
    <div v-if="showEditor" class="fixed inset-0 z-[100] flex flex-col bg-vault-bg">
      <div class="flex items-center justify-between px-4 h-14 border-b border-vault-border shrink-0">
        <button @click="showEditor = false" class="text-vault-muted hover:text-vault-text transition-colors text-sm">Batal</button>
        <h3 class="font-serif text-lg text-vault-text">{{ editingApp ? 'Edit App' : 'New App' }}</h3>
        <button @click="handleSave" :disabled="!editorName.trim() || !editorHtml.trim() || saving" class="text-vault-accent font-semibold text-sm disabled:opacity-50">
          {{ saving ? 'Saving...' : 'Simpan' }}
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <input v-model="editorName" placeholder="Nama app" class="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors" />
        <input v-model="editorDesc" placeholder="Deskripsi (opsional)" class="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors" />
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-vault-muted font-medium mb-1.5 block">Project</label>
            <select v-model="editorProjectId" class="w-full bg-vault-card border border-vault-border rounded-xl px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors">
              <option :value="null">— Tidak ada —</option>
              <option v-for="p in projectList" :key="p.id" :value="p.id">{{ p.icon || '📁' }} {{ p.name }}</option>
            </select>
          </div>
        </div>
        <textarea v-model="editorHtml" placeholder="Paste HTML code di sini..." class="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors font-mono resize-none" style="min-height: calc(100vh - 340px)" />
      </div>
    </div>

    <!-- Fullscreen runner -->
    <div v-if="showRunner" class="fixed inset-0 z-[100] flex flex-col bg-vault-bg">
      <div class="flex items-center justify-between px-4 h-12 border-b border-vault-border shrink-0 bg-vault-bg/95 backdrop-blur-sm">
        <h3 class="text-sm font-semibold text-vault-text truncate mr-4">{{ runnerApp?.name }}</h3>
        <button @click="showRunner = false" class="text-vault-muted hover:text-vault-text transition-colors p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <iframe v-if="runnerApp" :srcdoc="runnerApp.html" class="flex-1 w-full border-0 bg-white" sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups" />
    </div>

    <!-- Share Modal -->
    <div v-if="showShareModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showShareModal = false" />
      <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6">
        <h3 class="font-serif text-lg text-vault-text mb-4">Share "{{ shareTarget?.name }}"</h3>
        <div v-if="shareTarget?.share_token" class="space-y-3">
          <div class="flex items-center gap-2">
            <input :value="shareUrl" readonly class="flex-1 bg-vault-bg border border-vault-border rounded-lg px-3 py-2.5 text-sm text-vault-text font-mono truncate" @click="($event.target as HTMLInputElement)?.select()" />
            <button @click="copyShareUrl" class="bg-vault-accent text-vault-bg px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors shrink-0">Copy</button>
          </div>
          <p class="text-[11px] text-vault-muted">Siapapun dengan link ini bisa melihat & menjalankan app.</p>
          <button @click="handleRevokeShare" class="w-full py-2.5 text-sm text-red-400 border border-red-400/20 rounded-xl hover:bg-red-500/10 transition-colors">Revoke Link</button>
        </div>
        <div v-else class="space-y-3">
          <p class="text-sm text-vault-muted">Buat share link agar orang lain bisa melihat & menjalankan app ini (read-only).</p>
          <button @click="handleCreateShare" :disabled="shareLoading" class="w-full py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-50">
            {{ shareLoading ? 'Generating...' : 'Generate Share Link' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Saving overlay -->
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
const {
  apps, folders: appFolders, loading,
  fetchApps, createApp, updateApp, deleteApp,
  fetchFolders, createFolder, updateFolder, renameFolder, deleteFolder,
  createShareLink, revokeShareLink,
} = useApps()
const { projects: projectList, fetchProjects } = useProjects()
const { show: showToast } = useToast()

const explorerRef = ref<any>(null)
const saving = ref(false)
const savingText = ref('')

// Editor state
const showEditor = ref(false)
const editingApp = ref<any>(null)
const editorName = ref('')
const editorDesc = ref('')
const editorHtml = ref('')
const editorProjectId = ref<string | null>(null)

// Runner state
const showRunner = ref(false)
const runnerApp = ref<any>(null)

// Share
const showShareModal = ref(false)
const shareTarget = ref<any>(null)
const shareLoading = ref(false)

const shareUrl = computed(() => {
  if (!shareTarget.value?.share_token) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/share/${shareTarget.value.share_token}`
})

// ── Explorer event handlers ─────────────────────────────────────────────

const handleCreateFolder = async (name: string, parentId: string | null) => {
  await createFolder(name, parentId)
  showToast('Folder dibuat!')
}

const handleRenameFolder = async (id: string, name: string) => {
  await renameFolder(id, name)
  showToast('Folder direname!')
}

const handleDeleteFolder = async (id: string) => {
  await deleteFolder(id)
  showToast('Folder dihapus')
}

const handleMoveItem = async (itemId: string, folderId: string | null) => {
  try {
    await updateApp(itemId, { folder_id: folderId })
    showToast('App dipindahkan!')
  } catch { showToast('Gagal memindahkan app') }
}

const handleMoveFolder = async (folderId: string, parentId: string | null) => {
  try {
    await updateFolder(folderId, { parent_id: parentId })
    showToast('Folder dipindahkan!')
  } catch { showToast('Gagal memindahkan folder') }
}

// ── Editor ──────────────────────────────────────────────────────────────

const openEditor = (app: any, folderId?: string | null) => {
  editingApp.value = app
  editorName.value = app?.name || ''
  editorDesc.value = app?.description || ''
  editorHtml.value = app?.html || ''
  editorProjectId.value = app?.project_id || null
  showEditor.value = true
  if (!projectList.value.length) fetchProjects()
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
    const currentFolderId = explorerRef.value?.currentFolderId ?? null
    if (editingApp.value) {
      await updateApp(editingApp.value.id, {
        name: editorName.value.trim(),
        description: editorDesc.value.trim() || undefined,
        html: editorHtml.value,
        project_id: editorProjectId.value,
      })
      showToast('App diperbarui!')
    } else {
      await createApp({
        name: editorName.value.trim(),
        description: editorDesc.value.trim() || undefined,
        html: editorHtml.value,
        project_id: editorProjectId.value,
        folder_id: currentFolderId,
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

// ── Share ────────────────────────────────────────────────────────────────

const openShareModal = (app: any) => {
  shareTarget.value = app
  showShareModal.value = true
}

const handleCreateShare = async () => {
  if (!shareTarget.value) return
  shareLoading.value = true
  try {
    const token = await createShareLink(shareTarget.value.id)
    if (token) {
      shareTarget.value = { ...shareTarget.value, share_token: token }
      showToast('Share link dibuat!')
    }
  } finally { shareLoading.value = false }
}

const handleRevokeShare = async () => {
  if (!shareTarget.value || !confirm('Revoke share link?')) return
  shareLoading.value = true
  try {
    await revokeShareLink(shareTarget.value.id)
    shareTarget.value = { ...shareTarget.value, share_token: null }
    showToast('Share link di-revoke')
  } finally { shareLoading.value = false }
}

const copyShareUrl = () => {
  navigator.clipboard.writeText(shareUrl.value)
  showToast('Link di-copy!')
}

// ── Init ────────────────────────────────────────────────────────────────

watch(user, (u) => {
  if (u) {
    fetchApps()
    fetchFolders()
  }
}, { immediate: true })
</script>
