<template>
  <div class="bg-vault-card border border-vault-border rounded-xl overflow-hidden">

    <!-- Hidden columns restore bar -->
    <div v-if="hiddenCols.length" class="flex items-center gap-2 px-3 py-1.5 border-b border-vault-border bg-vault-bg/30 flex-wrap">
      <span class="text-[11px] text-vault-muted">Tersembunyi:</span>
      <button
        v-for="id in hiddenCols"
        :key="id"
        @click="restoreCol(id)"
        class="text-[11px] px-2 py-0.5 rounded-full bg-vault-accent/10 text-vault-accent hover:bg-vault-accent/20 transition-colors"
      >{{ colLabel(id) }} +</button>
    </div>

    <div class="overflow-x-auto">
      <div class="min-w-full">

        <!-- Header row -->
        <div
          class="grid items-center border-b border-vault-border bg-vault-bg/50 text-[11px] font-medium text-vault-muted uppercase tracking-wider sticky top-0 z-10"
          :style="{ gridTemplateColumns }"
        >
          <!-- Select-all or placeholder -->
          <div class="px-2 py-2.5 flex items-center justify-center">
            <input
              v-if="selectMode"
              type="checkbox"
              :checked="allSelected"
              @change="$emit('toggle-select-all')"
              class="w-4 h-4 cursor-pointer"
            />
          </div>

          <!-- Done toggle placeholder -->
          <div class="px-3 py-2.5" />

          <!-- Draggable data column headers -->
          <div
            v-for="col in visibleCols"
            :key="col.id"
            class="flex items-center cursor-grab select-none transition-colors group/hdr overflow-hidden"
            :class="dragOverCol === col.id && dragType === 'col' ? 'bg-vault-accent/10' : ''"
            draggable="true"
            @dragstart.stop="onColDragStart(col.id, $event)"
            @dragover.prevent.stop="onColDragOver(col.id)"
            @dragleave.stop="dragOverCol = null"
            @drop.prevent.stop="onColDrop(col.id)"
            @dragend.stop="dragCol = null; dragOverCol = null; dragType = null"
          >
            <SortHeader
              :label="col.label"
              :col="col.id"
              :sort-field="sortField"
              :sort-dir="sortDir"
              class="flex-1 min-w-0"
              @sort="$emit('sort', $event)"
            />
            <button
              v-if="col.removable"
              @click.stop="hideCol(col.id)"
              class="opacity-0 group-hover/hdr:opacity-60 hover:!opacity-100 mr-1 text-vault-muted hover:text-red-400 transition-all shrink-0"
              title="Sembunyikan kolom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Add column button -->
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

        <!-- Active task rows -->
        <div
          v-for="task in tasks"
          :key="task.id"
          class="grid items-center border-b border-vault-border last:border-b-0 hover:bg-vault-bg/40 transition-colors group"
          :class="dragOverRow === task.id && dragType === 'row' ? 'border-t-2 border-t-vault-accent/60' : ''"
          :style="{ gridTemplateColumns }"
          :draggable="!selectMode"
          @dragstart.stop="!selectMode && onRowDragStart(task.id, $event)"
          @dragover.prevent.stop="!selectMode && onRowDragOver(task.id)"
          @dragleave.stop="dragOverRow = null"
          @drop.prevent.stop="!selectMode && onRowDrop(task.id)"
          @dragend.stop="dragRow = null; dragOverRow = null; dragType = null"
        >
          <!-- Checkbox or drag handle -->
          <div class="px-2 py-2.5 flex items-center justify-center">
            <input
              v-if="selectMode"
              type="checkbox"
              :checked="selectedIds.has(task.id)"
              @change.stop="$emit('toggle-select', task.id)"
              @click.stop
              class="w-4 h-4 cursor-pointer"
            />
            <div
              v-else
              class="w-5 h-5 flex items-center justify-center text-vault-muted opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
              </svg>
            </div>
          </div>

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

          <!-- Data cells -->
          <template v-for="col in visibleCols" :key="col.id">
            <!-- Text -->
            <div v-if="col.id === 'text'" class="px-3 py-2.5 min-w-0 cursor-pointer" @click="$emit('row-click', task)">
              <p class="text-sm text-vault-text truncate" :class="{ 'line-through text-vault-muted': task.done }">{{ plainText(task.text) }}</p>
            </div>

            <!-- Category -->
            <div v-else-if="col.id === 'cat'" class="px-2 py-2 relative" data-dropdown-anchor>
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
                  <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(c) }" />
                  {{ c }}
                </button>
              </div>
            </div>

            <!-- Date -->
            <div v-else-if="col.id === 'date'" class="px-2 py-2">
              <input
                type="date"
                :value="task.date"
                @change="commitBuiltin(task, 'date', ($event.target as HTMLInputElement).value)"
                class="w-full bg-transparent text-xs text-vault-text rounded px-1.5 py-1 hover:bg-vault-bg focus:bg-vault-bg focus:outline-none transition-colors"
              />
            </div>

            <!-- Deadline -->
            <div v-else-if="col.id === 'deadline_at'" class="px-2 py-2">
              <input
                type="datetime-local"
                :value="toLocalInput(task.deadline_at)"
                @change="commitDeadline(task, ($event.target as HTMLInputElement).value)"
                class="w-full bg-transparent text-xs text-vault-text rounded px-1.5 py-1 hover:bg-vault-bg focus:bg-vault-bg focus:outline-none transition-colors"
              />
            </div>

            <!-- Custom field -->
            <div v-else class="px-2 py-2 relative" data-dropdown-anchor>
              <template v-for="f in [fieldsMap[col.id]]" :key="f?.id">
                <template v-if="f">
                  <input
                    v-if="f.type === 'text' || f.type === 'number'"
                    :type="f.type === 'number' ? 'number' : 'text'"
                    :value="task.custom_fields?.[f.key] ?? ''"
                    @blur="commitCustom(task, f, coerce(f, ($event.target as HTMLInputElement).value))"
                    @keydown.enter="($event.target as HTMLInputElement).blur()"
                    class="w-full bg-transparent text-xs text-vault-text rounded px-1.5 py-1 hover:bg-vault-bg focus:bg-vault-bg focus:outline-none transition-colors"
                  />
                  <input
                    v-else-if="f.type === 'date'"
                    type="date"
                    :value="task.custom_fields?.[f.key] ?? ''"
                    @change="commitCustom(task, f, ($event.target as HTMLInputElement).value)"
                    class="w-full bg-transparent text-xs text-vault-text rounded px-1.5 py-1 hover:bg-vault-bg focus:bg-vault-bg focus:outline-none transition-colors"
                  />
                  <input
                    v-else-if="f.type === 'checkbox'"
                    type="checkbox"
                    :checked="!!task.custom_fields?.[f.key]"
                    @change="commitCustom(task, f, ($event.target as HTMLInputElement).checked)"
                    class="w-4 h-4"
                  />
                  <template v-else-if="f.type === 'select'">
                    <button
                      @click.stop="toggleSelectDropdown(task.id, f.id)"
                      class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center max-w-full truncate"
                      :style="selectOptionStyle(f, task.custom_fields?.[f.key])"
                    >{{ selectOptionLabel(f, task.custom_fields?.[f.key]) }}</button>
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
                        <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: opt.color }" />
                        {{ opt.label }}
                      </button>
                      <button
                        v-if="task.custom_fields?.[f.key]"
                        @click.stop="commitSelectOption(task, f, null)"
                        class="w-full mt-1 pt-1 border-t border-vault-border text-[10px] text-vault-muted hover:text-red-400 transition-colors text-left px-2.5"
                      >Kosongkan</button>
                    </div>
                  </template>
                </template>
              </template>
            </div>
          </template>

          <!-- Row action -->
          <div class="px-2 py-2 flex justify-center">
            <button
              @click.stop="$emit('row-click', task)"
              class="w-6 h-6 rounded flex items-center justify-center text-vault-muted opacity-0 group-hover:opacity-100 hover:text-vault-accent hover:bg-vault-accent/10 transition-all"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12h10.5m0 0-4.5-4.5m4.5 4.5-4.5 4.5" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="tasks.length === 0 && doneTasks.length === 0" class="px-4 py-8 text-center text-sm text-vault-muted">
          {{ emptyMessage }}
        </div>

        <!-- Quick-add row -->
        <div class="px-4 py-2.5 border-t border-vault-border">
          <input
            v-if="addingRow"
            ref="newRowInputEl"
            v-model="newRowText"
            placeholder="Nama task baru, Enter untuk simpan..."
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

        <!-- Done section -->
        <template v-if="doneTasks.length > 0">
          <div
            class="px-4 py-2.5 flex items-center justify-between cursor-pointer border-t border-vault-border bg-vault-bg/30 hover:bg-vault-bg/50 transition-colors select-none"
            @click="doneExpanded = !doneExpanded"
          >
            <span class="text-xs font-medium text-vault-muted flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Selesai ({{ doneTasks.length }})
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 text-vault-muted transition-transform duration-200"
              :class="doneExpanded ? 'rotate-180' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          <template v-if="doneExpanded">
            <div
              v-for="task in doneTasks"
              :key="task.id"
              class="grid items-center border-b border-vault-border last:border-b-0 hover:bg-vault-bg/30 transition-colors group opacity-60"
              :style="{ gridTemplateColumns }"
            >
              <div />
              <!-- Uncheck -->
              <div class="px-3 py-2.5">
                <button
                  @click.stop="$emit('uncheck-done', task.id)"
                  title="Batalkan selesai"
                  class="w-5 h-5 rounded-full border-2 bg-vault-accent border-vault-accent flex items-center justify-center shrink-0 transition-colors hover:bg-transparent hover:border-vault-muted"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </button>
              </div>
              <!-- Cells (read-only) -->
              <template v-for="col in visibleCols" :key="col.id">
                <div v-if="col.id === 'text'" class="px-3 py-2.5 min-w-0">
                  <p class="text-sm text-vault-muted truncate line-through">{{ plainText(task.text) }}</p>
                </div>
                <div v-else-if="col.id === 'cat'" class="px-2 py-2">
                  <span
                    v-if="task.cat"
                    class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 opacity-70"
                    :style="{ backgroundColor: getCategoryColor(task.cat) + '22', color: getCategoryColor(task.cat) }"
                  >{{ task.cat }}</span>
                </div>
                <div v-else-if="col.id === 'date'" class="px-2 py-2">
                  <span class="text-xs text-vault-muted/50">{{ task.date }}</span>
                </div>
                <div v-else class="px-2 py-2" />
              </template>
              <!-- Done row actions -->
              <div class="px-2 py-2 flex items-center justify-center gap-1">
                <button
                  @click.stop="$emit('archive-done', task)"
                  title="Arsipkan ke Backlog"
                  class="w-5 h-5 rounded flex items-center justify-center text-vault-muted opacity-0 group-hover:opacity-100 hover:text-vault-accent transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </button>
                <button
                  @click.stop="$emit('delete-done', task.id)"
                  title="Hapus permanen"
                  class="w-5 h-5 rounded flex items-center justify-center text-vault-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </template>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  tasks: any[]
  doneTasks: any[]
  fields: any[]
  sortField: string | null
  sortDir: 'asc' | 'desc' | null
  categoryNames: string[]
  emptyMessage: string
  selectMode: boolean
  selectedIds: Set<string>
}>()

const emit = defineEmits<{
  (e: 'sort', field: string): void
  (e: 'row-click', task: any): void
  (e: 'toggle-done', taskId: string): void
  (e: 'cell-update', taskId: string, updates: Record<string, any>): void
  (e: 'add-field'): void
  (e: 'quick-add', text: string): void
  (e: 'toggle-select', taskId: string): void
  (e: 'toggle-select-all'): void
  (e: 'reorder', ids: string[]): void
  (e: 'uncheck-done', taskId: string): void
  (e: 'archive-done', task: any): void
  (e: 'delete-done', taskId: string): void
}>()

const { getCategoryColor, getCategoryIcon } = useCategories()

// ── Column config ─────────────────────────────────────────────────────────
const BUILTIN_COLS = [
  { id: 'text', label: 'Task', width: 'minmax(180px,1fr)', removable: false },
  { id: 'cat', label: 'Kategori', width: '130px', removable: true },
  { id: 'date', label: 'Tanggal', width: '130px', removable: true },
  { id: 'deadline_at', label: 'Deadline', width: '150px', removable: true },
]

const loadColState = () => {
  if (!import.meta.client) return { order: BUILTIN_COLS.map(c => c.id), hidden: [] as string[] }
  const order = JSON.parse(localStorage.getItem('mv_table_col_order') || 'null') || BUILTIN_COLS.map(c => c.id)
  const hidden = JSON.parse(localStorage.getItem('mv_table_hidden_cols') || '[]') as string[]
  return { order, hidden }
}

const { order: initOrder, hidden: initHidden } = loadColState()
const colOrder = ref<string[]>(initOrder)
const hiddenCols = ref<string[]>(initHidden)

const saveColState = () => {
  if (!import.meta.client) return
  localStorage.setItem('mv_table_col_order', JSON.stringify(colOrder.value))
  localStorage.setItem('mv_table_hidden_cols', JSON.stringify(hiddenCols.value))
}

const visibleCols = computed(() => {
  const hidden = new Set(hiddenCols.value)
  const result: { id: string; label: string; width: string; removable: boolean }[] = []

  // Ensure all custom field IDs are in order
  for (const f of props.fields) {
    const id = `custom:${f.key}`
    if (!colOrder.value.includes(id)) {
      colOrder.value = [...colOrder.value, id]
    }
  }

  for (const id of colOrder.value) {
    if (hidden.has(id)) continue
    const builtin = BUILTIN_COLS.find(c => c.id === id)
    if (builtin) {
      result.push(builtin)
    } else if (id.startsWith('custom:')) {
      const key = id.slice(7)
      const field = props.fields.find((f: any) => f.key === key)
      if (field) result.push({ id, label: field.label, width: '130px', removable: true })
    }
  }
  return result
})

const gridTemplateColumns = computed(() => {
  const firstCol = '36px'
  const doneCol = '44px'
  const dataCols = visibleCols.value.map(c => c.width).join(' ')
  const actionsCol = '44px'
  return `${firstCol} ${doneCol} ${dataCols} ${actionsCol}`
})

const colLabel = (id: string) => {
  const builtin = BUILTIN_COLS.find(c => c.id === id)
  if (builtin) return builtin.label
  if (id.startsWith('custom:')) {
    const key = id.slice(7)
    return props.fields.find((f: any) => f.key === key)?.label || id
  }
  return id
}

const hideCol = (id: string) => {
  hiddenCols.value = [...hiddenCols.value, id]
  saveColState()
}

const restoreCol = (id: string) => {
  hiddenCols.value = hiddenCols.value.filter(c => c !== id)
  saveColState()
}

// ── Column drag ───────────────────────────────────────────────────────────
const dragCol = ref<string | null>(null)
const dragOverCol = ref<string | null>(null)
const dragType = ref<'col' | 'row' | null>(null)

const onColDragStart = (colId: string, e: DragEvent) => {
  dragCol.value = colId
  dragType.value = 'col'
  e.dataTransfer?.setData('text/plain', colId)
}

const onColDragOver = (colId: string) => {
  if (dragType.value !== 'col') return
  dragOverCol.value = colId
}

const onColDrop = (targetId: string) => {
  if (dragType.value !== 'col' || !dragCol.value || dragCol.value === targetId) {
    dragOverCol.value = null; return
  }
  const order = [...colOrder.value]
  const from = order.indexOf(dragCol.value)
  const to = order.indexOf(targetId)
  if (from === -1 || to === -1) return
  order.splice(from, 1)
  order.splice(to, 0, dragCol.value)
  colOrder.value = order
  saveColState()
  dragCol.value = null; dragOverCol.value = null; dragType.value = null
}

// ── Row drag ──────────────────────────────────────────────────────────────
const dragRow = ref<string | null>(null)
const dragOverRow = ref<string | null>(null)

const onRowDragStart = (taskId: string, e: DragEvent) => {
  dragRow.value = taskId
  dragType.value = 'row'
  e.dataTransfer?.setData('text/plain', taskId)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

const onRowDragOver = (taskId: string) => {
  if (dragType.value !== 'row') return
  dragOverRow.value = taskId
}

const onRowDrop = (targetId: string) => {
  if (dragType.value !== 'row' || !dragRow.value || dragRow.value === targetId) {
    dragOverRow.value = null; return
  }
  const ids = props.tasks.map((t: any) => t.id)
  const from = ids.indexOf(dragRow.value)
  const to = ids.indexOf(targetId)
  if (from === -1 || to === -1) return
  ids.splice(from, 1)
  ids.splice(to, 0, dragRow.value)
  emit('reorder', ids)
  dragRow.value = null; dragOverRow.value = null; dragType.value = null
}

// ── Select all ────────────────────────────────────────────────────────────
const allSelected = computed(() =>
  props.tasks.length > 0 && props.tasks.every((t: any) => props.selectedIds.has(t.id))
)

// ── Done section ──────────────────────────────────────────────────────────
const doneExpanded = ref(false)

// ── Helpers ───────────────────────────────────────────────────────────────
const plainText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const coerce = (field: any, value: string) => (field.type === 'number' ? (value === '' ? null : Number(value)) : value)

const fieldsMap = computed(() => {
  const map: Record<string, any> = {}
  for (const f of props.fields) {
    map[`custom:${f.key}`] = f
  }
  return map
})

// ── Category dropdown ─────────────────────────────────────────────────────
const openCatDropdown = ref<string | null>(null)
const toggleCatDropdown = (taskId: string) => {
  openCatDropdown.value = openCatDropdown.value === taskId ? null : taskId
}
const commitCat = (task: any, cat: string) => {
  openCatDropdown.value = null
  emit('cell-update', task.id, { cat })
}

// ── Select-type custom field dropdown ─────────────────────────────────────
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
