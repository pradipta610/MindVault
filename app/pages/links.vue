<template>
  <FileExplorer
    ref="explorerRef"
    root-label="Links"
    new-item-label="+ Add Link"
    search-placeholder="Cari link..."
    empty-icon="🔗"
    empty-text="Belum ada link. Tambah link pertamamu!"
    item-type-label="Link"
    item-name-key="title"
    :folders="linkFolders"
    :items="links"
    :loading="loading"
    @create-folder="handleCreateFolder"
    @new-item="openAddModal"
    @open-item="openLink"
    @rename-folder="handleRenameFolder"
    @delete-folder="handleDeleteFolder"
    @move-item="handleMoveItem"
    @move-folder="handleMoveFolder"
  >
    <!-- Grid icon for links -->
    <template #item-icon="{ item }">
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-1.5 relative overflow-hidden">
        <img v-if="item.favicon" :src="item.favicon" class="w-6 h-6 rounded" @error="($event.target as HTMLImageElement).style.display = 'none'" />
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      </div>
    </template>

    <!-- List icon for links -->
    <template #list-icon="{ item }">
      <img v-if="item.favicon" :src="item.favicon" class="w-5 h-5 rounded shrink-0" @error="($event.target as HTMLImageElement).style.display = 'none'" />
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    </template>

    <!-- Context menu for link items -->
    <template #context-menu="{ item, close }">
      <button @click="close(); openLink(item)" class="w-full px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-bg transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
        Open
      </button>
      <button @click="close(); handleCopy(item.url)" class="w-full px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-bg transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>
        Copy URL
      </button>
      <button @click="close(); handleRefresh(item.id)" class="w-full px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-bg transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>
        Refresh
      </button>
      <button @click="close(); handleDelete(item)" class="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
        Delete
      </button>
    </template>
  </FileExplorer>

  <!-- Add Link Modal -->
  <Teleport to="body">
    <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="showAddModal = false">
      <div class="bg-vault-card border border-vault-border rounded-2xl w-full max-w-md shadow-xl">
        <div class="p-4 sm:p-5 border-b border-vault-border">
          <h3 class="font-serif text-lg text-vault-text">Tambah Link</h3>
        </div>
        <div class="p-4 sm:p-5 space-y-3">
          <input
            ref="urlInput"
            v-model="newUrl"
            placeholder="https://example.com"
            class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
            @keydown.enter="handleAdd"
          />
          <div>
            <label class="text-xs text-vault-muted font-medium mb-1.5 block">Project</label>
            <select v-model="newLinkProjectId" class="w-full bg-vault-bg border border-vault-border rounded-xl px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors">
              <option :value="null">— Tidak ada —</option>
              <option v-for="p in projectList" :key="p.id" :value="p.id">{{ p.icon || '📁' }} {{ p.name }}</option>
            </select>
          </div>
        </div>
        <div class="p-4 sm:p-5 border-t border-vault-border flex justify-end gap-2">
          <button @click="showAddModal = false" class="px-4 py-2 rounded-lg text-sm text-vault-muted hover:text-vault-text transition-colors">Batal</button>
          <button @click="handleAdd" :disabled="!newUrl.trim() || saving" class="bg-vault-accent text-vault-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-50">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
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
  links, folders: linkFolders, loading,
  fetchLinks, addLink, updateLink, deleteLink, refreshMetadata,
  fetchLinkFolders, createLinkFolder, updateLinkFolder, renameLinkFolder, deleteLinkFolder,
} = useLinks()
const { projects: projectList, fetchProjects } = useProjects()
const { show: showToast } = useToast()
const { register: registerSync } = useBackgroundSync()
registerSync(fetchLinks)

const explorerRef = ref<any>(null)
const saving = ref(false)
const savingText = ref('')

// Add link modal
const showAddModal = ref(false)
const newUrl = ref('')
const newLinkProjectId = ref<string | null>(null)
const urlInput = ref<HTMLInputElement | null>(null)

// ── Explorer event handlers ─────────────────────────────────────────────

const handleCreateFolder = async (name: string, parentId: string | null) => {
  await createLinkFolder(name, parentId)
  showToast('Folder dibuat!')
}

const handleRenameFolder = async (id: string, name: string) => {
  await renameLinkFolder(id, name)
  showToast('Folder direname!')
}

const handleDeleteFolder = async (id: string) => {
  await deleteLinkFolder(id)
  showToast('Folder dihapus')
}

const handleMoveItem = async (itemId: string, folderId: string | null) => {
  try {
    await updateLink(itemId, { folder_id: folderId })
    showToast('Link dipindahkan!')
  } catch { showToast('Gagal memindahkan link') }
}

const handleMoveFolder = async (folderId: string, parentId: string | null) => {
  try {
    await updateLinkFolder(folderId, { parent_id: parentId })
    showToast('Folder dipindahkan!')
  } catch { showToast('Gagal memindahkan folder') }
}

// ── Link actions ────────────────────────────────────────────────────────

const openAddModal = (folderId: string | null) => {
  showAddModal.value = true
}

const openLink = (link: any) => {
  window.open(link.url, '_blank', 'noopener,noreferrer')
}

const handleAdd = async () => {
  let url = newUrl.value.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  saving.value = true
  savingText.value = 'Mengambil preview...'
  try {
    const currentFolderId = explorerRef.value?.currentFolderId ?? null
    await addLink(url, newLinkProjectId.value, currentFolderId)
    newUrl.value = ''
    newLinkProjectId.value = null
    showAddModal.value = false
    showToast('Link disimpan!')
  } catch (e) {
    showToast('Gagal menyimpan link')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (link: any) => {
  if (!confirm('Hapus link ini?')) return
  saving.value = true
  savingText.value = 'Menghapus...'
  try {
    await deleteLink(link.id)
    showToast('Link dihapus')
  } catch (e) {
    showToast('Gagal menghapus link')
  } finally {
    saving.value = false
  }
}

const handleRefresh = async (id: string) => {
  saving.value = true
  savingText.value = 'Refreshing preview...'
  try {
    await refreshMetadata(id)
    showToast('Preview diperbarui!')
  } catch (e) {
    showToast('Gagal memperbarui preview')
  } finally {
    saving.value = false
  }
}

const handleCopy = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    showToast('URL disalin!')
  } catch {
    showToast('Gagal menyalin URL')
  }
}

// ── Watchers ────────────────────────────────────────────────────────────

watch(showAddModal, (v) => {
  if (v) {
    nextTick(() => urlInput.value?.focus())
    if (!projectList.value.length) fetchProjects()
  }
})

watch(user, (u) => {
  if (u) {
    fetchLinks()
    fetchLinkFolders()
  }
}, { immediate: true })
</script>
