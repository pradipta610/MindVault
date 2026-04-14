<template>
  <div class="py-4 sm:py-6">
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">Links</h2>
      <div class="flex items-center gap-2">
        <button
          @click="showNewFolder = true"
          class="text-vault-muted hover:text-vault-accent text-xs px-3 py-2 border border-vault-border rounded-lg hover:bg-vault-card transition-colors"
        >
          + Folder
        </button>
        <button
          @click="showAddModal = true"
          class="bg-vault-accent text-vault-bg px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors"
        >
          + Add Link
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="relative mb-3 sm:mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="searchQuery"
        placeholder="Cari link..."
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
    <div v-else-if="allLinksEmpty" class="text-center py-16">
      <div class="text-4xl mb-3">🔗</div>
      <p class="text-vault-muted text-sm">
        {{ searchQuery ? 'Tidak ada link yang cocok' : 'Belum ada link. Tambah link pertamamu!' }}
      </p>
    </div>

    <!-- Folder sections + Uncategorized -->
    <div v-else class="space-y-5">

      <!-- Each folder -->
      <div
        v-for="folder in foldersWithLinks"
        :key="folder.id"
        @dragover.prevent="onDragOverFolder($event, folder.id)"
        @dragleave="onDragLeaveFolder(folder.id)"
        @drop.prevent="onDropFolder($event, folder.id)"
        :class="{ 'ring-2 ring-vault-accent/40 rounded-xl bg-vault-accent/5': dragOverFolderId === folder.id }"
        class="transition-all p-2 -m-2"
      >
        <div class="flex items-center gap-2 mb-2 group/folder">
          <button @click="toggleFolder(folder.id)" class="flex items-center gap-1.5 text-xs font-semibold text-vault-muted uppercase tracking-wider hover:text-vault-text transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 transition-transform" :class="{ '-rotate-90': collapsedFolders[folder.id] }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
            {{ folder.name }}
            <span class="text-vault-muted/50 font-normal normal-case">({{ folder.links.length }})</span>
          </button>
          <div class="flex items-center gap-1 opacity-0 group-hover/folder:opacity-100 transition-opacity">
            <button @click="startRenameFolder(folder)" class="p-1 rounded text-vault-muted hover:text-vault-accent transition-colors" title="Rename">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
            </button>
            <button @click="handleDeleteFolder(folder)" class="p-1 rounded text-vault-muted hover:text-red-400 transition-colors" title="Delete folder">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div v-if="!collapsedFolders[folder.id]" class="grid gap-3">
          <LinkCard
            v-for="link in folder.links"
            :key="link.id"
            :link="link"
            @refresh="handleRefresh(link.id)"
            @copy="handleCopy(link.url)"
            @delete="handleDelete(link)"
            @actions="openActions(link)"
          />
        </div>
        <div v-if="!collapsedFolders[folder.id] && folder.links.length === 0" class="text-xs text-vault-muted/50 py-3 text-center border border-dashed border-vault-border rounded-xl">
          Kosong
        </div>
      </div>

      <!-- Uncategorized -->
      <div
        v-if="uncategorizedLinks.length > 0"
        @dragover.prevent="onDragOverFolder($event, '__uncategorized')"
        @dragleave="onDragLeaveFolder('__uncategorized')"
        @drop.prevent="onDropFolder($event, '__uncategorized')"
        :class="{ 'ring-2 ring-vault-accent/40 rounded-xl bg-vault-accent/5': dragOverFolderId === '__uncategorized' }"
        class="transition-all p-2 -m-2"
      >
        <div class="flex items-center gap-2 mb-2">
          <button @click="toggleFolder('__uncategorized')" class="flex items-center gap-1.5 text-xs font-semibold text-vault-muted uppercase tracking-wider hover:text-vault-text transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 transition-transform" :class="{ '-rotate-90': collapsedFolders['__uncategorized'] }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            Uncategorized
            <span class="text-vault-muted/50 font-normal normal-case">({{ uncategorizedLinks.length }})</span>
          </button>
        </div>
        <div v-if="!collapsedFolders['__uncategorized']" class="grid gap-3">
          <LinkCard
            v-for="link in uncategorizedLinks"
            :key="link.id"
            :link="link"
            @refresh="handleRefresh(link.id)"
            @copy="handleCopy(link.url)"
            @delete="handleDelete(link)"
            @actions="openActions(link)"
          />
        </div>
      </div>
    </div>

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
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-vault-muted font-medium flex items-center gap-1.5 mb-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
                  Folder
                </label>
                <select v-model="newLinkFolderId" class="w-full bg-vault-bg border border-vault-border rounded-xl px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors">
                  <option :value="null">— Tidak ada —</option>
                  <option v-for="f in linkFolders" :key="f.id" :value="f.id">{{ f.name }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-vault-muted font-medium flex items-center gap-1.5 mb-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
                  Project
                </label>
                <select v-model="newLinkProjectId" class="w-full bg-vault-bg border border-vault-border rounded-xl px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors">
                  <option :value="null">— Tidak ada —</option>
                  <option v-for="p in projectList" :key="p.id" :value="p.id">{{ p.icon || '📁' }} {{ p.name }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="p-4 sm:p-5 border-t border-vault-border flex justify-end gap-2">
            <button
              @click="showAddModal = false"
              class="px-4 py-2 rounded-lg text-sm text-vault-muted hover:text-vault-text transition-colors"
            >
              Batal
            </button>
            <button
              @click="handleAdd"
              :disabled="!newUrl.trim() || saving"
              class="bg-vault-accent text-vault-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>

      <!-- New Folder Modal -->
      <div v-if="showNewFolder" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showNewFolder = false" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6">
          <h3 class="font-serif text-lg text-vault-text mb-4">New Folder</h3>
          <input
            ref="newFolderInput"
            v-model="newFolderName"
            placeholder="Nama folder"
            class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors mb-4"
            @keydown.enter="handleCreateFolder"
          />
          <div class="flex gap-3">
            <button @click="showNewFolder = false" class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors">Batal</button>
            <button @click="handleCreateFolder" :disabled="!newFolderName.trim()" class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30">Buat</button>
          </div>
        </div>
      </div>

      <!-- Rename Folder Modal -->
      <div v-if="showRenameFolder" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showRenameFolder = false" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6">
          <h3 class="font-serif text-lg text-vault-text mb-4">Rename Folder</h3>
          <input
            ref="renameFolderInput"
            v-model="renameFolderName"
            class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors mb-4"
            @keydown.enter="handleRenameFolder"
          />
          <div class="flex gap-3">
            <button @click="showRenameFolder = false" class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors">Batal</button>
            <button @click="handleRenameFolder" :disabled="!renameFolderName.trim()" class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30">Simpan</button>
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

    <!-- Mobile action sheet -->
    <ActionSheet
      v-if="showActions"
      :actions="linkActionItems"
      @close="showActions = false"
      @select="handleActionSelect"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const {
  links, folders: linkFolders, loading,
  fetchLinks, addLink, updateLink, deleteLink, refreshMetadata,
  fetchLinkFolders, createLinkFolder, renameLinkFolder, deleteLinkFolder,
} = useLinks()
const { projects: projectList, fetchProjects } = useProjects()
const { show: showToast } = useToast()

const searchQuery = ref('')
const showAddModal = ref(false)
const newUrl = ref('')
const newLinkProjectId = ref<string | null>(null)
const newLinkFolderId = ref<string | null>(null)
const saving = ref(false)
const savingText = ref('')
const urlInput = ref<HTMLInputElement | null>(null)

// Folders
const collapsedFolders = ref<Record<string, boolean>>({})
const showNewFolder = ref(false)
const newFolderName = ref('')
const newFolderInput = ref<HTMLInputElement | null>(null)
const showRenameFolder = ref(false)
const renameFolderName = ref('')
const renameFolderTarget = ref<any>(null)
const renameFolderInput = ref<HTMLInputElement | null>(null)

// Drag & drop
const dragOverFolderId = ref<string | null>(null)

// Mobile actions
const showActions = ref(false)
const actionTarget = ref<any>(null)

const linkActionItems = [
  { id: 'open', label: 'Buka Link', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>' },
  { id: 'copy', label: 'Copy URL', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>' },
  { id: 'refresh', label: 'Refresh Preview', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>' },
  { id: 'delete', label: 'Hapus Link', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>', destructive: true },
]

// ── Computed ─────────────────────────────────────────────────────────────

const filteredLinks = computed(() => {
  if (!searchQuery.value.trim()) return links.value
  const q = searchQuery.value.toLowerCase()
  return links.value.filter((l: any) =>
    (l.title || '').toLowerCase().includes(q) ||
    (l.url || '').toLowerCase().includes(q) ||
    (l.description || '').toLowerCase().includes(q)
  )
})

const foldersWithLinks = computed(() => {
  return linkFolders.value.map((f: any) => ({
    ...f,
    links: filteredLinks.value.filter((l: any) => l.folder_id === f.id),
  }))
})

const uncategorizedLinks = computed(() => filteredLinks.value.filter((l: any) => !l.folder_id))

const allLinksEmpty = computed(() => filteredLinks.value.length === 0)

const getDomain = (url: string) => {
  try { return new URL(url).hostname } catch { return url }
}

// ── Link actions ─────────────────────────────────────────────────────────

const handleAdd = async () => {
  let url = newUrl.value.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  saving.value = true
  savingText.value = 'Mengambil preview...'
  try {
    await addLink(url, newLinkProjectId.value, newLinkFolderId.value)
    newUrl.value = ''
    newLinkProjectId.value = null
    newLinkFolderId.value = null
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

// ── Folder actions ───────────────────────────────────────────────────────

const toggleFolder = (id: string) => {
  collapsedFolders.value[id] = !collapsedFolders.value[id]
}

const handleCreateFolder = async () => {
  if (!newFolderName.value.trim()) return
  await createLinkFolder(newFolderName.value.trim())
  newFolderName.value = ''
  showNewFolder.value = false
  showToast('Folder dibuat!')
}

const startRenameFolder = (folder: any) => {
  renameFolderTarget.value = folder
  renameFolderName.value = folder.name
  showRenameFolder.value = true
  nextTick(() => renameFolderInput.value?.focus())
}

const handleRenameFolder = async () => {
  if (!renameFolderName.value.trim() || !renameFolderTarget.value) return
  await renameLinkFolder(renameFolderTarget.value.id, renameFolderName.value.trim())
  showRenameFolder.value = false
  showToast('Folder direname!')
}

const handleDeleteFolder = async (folder: any) => {
  if (!confirm(`Hapus folder "${folder.name}"? Links di dalamnya akan jadi Uncategorized.`)) return
  await deleteLinkFolder(folder.id)
  showToast('Folder dihapus')
}

// ── Drag & Drop ──────────────────────────────────────────────────────────

const onDragOverFolder = (e: DragEvent, folderId: string) => {
  if (e.dataTransfer?.types.includes('application/x-link-id')) {
    dragOverFolderId.value = folderId
  }
}

const onDragLeaveFolder = (folderId: string) => {
  if (dragOverFolderId.value === folderId) dragOverFolderId.value = null
}

const onDropFolder = async (e: DragEvent, folderId: string) => {
  dragOverFolderId.value = null
  const linkId = e.dataTransfer?.getData('application/x-link-id')
  if (!linkId) return
  const targetFolderId = folderId === '__uncategorized' ? null : folderId
  try {
    await updateLink(linkId, { folder_id: targetFolderId })
    showToast('Link dipindahkan!')
  } catch {
    showToast('Gagal memindahkan link')
  }
}

// ── Mobile actions ───────────────────────────────────────────────────────

const openActions = (link: any) => {
  actionTarget.value = link
  showActions.value = true
}

const handleActionSelect = (id: string) => {
  showActions.value = false
  const link = actionTarget.value
  if (!link) return
  if (id === 'open') window.open(link.url, '_blank', 'noopener,noreferrer')
  else if (id === 'copy') handleCopy(link.url)
  else if (id === 'refresh') handleRefresh(link.id)
  else if (id === 'delete') handleDelete(link)
}

// ── Watchers ─────────────────────────────────────────────────────────────

watch(showAddModal, (v) => {
  if (v) {
    nextTick(() => urlInput.value?.focus())
    if (!projectList.value.length) fetchProjects()
  }
})

watch(showNewFolder, (v) => {
  if (v) nextTick(() => newFolderInput.value?.focus())
})

watch(user, (u) => {
  if (u) {
    fetchLinks()
    fetchLinkFolders()
  }
}, { immediate: true })
</script>
