<template>
  <div>
    <!-- Horizontal pill bar -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1" style="touch-action: pan-x">
      <button
        v-for="scope in scopes"
        :key="scope.id"
        @click="onPillClick(scope)"
        @contextmenu.prevent="openMenu(scope)"
        @pointerdown="startLongPress(scope, $event)"
        @pointerup="cancelLongPress"
        @pointercancel="cancelLongPress"
        @pointerleave="cancelLongPress"
        class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all select-none"
        :class="currentScopeId === scope.id
          ? 'bg-vault-accent/15 text-vault-text shadow-sm'
          : 'bg-vault-card border-vault-border text-vault-muted hover:text-vault-text'"
        :style="currentScopeId === scope.id ? { borderColor: scope.color + '66', backgroundColor: scope.color + '22' } : {}"
      >
        <span class="text-sm leading-none">{{ scope.emoji }}</span>
        <span>{{ scope.name }}</span>
      </button>

      <!-- Add new -->
      <button
        @click="openAddModal"
        class="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-vault-border text-vault-muted hover:text-vault-accent hover:border-vault-accent/40 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Baru
      </button>
    </div>

    <!-- Long-press context menu (edit / delete) -->
    <Teleport to="body">
      <div v-if="menuScope" class="fixed inset-0 z-[95] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeMenu" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xs p-2">
          <div class="px-3 py-2.5 flex items-center gap-2 border-b border-vault-border">
            <span class="text-base">{{ menuScope.emoji }}</span>
            <span class="text-sm text-vault-text font-medium">{{ menuScope.name }}</span>
          </div>
          <button
            @click="editScope(menuScope!)"
            class="w-full text-left px-3 py-2.5 text-sm text-vault-text hover:bg-vault-bg rounded-lg transition-colors flex items-center gap-2"
          >
            <span>✏️</span> Edit
          </button>
          <button
            v-if="scopes.length > 1"
            @click="confirmDelete(menuScope!)"
            class="w-full text-left px-3 py-2.5 text-sm text-vault-negative hover:bg-vault-negative/5 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🗑️</span> Hapus
          </button>
          <button
            @click="closeMenu"
            class="w-full text-center px-3 py-2 mt-1 text-xs text-vault-muted hover:text-vault-text rounded-lg transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Add / Edit modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeEditModal" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5">
          <h3 class="font-serif text-lg text-vault-text mb-4">
            {{ editing ? 'Edit Scope' : 'Scope Baru' }}
          </h3>

          <!-- Preview pill -->
          <div class="flex justify-center mb-4">
            <div
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
              :style="{ borderColor: formColor + '66', backgroundColor: formColor + '22' }"
            >
              <span class="text-sm">{{ formEmoji }}</span>
              <span class="text-vault-text">{{ formName || 'Nama scope' }}</span>
            </div>
          </div>

          <!-- Name -->
          <div class="mb-4">
            <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Nama</p>
            <input
              ref="nameInput"
              v-model="formName"
              type="text"
              maxlength="30"
              placeholder="Keluarga, Pacar, Usaha..."
              class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30"
              @keydown.enter="save"
            />
          </div>

          <!-- Emoji grid -->
          <div class="mb-4">
            <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Emoji</p>
            <div class="grid grid-cols-8 gap-1.5">
              <button
                v-for="em in EMOJI_PRESETS"
                :key="em"
                @click="formEmoji = em"
                class="aspect-square flex items-center justify-center rounded-lg border text-lg transition-all"
                :class="formEmoji === em ? 'border-vault-accent/60 bg-vault-accent/10' : 'border-vault-border hover:border-vault-border/60 bg-vault-bg'"
              >
                {{ em }}
              </button>
            </div>
          </div>

          <!-- Color grid -->
          <div class="mb-5">
            <p class="text-[10px] text-vault-muted uppercase tracking-wider mb-1.5">Warna</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="c in COLOR_PRESETS"
                :key="c"
                @click="formColor = c"
                class="w-8 h-8 rounded-full transition-transform"
                :class="formColor === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-vault-card ring-vault-accent' : ''"
                :style="{ backgroundColor: c }"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="closeEditModal"
              class="flex-1 py-2.5 rounded-xl text-sm text-vault-muted border border-vault-border hover:bg-vault-bg transition-colors"
            >
              Batal
            </button>
            <button
              @click="save"
              :disabled="!formName.trim() || saving"
              class="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-vault-accent text-vault-bg hover:bg-vault-accent-dim transition-colors disabled:opacity-40"
            >
              {{ editing ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirmation -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="deleteTarget = null" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xs p-5">
          <h3 class="font-serif text-lg text-vault-text mb-2">Hapus scope?</h3>
          <p class="text-xs text-vault-muted mb-4">
            Scope <span class="text-vault-text font-medium">{{ deleteTarget.emoji }} {{ deleteTarget.name }}</span> akan dihapus.
            Transaksi yang pakai scope ini gak ikut hilang — cuma jadi "tanpa scope".
          </p>
          <div class="flex gap-2">
            <button
              @click="deleteTarget = null"
              class="flex-1 py-2.5 rounded-xl text-sm text-vault-muted border border-vault-border hover:bg-vault-bg transition-colors"
            >
              Batal
            </button>
            <button
              @click="doDelete"
              class="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-vault-negative/80 text-white hover:bg-vault-negative transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { FinanceScope } from '~/composables/useFinanceScopes'

const emit = defineEmits<{ (e: 'changed'): void }>()

const { scopes, currentScopeId, setCurrentScope, createScope, updateScope, deleteScope } = useFinanceScopes()
const { show: showToast } = useToast()

// ── Long-press detection ──────────────────────────────────────────────
const menuScope = ref<FinanceScope | null>(null)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let pressedScope: FinanceScope | null = null
let didLongPress = false

const startLongPress = (scope: FinanceScope, _e: PointerEvent) => {
  pressedScope = scope
  didLongPress = false
  longPressTimer = setTimeout(() => {
    didLongPress = true
    menuScope.value = scope
  }, 500)
}
const cancelLongPress = () => {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  pressedScope = null
}

const onPillClick = (scope: FinanceScope) => {
  // If long-press triggered, don't switch scope
  if (didLongPress) { didLongPress = false; return }
  if (scope.id === currentScopeId.value) return
  setCurrentScope(scope.id)
  emit('changed')
}

const openMenu = (scope: FinanceScope) => { menuScope.value = scope }
const closeMenu = () => { menuScope.value = null }

// ── Add / Edit modal ──────────────────────────────────────────────────
const EMOJI_PRESETS = ['👤','👨‍👩‍👧','❤️','💍','🏠','🎓','💼','💰','🏢','🚗','✈️','🎁','🛒','🎮','🐶','🌱','📚','💻','⚡','🔥','🌊','🌸','⭐','🎯']
const COLOR_PRESETS = ['#f7ce28','#f59e0b','#ef4444','#ec4899','#8b5cf6','#6366f1','#3b82f6','#06b6d4','#10b981','#84cc16','#6b7280','#f97316']

const showEditModal = ref(false)
const editing = ref<FinanceScope | null>(null)
const formName = ref('')
const formEmoji = ref('💰')
const formColor = ref('#f7ce28')
const saving = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

const openAddModal = () => {
  editing.value = null
  formName.value = ''
  formEmoji.value = '💰'
  formColor.value = '#f7ce28'
  showEditModal.value = true
  nextTick(() => nameInput.value?.focus())
}

const editScope = (scope: FinanceScope) => {
  editing.value = scope
  formName.value = scope.name
  formEmoji.value = scope.emoji
  formColor.value = scope.color
  closeMenu()
  showEditModal.value = true
  nextTick(() => nameInput.value?.focus())
}

const closeEditModal = () => {
  showEditModal.value = false
  editing.value = null
}

const save = async () => {
  const name = formName.value.trim()
  if (!name || saving.value) return
  saving.value = true
  try {
    if (editing.value) {
      const updated = await updateScope(editing.value.id, {
        name, emoji: formEmoji.value, color: formColor.value,
      })
      if (updated) showToast('Scope diupdate')
      else showToast('Gagal update scope', 'error')
    } else {
      const created = await createScope({
        name, emoji: formEmoji.value, color: formColor.value,
      })
      if (created) {
        setCurrentScope(created.id)
        emit('changed')
        showToast('Scope ditambahkan')
      } else {
        showToast('Gagal tambah scope (mungkin nama sudah dipakai)', 'error')
      }
    }
    closeEditModal()
  } finally { saving.value = false }
}

// ── Delete ────────────────────────────────────────────────────────────
const deleteTarget = ref<FinanceScope | null>(null)
const confirmDelete = (scope: FinanceScope) => {
  deleteTarget.value = scope
  closeMenu()
}
const doDelete = async () => {
  if (!deleteTarget.value) return
  const ok = await deleteScope(deleteTarget.value.id)
  if (ok) {
    showToast('Scope dihapus')
    emit('changed')
  } else {
    showToast('Gagal hapus scope', 'error')
  }
  deleteTarget.value = null
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
