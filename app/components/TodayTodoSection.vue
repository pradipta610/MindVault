<template>
  <div
    class="mb-4 rounded-xl border overflow-hidden transition-colors"
    :class="dropActive ? 'border-vault-accent bg-vault-accent/[0.06]' : 'border-vault-border bg-vault-card'"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave="onDragLeave"
    @drop.prevent="onDropSection"
  >
    <!-- Header -->
    <div
      class="px-4 py-3 flex items-center justify-between gap-3 border-b transition-colors"
      :class="dropActive ? 'border-vault-accent/30' : 'border-vault-border'"
    >
      <div class="flex items-baseline gap-2 min-w-0">
        <h3 class="text-sm font-semibold text-vault-text shrink-0">Hari Ini</h3>
        <span class="text-[11px] text-vault-muted truncate">{{ dateLabel }}</span>
      </div>

      <div v-if="tasks.length > 0" class="flex items-center gap-2 shrink-0">
        <span
          class="text-[11px] font-semibold tabular-nums transition-colors"
          :class="allDone ? 'text-vault-accent' : 'text-vault-muted'"
        >{{ doneCount }}/{{ tasks.length }}</span>
        <div class="w-14 h-1.5 rounded-full bg-vault-bg overflow-hidden">
          <div
            class="h-full bg-vault-accent rounded-full"
            :style="{ width: progress + '%', transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }"
          />
        </div>
      </div>
    </div>

    <!-- Empty state / drop invitation -->
    <div v-if="tasks.length === 0" class="p-3">
      <div
        class="border-2 border-dashed rounded-xl py-6 px-4 text-center transition-colors"
        :class="dropActive ? 'border-vault-accent/60 bg-vault-accent/5' : 'border-vault-border'"
      >
        <p class="text-sm font-medium mb-1" :class="dropActive ? 'text-vault-accent' : 'text-vault-text'">
          {{ dropActive ? 'Lepas di sini' : 'Belum ada rencana hari ini' }}
        </p>
        <p class="text-xs text-vault-muted leading-relaxed">
          Seret task dari daftar di bawah ke sini,<br class="sm:hidden" />
          atau pilih lewat tombol di bawah.
        </p>
      </div>
    </div>

    <!-- Plan rows -->
    <div
      v-for="(task, i) in tasks"
      :key="task.id"
      class="relative flex items-center gap-2.5 pl-4 pr-2 py-2.5 border-b border-vault-border last:border-b-0 transition-colors group"
      :class="[
        dragOverId === task.id ? 'border-t-2 border-t-vault-accent/60' : '',
        task.done ? 'opacity-55' : 'hover:bg-vault-bg/40',
      ]"
      :draggable="true"
      @dragstart.stop="onRowDragStart(task.id, $event)"
      @dragover.prevent.stop="onRowDragOver(task.id)"
      @drop.prevent.stop="onRowDrop(task.id, $event)"
      @dragend.stop="resetDrag"
    >
      <!-- "next up" marker on the first unfinished item -->
      <span
        v-if="task.id === nextUpId"
        class="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-vault-accent"
      />

      <!-- Position number doubles as the done toggle -->
      <button
        @click.stop="$emit('toggle', task)"
        :title="task.done ? 'Batalkan selesai' : 'Tandai selesai'"
        class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-semibold tabular-nums transition-colors"
        :class="task.done
          ? 'bg-vault-accent border-vault-accent text-vault-bg'
          : 'border-vault-muted/50 text-vault-muted hover:border-vault-accent hover:text-vault-accent'"
      >
        <svg v-if="task.done" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        <span v-else>{{ i + 1 }}</span>
      </button>

      <p
        class="flex-1 min-w-0 text-sm truncate cursor-pointer"
        :class="task.done ? 'line-through text-vault-muted' : 'text-vault-text'"
        @click="$emit('edit', task)"
      >{{ plainText(task.text) }}</p>

      <span
        v-if="task.deadline_at && !task.done"
        class="hidden sm:inline-flex items-center gap-0.5 text-[10px] shrink-0"
        :class="isOverdue(task) ? 'text-red-400 font-medium' : 'text-vault-muted'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        {{ formatDeadline(task.deadline_at) }}
      </span>

      <span
        class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5 shrink-0 max-w-[110px]"
        :style="{ backgroundColor: getCategoryColor(task.cat) + '33', color: getCategoryColor(task.cat) }"
      >
        <span class="text-[9px]">{{ getCategoryIcon(task.cat) }}</span>
        <span class="truncate">{{ task.cat || 'uncategorized' }}</span>
      </span>

      <!-- Drag handle (desktop affordance for reordering) -->
      <span class="hidden sm:flex w-4 h-5 items-center justify-center text-vault-muted opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
        </svg>
      </span>

      <button
        @click.stop="$emit('remove', task.id)"
        title="Keluarkan dari Hari Ini"
        class="w-8 h-8 sm:w-6 sm:h-6 rounded flex items-center justify-center text-vault-muted sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Footer: quick-add + picker -->
    <div class="px-4 py-2.5 border-t border-vault-border flex items-center gap-3 flex-wrap">
      <input
        v-if="adding"
        ref="addInputEl"
        v-model="newText"
        placeholder="Task baru untuk hari ini, Enter untuk simpan..."
        @keydown.enter="commitAdd"
        @keydown.esc="cancelAdd"
        @blur="commitAdd"
        class="flex-1 min-w-[160px] bg-transparent text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none"
      />
      <template v-else>
        <button
          @click="startAdd"
          class="flex items-center gap-1.5 text-sm text-vault-muted hover:text-vault-accent transition-colors py-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Task baru
        </button>
        <button
          @click="$emit('open-picker')"
          class="flex items-center gap-1.5 text-sm text-vault-muted hover:text-vault-accent transition-colors py-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Pilih dari daftar
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tasks: any[] }>()

const emit = defineEmits<{
  (e: 'toggle', task: any): void
  (e: 'edit', task: any): void
  (e: 'remove', taskId: string): void
  (e: 'reorder', ids: string[]): void
  (e: 'add', taskId: string): void
  (e: 'quick-add', text: string): void
  (e: 'open-picker'): void
}>()

const { getCategoryColor, getCategoryIcon } = useCategories()

const plainText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const doneCount = computed(() => props.tasks.filter((t: any) => t.done).length)
const allDone = computed(() => props.tasks.length > 0 && doneCount.value === props.tasks.length)
const progress = computed(() => props.tasks.length === 0 ? 0 : (doneCount.value / props.tasks.length) * 100)
const nextUpId = computed(() => props.tasks.find((t: any) => !t.done)?.id ?? null)

const dateLabel = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
)

const isOverdue = (task: any) => !!task.deadline_at && new Date(task.deadline_at) < new Date()

const formatDeadline = (isoStr: string) => {
  const d = new Date(isoStr)
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === new Date().toDateString()) return time
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// ── Drag & drop ───────────────────────────────────────────────────────────
// A drag started inside this section reorders; anything else dropped here is
// a task arriving from the list below.
const dragId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const dropActive = ref(false)
const dragDepth = ref(0)

const resetDrag = () => {
  dragId.value = null
  dragOverId.value = null
  dropActive.value = false
  dragDepth.value = 0
}

const onDragEnter = () => {
  dragDepth.value++
  if (!dragId.value) dropActive.value = true
}

const onDragLeave = () => {
  dragDepth.value--
  if (dragDepth.value <= 0) { dragDepth.value = 0; dropActive.value = false }
}

const onRowDragStart = (taskId: string, e: DragEvent) => {
  dragId.value = taskId
  e.dataTransfer?.setData('text/plain', taskId)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

const onRowDragOver = (taskId: string) => {
  if (dragId.value) dragOverId.value = taskId
}

const moveWithin = (targetId: string) => {
  if (!dragId.value || dragId.value === targetId) return
  const ids = props.tasks.map((t: any) => t.id)
  const from = ids.indexOf(dragId.value)
  const to = ids.indexOf(targetId)
  if (from === -1 || to === -1) return
  ids.splice(from, 1)
  ids.splice(to, 0, dragId.value)
  emit('reorder', ids)
}

const acceptExternal = (e: DragEvent) => {
  const id = e.dataTransfer?.getData('text/plain')
  if (id) emit('add', id)
}

const onRowDrop = (targetId: string, e: DragEvent) => {
  if (dragId.value) moveWithin(targetId)
  else acceptExternal(e)
  resetDrag()
}

const onDropSection = (e: DragEvent) => {
  if (!dragId.value) acceptExternal(e)
  resetDrag()
}

// ── Quick add ─────────────────────────────────────────────────────────────
const adding = ref(false)
const newText = ref('')
const addInputEl = ref<HTMLInputElement | null>(null)

const startAdd = () => {
  adding.value = true
  nextTick(() => addInputEl.value?.focus())
}

const commitAdd = () => {
  const text = newText.value.trim()
  newText.value = ''
  adding.value = false
  if (text) emit('quick-add', text)
}

const cancelAdd = () => {
  newText.value = ''
  adding.value = false
}
</script>
