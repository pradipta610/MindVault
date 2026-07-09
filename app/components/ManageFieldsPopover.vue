<template>
  <div class="relative" ref="containerRef">
    <button
      @click="toggleOpen"
      class="flex items-center gap-1.5 text-vault-muted hover:text-vault-text hover:bg-vault-bg px-3 py-2 rounded-lg text-xs font-medium transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
      </svg>
      Kelola Kolom
    </button>

    <Transition name="fade">
      <div
        v-if="open && !isMobile"
        class="absolute right-0 top-full mt-1.5 z-50 bg-vault-card border border-vault-border rounded-xl shadow-lg p-3 w-72"
      >
        <!-- ═══ List mode ═══ -->
        <template v-if="mode === 'list'">
          <p class="text-[11px] text-vault-muted font-medium uppercase tracking-wider mb-2">Kolom</p>
          <div class="space-y-1 max-h-64 overflow-y-auto">
            <div
              v-for="(f, i) in fields"
              :key="f.id"
              class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-vault-bg group"
            >
              <div class="flex flex-col leading-none">
                <button :disabled="i === 0" class="text-[9px] text-vault-muted hover:text-vault-text disabled:opacity-20" @click="moveField(f.id, -1)">▲</button>
                <button :disabled="i === fields.length - 1" class="text-[9px] text-vault-muted hover:text-vault-text disabled:opacity-20" @click="moveField(f.id, 1)">▼</button>
              </div>
              <span class="flex-1 text-sm text-vault-text truncate">{{ f.label }}</span>
              <span class="text-[10px] text-vault-muted px-1.5 py-0.5 rounded bg-vault-bg border border-vault-border shrink-0">{{ f.type }}</span>
              <button class="text-vault-muted hover:text-vault-accent opacity-0 group-hover:opacity-100 transition-opacity text-[11px] shrink-0" @click="startEdit(f)">Edit</button>
              <button class="text-vault-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0" @click="handleDelete(f.id)">✕</button>
            </div>
            <p v-if="fields.length === 0" class="text-xs text-vault-muted py-2 text-center">Belum ada kolom custom</p>
          </div>
          <button class="w-full mt-2 pt-2 border-t border-vault-border text-xs text-vault-accent hover:underline text-center" @click="startCreate">+ Tambah kolom</button>
        </template>

        <!-- ═══ Create / edit form ═══ -->
        <FieldForm v-else :mode="mode" :editing-field="editingField" @cancel="mode = 'list'" @create="handleCreate" @update="handleUpdate" />
      </div>
    </Transition>

    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="open && isMobile" class="fixed inset-0 z-[100]" @click="closeSheet">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div class="absolute bottom-0 left-0 right-0 bg-vault-card border-t border-vault-border rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto" @click.stop>
            <div class="w-10 h-1 rounded-full bg-vault-border mx-auto mb-4" />

            <template v-if="mode === 'list'">
              <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Kelola Kolom</p>
              <div class="space-y-1">
                <div
                  v-for="(f, i) in fields"
                  :key="f.id"
                  class="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-vault-bg"
                >
                  <div class="flex flex-col leading-none">
                    <button :disabled="i === 0" class="text-[10px] text-vault-muted disabled:opacity-20" @click="moveField(f.id, -1)">▲</button>
                    <button :disabled="i === fields.length - 1" class="text-[10px] text-vault-muted disabled:opacity-20" @click="moveField(f.id, 1)">▼</button>
                  </div>
                  <span class="flex-1 text-sm text-vault-text truncate">{{ f.label }}</span>
                  <span class="text-[10px] text-vault-muted px-1.5 py-0.5 rounded bg-vault-bg border border-vault-border shrink-0">{{ f.type }}</span>
                  <button class="text-vault-muted text-xs shrink-0" @click="startEdit(f)">Edit</button>
                  <button class="text-vault-muted hover:text-red-400 text-xs shrink-0" @click="handleDelete(f.id)">✕</button>
                </div>
                <p v-if="fields.length === 0" class="text-xs text-vault-muted py-2 text-center">Belum ada kolom custom</p>
              </div>
              <button class="w-full mt-3 pt-3 border-t border-vault-border text-sm text-vault-accent text-center" @click="startCreate">+ Tambah kolom</button>
            </template>

            <FieldForm v-else :mode="mode" :editing-field="editingField" @cancel="mode = 'list'" @create="handleCreate" @update="handleUpdate" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { TaskFieldOption, TaskFieldType } from '~/composables/useTaskFields'

const emit = defineEmits<{ (e: 'close'): void }>()

const { fields, createField, updateField, reorderFields, deleteField } = useTaskFields()

const open = ref(false)
const isMobile = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const mode = ref<'list' | 'create' | 'edit'>('list')
const editingField = ref<any>(null)

const toggleOpen = () => {
  open.value = !open.value
  if (!open.value) mode.value = 'list'
}

const closeSheet = () => {
  open.value = false
  mode.value = 'list'
}

const startCreate = () => { editingField.value = null; mode.value = 'create' }
const startEdit = (field: any) => { editingField.value = field; mode.value = 'edit' }

const handleCreate = async (payload: { label: string; type: TaskFieldType; options: TaskFieldOption[] }) => {
  await createField(payload.label, payload.type, payload.options)
  mode.value = 'list'
}

const handleUpdate = async (payload: { id: string; label: string; options: TaskFieldOption[] }) => {
  await updateField(payload.id, { label: payload.label, options: payload.options })
  mode.value = 'list'
}

const handleDelete = async (id: string) => {
  if (!confirm('Hapus kolom ini? Nilai yang tersimpan pada task akan hilang.')) return
  await deleteField(id)
}

const moveField = async (id: string, direction: -1 | 1) => {
  const ids = fields.value.map((f: any) => f.id)
  const idx = ids.indexOf(id)
  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= ids.length) return
  ;[ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]]
  await reorderFields(ids)
}

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !e.composedPath().includes(containerRef.value)) {
    open.value = false
    mode.value = 'list'
    emit('close')
  }
}

onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

defineExpose({
  openCreate: () => { open.value = true; startCreate() },
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.sheet-enter-active, .sheet-leave-active { transition: all 0.3s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from > :last-child, .sheet-leave-to > :last-child { transform: translateY(100%); }
</style>
