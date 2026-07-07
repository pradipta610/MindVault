<template>
  <div class="space-y-3">
    <div>
      <p class="text-[10px] text-vault-muted mb-1">Nama kolom</p>
      <input
        v-model="label"
        placeholder="mis. Prioritas"
        class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors"
      />
    </div>

    <div>
      <p class="text-[10px] text-vault-muted mb-1">Tipe</p>
      <select
        v-if="mode === 'create'"
        v-model="type"
        class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors"
      >
        <option value="text">Text</option>
        <option value="number">Angka</option>
        <option value="date">Tanggal</option>
        <option value="select">Pilihan (select)</option>
        <option value="checkbox">Checkbox</option>
      </select>
      <p v-else class="text-xs text-vault-muted">{{ type }} <span class="text-[10px]">(tipe tidak bisa diubah)</span></p>
    </div>

    <div v-if="type === 'select'" class="space-y-2">
      <p class="text-[10px] text-vault-muted">Opsi</p>
      <div v-for="(opt, i) in options" :key="i" class="flex items-center gap-1.5">
        <input
          v-model="opt.label"
          placeholder="Label opsi"
          class="flex-1 min-w-0 bg-vault-bg border border-vault-border rounded-md px-2 py-1.5 text-xs text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors"
        />
        <button
          v-for="c in presetColors.slice(0, 5)"
          :key="c"
          @click="opt.color = c"
          class="w-4 h-4 rounded-full border shrink-0 transition-transform"
          :class="opt.color === c ? 'border-vault-text scale-110' : 'border-transparent hover:scale-105'"
          :style="{ backgroundColor: c }"
        />
        <button class="text-vault-muted hover:text-red-400 text-xs shrink-0" @click="options.splice(i, 1)">✕</button>
      </div>
      <button class="text-xs text-vault-accent hover:underline" @click="addOption">+ Tambah opsi</button>
    </div>

    <div class="flex gap-2 pt-1">
      <button
        class="flex-1 bg-vault-bg border border-vault-border text-vault-muted rounded-lg px-3 py-2 text-xs font-medium hover:text-vault-text transition-colors"
        @click="$emit('cancel')"
      >Batal</button>
      <button
        :disabled="!label.trim()"
        class="flex-1 bg-vault-accent text-vault-bg rounded-lg px-3 py-2 text-xs font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
        @click="submit"
      >Simpan</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskFieldOption, TaskFieldType } from '~/composables/useTaskFields'

const props = defineProps<{
  mode: 'create' | 'edit' | 'list'
  editingField: any
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'create', payload: { label: string; type: TaskFieldType; options: TaskFieldOption[] }): void
  (e: 'update', payload: { id: string; label: string; options: TaskFieldOption[] }): void
}>()

const presetColors = [
  '#d4a853', '#53a8d4', '#a8d453', '#d453a8', '#a853d4',
  '#e06c75', '#61afef', '#98c379', '#e5c07b', '#c678dd',
]

const label = ref(props.editingField?.label || '')
const type = ref<TaskFieldType>(props.editingField?.type || 'text')
const options = ref<TaskFieldOption[]>(
  props.editingField?.options ? JSON.parse(JSON.stringify(props.editingField.options)) : []
)

const addOption = () => {
  options.value.push({
    value: `opt-${Math.random().toString(36).slice(2, 6)}`,
    label: '',
    color: presetColors[options.value.length % presetColors.length]!,
  })
}

const submit = () => {
  if (!label.value.trim()) return
  if (props.mode === 'create') {
    emit('create', { label: label.value, type: type.value, options: type.value === 'select' ? options.value : [] })
  } else {
    emit('update', { id: props.editingField.id, label: label.value, options: options.value })
  }
}
</script>
