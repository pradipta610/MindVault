<template>
  <div class="bg-vault-card border border-vault-border rounded-xl overflow-hidden">
    <div class="overflow-x-auto">
      <div class="min-w-full">
        <!-- Header row -->
        <div
          class="grid items-center border-b border-vault-border bg-vault-bg/50 text-[11px] font-medium text-vault-muted uppercase tracking-wider sticky top-0 z-10"
          :style="{ gridTemplateColumns }"
        >
          <div class="px-3 py-2.5"></div>
          <SortHeader label="Task" col="text" :sort-field="sortField" :sort-dir="sortDir" @sort="$emit('sort', $event)" />
          <SortHeader label="Kategori" col="cat" :sort-field="sortField" :sort-dir="sortDir" @sort="$emit('sort', $event)" />
          <SortHeader label="Tanggal" col="date" :sort-field="sortField" :sort-dir="sortDir" @sort="$emit('sort', $event)" />
          <SortHeader label="Deadline" col="deadline_at" :sort-field="sortField" :sort-dir="sortDir" @sort="$emit('sort', $event)" />
          <SortHeader
            v-for="f in fields"
            :key="f.id"
            :label="f.label"
            :col="`custom:${f.key}`"
            :sort-field="sortField"
            :sort-dir="sortDir"
            @sort="$emit('sort', $event)"
          />
          <div class="px-2 py-2.5 flex justify-center">
            <button
              @click.stop="$emit('add-field')"
              class="w-6 h-6 rounded flex items-center justify-center text-vault-muted hover:text-vault-accent hover:bg-vault-accent/10 transition-colors"
              title="Tambah kolom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="task in tasks"
          :key="task.id"
          class="grid items-center border-b border-vault-border last:border-b-0 hover:bg-vault-bg/40 transition-colors group"
          :style="{ gridTemplateColumns }"
        >
          <!-- Done toggle -->
          <div class="px-3 py-2.5">
            <button
              @click.stop="$emit('toggle-done', task.id)"
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="task.done ? 'bg-vault-accent border-vault-accent' : 'border-vault-muted hover:border-vault-accent'"
            >
              <svg v-if="task.done" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </button>
          </div>

          <!-- Title -->
          <div class="px-3 py-2.5 min-w-0 cursor-pointer" @click="$emit('row-click', task)">
            <p class="text-sm text-vault-text truncate" :class="{ 'line-through text-vault-muted': task.done }">{{ plainText(task.text) }}</p>
          </div>

          <!-- Category cell -->
          <div class="px-2 py-2 relative" data-dropdown-anchor>
            <button
              @click.stop="toggleCatDropdown(task.id)"
              class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 max-w-full truncate"
              :style="{ backgroundColor: getCategoryColor(task.cat) + '33', color: getCategoryColor(task.cat) }"
            >
              <span class="text-[9px]">{{ getCategoryIcon(task.cat) }}</span>
              <span class="truncate">{{ task.cat || 'uncategorized' }}</span>
            </button>
            <div
              v-if="openCatDropdown === task.id"
              class="absolute left-0 top-full mt-1 z-20 bg-vault-card border border-vault-border rounded-lg shadow-lg p-1.5 min-w-[160px]"
            >
              <button
                v-for="c in categoryNames"
                :key="c"
                @click.stop="commitCat(task, c)"
                class="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 hover:bg-vault-bg"
                :style="{ color: getCategoryColor(c) }"
              >
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getCategoryColor(c) }" />
                {{ c }}
              </button>
            </div>
          </div>

          <!-- Date cell -->
          <div class="px-2 py-2">
            <input
              type="date"
              :value="task.date"
              @change="commitBuiltin(task, 'date', ($event.target as HTMLInputElement).value)"
              class="w-full bg-transparent text-xs text-vault-text rounded px-1.5 py-1 hover:bg-vault-bg focus:bg-vault-bg focus:outline-none transition-colors"
            />
          </div>

          <!-- Deadline cell -->
          <div class="px-2 py-2">
            <input
              type="datetime-local"
              :value="toLocalInput(task.deadline_at)"
              @change="commitDeadline(task, ($event.target as HTMLInputElement).value)"
              class="w-full bg-transparent text-xs text-vault-text rounded px-1.5 py-1 hover:bg-vault-bg focus:bg-vault-bg focus:outline-none transition-colors"
            />
          </div>

          <!-- Custom field cells -->
          <div v-for="f in fields" :key="f.id" class="px-2 py-2 relative" data-dropdown-anchor>
            <!-- text / number -->
            <input
              v-if="f.type === 'text' || f.type === 'number'"
              :type="f.type === 'number' ? 'number' : 'text'"
              :value="task.custom_fields?.[f.key] ?? ''"
              @blur="commitCustom(task, f, coerce(f, ($event.target as HTMLInputElement).value))"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
              class="w-full bg-transparent text-xs text-vault-text rounded px-1.5 py-1 hover:bg-vault-bg focus:bg-vault-bg focus:outline-none transition-colors"
            />
            <!-- date -->
            <input
              v-else-if="f.type === 'date'"
              type="date"
              :value="task.custom_fields?.[f.key] ?? ''"
              @change="commitCustom(task, f, ($event.target as HTMLInputElement).value)"
              class="w-full bg-transparent text-xs text-vault-text rounded px-1.5 py-1 hover:bg-vault-bg focus:bg-vault-bg focus:outline-none transition-colors"
            />
            <!-- checkbox -->
            <input
              v-else-if="f.type === 'checkbox'"
              type="checkbox"
              :checked="!!task.custom_fields?.[f.key]"
              @change="commitCustom(task, f, ($event.target as HTMLInputElement).checked)"
              class="w-4 h-4"
            />
            <!-- select -->
            <template v-else-if="f.type === 'select'">
              <button
                @click.stop="toggleSelectDropdown(task.id, f.id)"
                class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center max-w-full truncate"
                :style="selectOptionStyle(f, task.custom_fields?.[f.key])"
              >
                {{ selectOptionLabel(f, task.custom_fields?.[f.key]) }}
              </button>
              <div
                v-if="openSelectDropdown === `${task.id}:${f.id}`"
                class="absolute left-0 top-full mt-1 z-20 bg-vault-card border border-vault-border rounded-lg shadow-lg p-1.5 min-w-[140px]"
              >
                <button
                  v-for="opt in f.options"
                  :key="opt.value"
                  @click.stop="commitSelectOption(task, f, opt.value)"
                  class="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 hover:bg-vault-bg"
                  :style="{ color: opt.color }"
                >
                  <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: opt.color }" />
                  {{ opt.label }}
                </button>
                <button
                  v-if="task.custom_fields?.[f.key]"
                  @click.stop="commitSelectOption(task, f, null)"
                  class="w-full mt-1 pt-1 border-t border-vault-border text-[10px] text-vault-muted hover:text-red-400 transition-colors text-left px-2.5"
                >Kosongkan</button>
              </div>
            </template>
          </div>

          <!-- Row actions -->
          <div class="px-2 py-2 flex justify-center">
            <button
              @click.stop="$emit('row-click', task)"
              class="w-6 h-6 rounded flex items-center justify-center text-vault-muted opacity-0 group-hover:opacity-100 hover:text-vault-accent hover:bg-vault-accent/10 transition-all"
              title="Buka detail"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12h10.5m0 0-4.5-4.5m4.5 4.5-4.5 4.5" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="tasks.length === 0" class="px-4 py-8 text-center text-sm text-vault-muted">
          {{ emptyMessage }}
        </div>

        <!-- Quick-add row -->
        <div class="grid items-center" :style="{ gridTemplateColumns }">
          <div class="px-3 py-2.5"></div>
          <div class="px-3 py-2 min-w-0">
            <input
              v-if="addingRow"
              ref="newRowInputEl"
              v-model="newRowText"
              placeholder="Nama task baru, Enter untuk simpan"
              @keydown.enter="commitNewRow"
              @keydown.esc="cancelAddRow"
              @blur="handleNewRowBlur"
              class="w-full bg-transparent text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none"
            />
            <button
              v-else
              @click="startAddRow"
              class="flex items-center gap-1.5 text-sm text-vault-muted hover:text-vault-accent transition-colors py-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah task
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  tasks: any[]
  fields: any[]
  sortField: string | null
  sortDir: 'asc' | 'desc' | null
  categoryNames: string[]
  emptyMessage: string
}>()

const emit = defineEmits<{
  (e: 'sort', field: string): void
  (e: 'row-click', task: any): void
  (e: 'toggle-done', taskId: string): void
  (e: 'cell-update', taskId: string, updates: Record<string, any>): void
  (e: 'add-field'): void
  (e: 'quick-add', text: string): void
}>()

const { getCategoryColor, getCategoryIcon } = useCategories()

const gridTemplateColumns = computed(() => {
  const customCols = props.fields.map(() => '130px').join(' ')
  return `44px minmax(180px,1fr) 130px 130px 150px ${customCols} 44px`
})

const plainText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const coerce = (field: any, value: string) => (field.type === 'number' ? (value === '' ? null : Number(value)) : value)

// ── Category dropdown ────────────────────────────────────────────────────
const openCatDropdown = ref<string | null>(null)
const toggleCatDropdown = (taskId: string) => {
  openCatDropdown.value = openCatDropdown.value === taskId ? null : taskId
}
const commitCat = (task: any, cat: string) => {
  openCatDropdown.value = null
  emit('cell-update', task.id, { cat })
}

// ── Select-type custom field dropdown ────────────────────────────────────
const openSelectDropdown = ref<string | null>(null)
const toggleSelectDropdown = (taskId: string, fieldId: string) => {
  const key = `${taskId}:${fieldId}`
  openSelectDropdown.value = openSelectDropdown.value === key ? null : key
}
const selectOptionLabel = (field: any, value: string | undefined) => {
  const opt = (field.options || []).find((o: any) => o.value === value)
  return opt?.label || '—'
}
const selectOptionStyle = (field: any, value: string | undefined) => {
  const opt = (field.options || []).find((o: any) => o.value === value)
  if (!opt) return { backgroundColor: 'transparent', color: 'var(--v-muted, #6b7280)' }
  return { backgroundColor: opt.color + '33', color: opt.color }
}
const commitSelectOption = (task: any, field: any, value: string | null) => {
  openSelectDropdown.value = null
  commitCustom(task, field, value)
}

const commitBuiltin = (task: any, key: string, value: any) => {
  emit('cell-update', task.id, { [key]: value })
}
const commitDeadline = (task: any, localValue: string) => {
  emit('cell-update', task.id, { deadline_at: localValue ? new Date(localValue).toISOString() : null })
}
const commitCustom = (task: any, field: any, value: any) => {
  emit('cell-update', task.id, { custom_fields: { ...(task.custom_fields || {}), [field.key]: value } })
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('[data-dropdown-anchor]')) {
    openCatDropdown.value = null
    openSelectDropdown.value = null
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

// ── Quick-add row ─────────────────────────────────────────────────────────
const addingRow = ref(false)
const newRowText = ref('')
const newRowInputEl = ref<HTMLInputElement | null>(null)

const startAddRow = () => {
  addingRow.value = true
  nextTick(() => newRowInputEl.value?.focus())
}

const commitNewRow = () => {
  const trimmed = newRowText.value.trim()
  if (!trimmed) return
  emit('quick-add', trimmed)
  newRowText.value = ''
  nextTick(() => newRowInputEl.value?.focus())
}

const handleNewRowBlur = () => {
  commitNewRow()
  if (!newRowText.value.trim()) addingRow.value = false
}

const cancelAddRow = () => {
  newRowText.value = ''
  addingRow.value = false
}
</script>
