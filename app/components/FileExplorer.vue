<template>
  <div class="py-4 sm:py-6">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 mb-3 sm:mb-4">
      <!-- Back / Forward -->
      <button
        @click="goBack"
        :disabled="!canGoBack"
        class="p-1.5 rounded-lg text-vault-muted transition-colors"
        :class="canGoBack ? 'hover:text-vault-text hover:bg-vault-card' : 'opacity-30 cursor-not-allowed'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
      </button>
      <button
        @click="goForward"
        :disabled="!canGoForward"
        class="p-1.5 rounded-lg text-vault-muted transition-colors"
        :class="canGoForward ? 'hover:text-vault-text hover:bg-vault-card' : 'opacity-30 cursor-not-allowed'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
      </button>

      <!-- Breadcrumb -->
      <div class="flex items-center gap-1 min-w-0 flex-1 text-sm">
        <button @click="navigateTo(null)" class="text-vault-muted hover:text-vault-accent transition-colors shrink-0 font-medium">
          {{ rootLabel }}
        </button>
        <template v-for="(crumb, i) in breadcrumbs" :key="crumb.id">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-muted/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          <button
            @click="navigateTo(crumb.id)"
            class="truncate transition-colors font-medium"
            :class="i === breadcrumbs.length - 1 ? 'text-vault-text' : 'text-vault-muted hover:text-vault-accent'"
          >
            {{ crumb.name }}
          </button>
        </template>
      </div>

      <!-- View toggle -->
      <div class="flex items-center bg-vault-card border border-vault-border rounded-lg p-0.5 shrink-0">
        <button
          @click="viewMode = 'grid'"
          class="p-1.5 rounded transition-colors"
          :class="viewMode === 'grid' ? 'bg-vault-accent/15 text-vault-accent' : 'text-vault-muted hover:text-vault-text'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>
        </button>
        <button
          @click="viewMode = 'list'"
          class="p-1.5 rounded transition-colors"
          :class="viewMode === 'list' ? 'bg-vault-accent/15 text-vault-accent' : 'text-vault-muted hover:text-vault-text'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
        </button>
      </div>

      <!-- Actions -->
      <button
        @click="ctxNewFolder"
        class="text-vault-muted hover:text-vault-accent text-xs px-2.5 py-1.5 border border-vault-border rounded-lg hover:bg-vault-card transition-colors shrink-0"
      >
        + Folder
      </button>
      <button
        @click="$emit('new-item', currentFolderId)"
        class="bg-vault-accent text-vault-bg px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-vault-accent-dim transition-colors shrink-0"
      >
        {{ newItemLabel }}
      </button>
    </div>

    <!-- Search -->
    <div class="relative mb-3 sm:mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vault-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        class="w-full bg-vault-card border border-vault-border rounded-xl pl-10 pr-8 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
      />
      <button
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-text transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty state -->
    <div v-else-if="visibleFolders.length === 0 && visibleItems.length === 0" class="text-center py-16">
      <div class="text-4xl mb-3">{{ emptyIcon }}</div>
      <p class="text-vault-muted text-sm">
        {{ searchQuery ? 'Tidak ada yang cocok' : emptyText }}
      </p>
    </div>

    <!-- Grid View -->
    <div
      v-else-if="viewMode === 'grid'"
      class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1"
      @contextmenu.prevent="onEmptyContextMenu"
    >
      <!-- Folders -->
      <div
        v-for="folder in visibleFolders"
        :key="'f-' + folder.id"
        class="flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all select-none"
        :class="{
          'bg-vault-accent/10 ring-1 ring-vault-accent/30': selectedId === folder.id,
          'ring-2 ring-vault-accent/40 bg-vault-accent/5': dragOverId === folder.id,
          'hover:bg-vault-card': selectedId !== folder.id,
          'opacity-50': draggingId === folder.id,
        }"
        draggable="true"
        @click.stop="selectItem(folder.id, 'folder')"
        @dblclick.stop="navigateTo(folder.id)"
        @contextmenu.prevent.stop="onContextMenu($event, folder, 'folder')"
        @dragstart="onDragStart($event, folder.id, 'folder')"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver(folder.id)"
        @dragleave="onDragLeave(folder.id)"
        @drop.prevent="onDrop($event, folder.id)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 sm:w-14 sm:h-14 text-amber-400 mb-1.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
        </svg>
        <span class="text-xs text-vault-text text-center leading-tight line-clamp-2 w-full">{{ folder.name }}</span>
      </div>

      <!-- Items -->
      <div
        v-for="item in visibleItems"
        :key="'i-' + item.id"
        class="flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all select-none"
        :class="{
          'bg-vault-accent/10 ring-1 ring-vault-accent/30': selectedId === item.id,
          'hover:bg-vault-card': selectedId !== item.id,
          'opacity-50': draggingId === item.id,
        }"
        draggable="true"
        @click.stop="selectItem(item.id, 'item')"
        @dblclick.stop="$emit('open-item', item)"
        @contextmenu.prevent.stop="onContextMenu($event, item, 'item')"
        @dragstart="onDragStart($event, item.id, 'item')"
        @dragend="onDragEnd"
      >
        <slot name="item-icon" :item="item">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 sm:w-14 sm:h-14 text-vault-accent/60 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </slot>
        <span class="text-xs text-vault-text text-center leading-tight line-clamp-2 w-full">{{ getItemName(item) }}</span>
      </div>
    </div>

    <!-- List View -->
    <div
      v-else
      class="border border-vault-border rounded-xl overflow-hidden"
      @contextmenu.prevent="onEmptyContextMenu"
    >
      <!-- Header -->
      <div class="grid grid-cols-[1fr_100px_120px] gap-2 px-3 py-2 bg-vault-card/50 border-b border-vault-border text-[11px] text-vault-muted uppercase tracking-wider font-semibold">
        <span>Name</span>
        <span>Type</span>
        <span>Modified</span>
      </div>
      <!-- Folders -->
      <div
        v-for="folder in visibleFolders"
        :key="'lf-' + folder.id"
        class="grid grid-cols-[1fr_100px_120px] gap-2 px-3 py-2 border-b border-vault-border/50 cursor-pointer transition-all select-none"
        :class="{
          'bg-vault-accent/10': selectedId === folder.id,
          'ring-2 ring-inset ring-vault-accent/40 bg-vault-accent/5': dragOverId === folder.id,
          'hover:bg-vault-card': selectedId !== folder.id,
          'opacity-50': draggingId === folder.id,
        }"
        draggable="true"
        @click.stop="selectItem(folder.id, 'folder')"
        @dblclick.stop="navigateTo(folder.id)"
        @contextmenu.prevent.stop="onContextMenu($event, folder, 'folder')"
        @dragstart="onDragStart($event, folder.id, 'folder')"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver(folder.id)"
        @dragleave="onDragLeave(folder.id)"
        @drop.prevent="onDrop($event, folder.id)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
          </svg>
          <span class="text-sm text-vault-text truncate">{{ folder.name }}</span>
        </div>
        <span class="text-xs text-vault-muted self-center">Folder</span>
        <span class="text-xs text-vault-muted self-center">{{ formatDate(folder.created_at) }}</span>
      </div>
      <!-- Items -->
      <div
        v-for="item in visibleItems"
        :key="'li-' + item.id"
        class="grid grid-cols-[1fr_100px_120px] gap-2 px-3 py-2 border-b border-vault-border/50 cursor-pointer transition-all select-none last:border-b-0"
        :class="{
          'bg-vault-accent/10': selectedId === item.id,
          'hover:bg-vault-card': selectedId !== item.id,
          'opacity-50': draggingId === item.id,
        }"
        draggable="true"
        @click.stop="selectItem(item.id, 'item')"
        @dblclick.stop="$emit('open-item', item)"
        @contextmenu.prevent.stop="onContextMenu($event, item, 'item')"
        @dragstart="onDragStart($event, item.id, 'item')"
        @dragend="onDragEnd"
      >
        <div class="flex items-center gap-2 min-w-0">
          <slot name="list-icon" :item="item">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </slot>
          <span class="text-sm text-vault-text truncate">{{ getItemName(item) }}</span>
        </div>
        <span class="text-xs text-vault-muted self-center">{{ itemTypeLabel }}</span>
        <span class="text-xs text-vault-muted self-center">{{ formatDate(item.updated_at || item.created_at) }}</span>
      </div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.show"
        class="fixed z-[200] bg-vault-card border border-vault-border rounded-xl shadow-xl py-1 min-w-[180px]"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
      >
        <template v-if="ctxMenu.type === 'folder'">
          <button @click="ctxRename" class="w-full px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-bg transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
            Rename
          </button>
          <button @click="ctxDelete" class="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            Delete
          </button>
        </template>
        <template v-else-if="ctxMenu.type === 'item'">
          <slot name="context-menu" :item="ctxMenu.target" :close="closeCtx" />
        </template>
        <template v-else>
          <button @click="ctxNewFolder" class="w-full px-3 py-2 text-left text-sm text-vault-text hover:bg-vault-bg transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
            </svg>
            New Folder
          </button>
        </template>
      </div>
      <div v-if="ctxMenu.show" class="fixed inset-0 z-[199]" @click="closeCtx" @contextmenu.prevent="closeCtx" />
    </Teleport>

    <!-- Rename modal -->
    <Teleport to="body">
      <div v-if="renameModal.show" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="renameModal.show = false" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6">
          <h3 class="font-serif text-lg text-vault-text mb-4">Rename Folder</h3>
          <input
            ref="renameInput"
            v-model="renameModal.name"
            class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors mb-4"
            @keydown.enter="doRename"
          />
          <div class="flex gap-3">
            <button @click="renameModal.show = false" class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors">Batal</button>
            <button @click="doRename" :disabled="!renameModal.name.trim()" class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30">Simpan</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- New Folder modal -->
    <Teleport to="body">
      <div v-if="newFolderModal.show" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="newFolderModal.show = false" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6">
          <h3 class="font-serif text-lg text-vault-text mb-4">New Folder</h3>
          <input
            ref="newFolderInput"
            v-model="newFolderModal.name"
            placeholder="Nama folder"
            class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors mb-4"
            @keydown.enter="doCreateFolder"
          />
          <div class="flex gap-3">
            <button @click="newFolderModal.show = false" class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors">Batal</button>
            <button @click="doCreateFolder" :disabled="!newFolderModal.name.trim()" class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30">Buat</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  rootLabel: string
  newItemLabel: string
  searchPlaceholder: string
  emptyIcon: string
  emptyText: string
  itemTypeLabel: string
  folders: any[]
  items: any[]
  loading: boolean
  itemNameKey?: string
}>()

const emit = defineEmits<{
  'create-folder': [name: string, parentId: string | null]
  'new-item': [folderId: string | null]
  'open-item': [item: any]
  'rename-folder': [id: string, name: string]
  'delete-folder': [id: string]
  'move-item': [itemId: string, folderId: string | null]
  'move-folder': [folderId: string, parentId: string | null]
}>()

const nameKey = computed(() => props.itemNameKey || 'name')
const getItemName = (item: any) => item[nameKey.value] || item.name || item.url || 'Untitled'

// ── Navigation ──────────────────────────────────────────────────────────

const currentFolderId = ref<string | null>(null)
const history = ref<(string | null)[]>([null])
const historyIndex = ref(0)
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const selectedId = ref<string | null>(null)

const canGoBack = computed(() => historyIndex.value > 0)
const canGoForward = computed(() => historyIndex.value < history.value.length - 1)

const navigateTo = (folderId: string | null) => {
  if (folderId === currentFolderId.value) return
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(folderId)
  historyIndex.value = history.value.length - 1
  currentFolderId.value = folderId
  selectedId.value = null
  searchQuery.value = ''
}

const goBack = () => {
  if (!canGoBack.value) return
  historyIndex.value--
  currentFolderId.value = history.value[historyIndex.value] ?? null
  selectedId.value = null
}

const goForward = () => {
  if (!canGoForward.value) return
  historyIndex.value++
  currentFolderId.value = history.value[historyIndex.value] ?? null
  selectedId.value = null
}

const breadcrumbs = computed(() => {
  const crumbs: any[] = []
  let id = currentFolderId.value
  while (id) {
    const folder = props.folders.find((f: any) => f.id === id)
    if (!folder) break
    crumbs.unshift({ id: folder.id, name: folder.name })
    id = folder.parent_id || null
  }
  return crumbs
})

// ── Filtered content for current folder ─────────────────────────────────

const visibleFolders = computed(() => {
  let result = props.folders.filter((f: any) => (f.parent_id || null) === currentFolderId.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((f: any) => f.name.toLowerCase().includes(q))
  }
  return result
})

const visibleItems = computed(() => {
  let result = props.items.filter((i: any) => (i.folder_id || null) === currentFolderId.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((i: any) =>
      (getItemName(i)).toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q) ||
      (i.url || '').toLowerCase().includes(q)
    )
  }
  return result
})

// ── Selection ───────────────────────────────────────────────────────────

const selectedType = ref<'folder' | 'item' | null>(null)

const selectItem = (id: string, type: 'folder' | 'item') => {
  selectedId.value = id
  selectedType.value = type
}

// ── Context Menu ────────────────────────────────────────────────────────

const ctxMenu = reactive({ show: false, x: 0, y: 0, target: null as any, type: '' as string })

const onContextMenu = (e: MouseEvent, target: any, type: string) => {
  ctxMenu.show = true
  ctxMenu.x = Math.min(e.clientX, window.innerWidth - 200)
  ctxMenu.y = Math.min(e.clientY, window.innerHeight - 200)
  ctxMenu.target = target
  ctxMenu.type = type
}

const onEmptyContextMenu = (e: MouseEvent) => {
  ctxMenu.show = true
  ctxMenu.x = Math.min(e.clientX, window.innerWidth - 200)
  ctxMenu.y = Math.min(e.clientY, window.innerHeight - 200)
  ctxMenu.target = null
  ctxMenu.type = 'empty'
}

const closeCtx = () => { ctxMenu.show = false }

const ctxRename = () => {
  closeCtx()
  renameModal.show = true
  renameModal.id = ctxMenu.target.id
  renameModal.name = ctxMenu.target.name
  nextTick(() => renameInput.value?.focus())
}

const ctxDelete = () => {
  closeCtx()
  if (confirm(`Hapus folder "${ctxMenu.target.name}"? Isinya akan dipindahkan keluar.`)) {
    emit('delete-folder', ctxMenu.target.id)
  }
}

const ctxNewFolder = () => {
  closeCtx()
  newFolderModal.show = true
  newFolderModal.name = ''
  nextTick(() => newFolderInput.value?.focus())
}

// ── Rename modal ────────────────────────────────────────────────────────

const renameInput = ref<HTMLInputElement | null>(null)
const renameModal = reactive({ show: false, id: '', name: '' })

const doRename = () => {
  if (!renameModal.name.trim()) return
  emit('rename-folder', renameModal.id, renameModal.name.trim())
  renameModal.show = false
}

// ── New Folder modal ────────────────────────────────────────────────────

const newFolderInput = ref<HTMLInputElement | null>(null)
const newFolderModal = reactive({ show: false, name: '' })

const doCreateFolder = () => {
  if (!newFolderModal.name.trim()) return
  emit('create-folder', newFolderModal.name.trim(), currentFolderId.value)
  newFolderModal.show = false
}

// ── Drag & Drop ─────────────────────────────────────────────────────────

const draggingId = ref<string | null>(null)
const draggingType = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

const onDragStart = (e: DragEvent, id: string, type: string) => {
  draggingId.value = id
  draggingType.value = type
  e.dataTransfer?.setData('text/plain', JSON.stringify({ id, type }))
  e.dataTransfer!.effectAllowed = 'move'
}

const onDragEnd = () => {
  draggingId.value = null
  draggingType.value = null
  dragOverId.value = null
}

const onDragOver = (folderId: string) => {
  if (draggingId.value === folderId) return
  dragOverId.value = folderId
}

const onDragLeave = (folderId: string) => {
  if (dragOverId.value === folderId) dragOverId.value = null
}

const onDrop = (e: DragEvent, targetFolderId: string) => {
  dragOverId.value = null
  const raw = e.dataTransfer?.getData('text/plain')
  if (!raw) return
  try {
    const { id, type } = JSON.parse(raw)
    if (id === targetFolderId) return
    if (type === 'folder') {
      emit('move-folder', id, targetFolderId)
    } else {
      emit('move-item', id, targetFolderId)
    }
  } catch {}
}

// ── Utilities ───────────────────────────────────────────────────────────

const formatDate = (d: string) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Expose for parent to trigger new folder with correct name
defineExpose({
  openNewFolderModal: (parentId?: string | null) => {
    newFolderModal.show = true
    newFolderModal.name = ''
    nextTick(() => newFolderInput.value?.focus())
  },
  getNewFolderName: () => newFolderModal.name.trim(),
  currentFolderId,
})
</script>
