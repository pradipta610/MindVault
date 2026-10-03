<template>
  <div class="mb-4 bg-vault-card border border-vault-border rounded-xl overflow-hidden">
    <!-- Header -->
    <button
      @click="toggleCollapsed"
      class="w-full px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-vault-bg/30 transition-colors"
      :class="{ 'border-b border-vault-border': !collapsed }"
    >
      <span class="text-xs font-medium text-vault-muted flex items-center gap-1.5">
        🔥 Urgent
        <span class="tabular-nums" :class="urgentTasks.length ? 'text-red-400' : ''">({{ urgentTasks.length }})</span>
      </span>
      <span class="flex items-center gap-2 min-w-0">
        <span class="text-[11px] text-vault-muted/70 truncate">Dikerjain hari ini · deadline hari ini/besok</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-vault-muted transition-transform shrink-0" :class="collapsed ? '-rotate-90' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </span>
    </button>

    <template v-if="!collapsed">
      <div v-if="urgentTasks.length === 0" class="px-4 py-3 text-xs text-vault-muted">
        Aman, nggak ada yang harus dikerjain atau selesai hari ini/besok.
      </div>

      <div
        v-for="task in urgentTasks"
        :key="task.id"
        class="px-4 py-2.5 border-b border-vault-border last:border-b-0 flex items-center gap-3 hover:bg-vault-bg/40 transition-colors group"
      >
        <button
          @click.stop="$emit('toggle-done', task.id)"
          title="Tandai selesai"
          class="w-5 h-5 rounded-full border-2 border-vault-muted hover:border-vault-accent flex items-center justify-center shrink-0 transition-colors"
        />

        <div class="flex-1 min-w-0 cursor-pointer" @click="$emit('edit', task)">
          <p class="text-sm text-vault-text truncate">{{ plainText(task.text) }}</p>
          <p class="text-[11px] text-vault-muted flex items-center gap-1.5 flex-wrap mt-0.5">
            <span v-if="deadlineLabel(task)" :class="deadlineClass(task)">{{ deadlineLabel(task) }}</span>
            <span v-else>Dikerjain hari ini</span>
            <span>·</span>
            <span>masuk {{ addedLabel(task.created_at) }}</span>
            <template v-for="f in selectFields" :key="f.id">
              <span
                v-if="optionFor(f, task.custom_fields?.[f.key])"
                class="px-1.5 rounded-full font-medium"
                :style="optionStyle(f, task.custom_fields[f.key])"
              >{{ optionFor(f, task.custom_fields[f.key]).label }}</span>
            </template>
          </p>
        </div>

        <span
          class="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium items-center gap-0.5 shrink-0"
          :style="{ backgroundColor: getCategoryColor(task.cat) + '33', color: getCategoryColor(task.cat) }"
        >
          <span class="text-[9px]">{{ getCategoryIcon(task.cat) }}</span>
          {{ task.cat || 'uncategorized' }}
        </span>

        <button
          @click.stop="$emit('add-to-today', task.id)"
          title="Kerjakan hari ini"
          class="w-7 h-7 rounded flex items-center justify-center text-vault-muted sm:opacity-0 group-hover:opacity-100 hover:text-vault-accent hover:bg-vault-accent/10 transition-all shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75" />
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tasks: any[] }>()
defineEmits<{
  (e: 'toggle-done', taskId: string): void
  (e: 'edit', task: any): void
  (e: 'add-to-today', taskId: string): void
}>()

const { getCategoryColor, getCategoryIcon } = useCategories()
const { fields } = useTaskFields()

const COLLAPSED_KEY = 'mv_urgent_collapsed'
const DAY_MS = 86_400_000

const collapsed = ref(false)
onMounted(() => {
  try { collapsed.value = localStorage.getItem(COLLAPSED_KEY) === '1' } catch {}
})
const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
  try { localStorage.setItem(COLLAPSED_KEY, collapsed.value ? '1' : '0') } catch {}
}

const selectFields = computed(() => fields.value.filter((f: any) => f.type === 'select'))

// ── Matching ──────────────────────────────────────────────────────────────
// task.date is stored with the app's UTC "today"; deadlines are compared on
// the viewer's local calendar day.
const todayStr = () => new Date().toISOString().slice(0, 10)

const localDayOffset = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((a - b) / DAY_MS)
}

// 0 = due today, 1 = due tomorrow, null = no deadline in that window
const deadlineDay = (task: any): number | null => {
  if (!task.deadline_at) return null
  const off = localDayOffset(task.deadline_at)
  return off === 0 || off === 1 ? off : null
}

const isUrgent = (task: any) => deadlineDay(task) !== null || task.date === todayStr()

// Nearest deadline first, then tasks without one; ties go to the oldest task.
const urgentTasks = computed(() =>
  props.tasks
    .filter(isUrgent)
    .sort((a: any, b: any) => {
      const da = deadlineDay(a) !== null ? a.deadline_at : '￿'
      const db = deadlineDay(b) !== null ? b.deadline_at : '￿'
      return da.localeCompare(db) || (a.created_at || '').localeCompare(b.created_at || '')
    })
)

// ── Display helpers ──────────────────────────────────────────────────────
const plainText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const deadlineLabel = (task: any) => {
  const day = deadlineDay(task)
  if (day === null) return ''
  return `${day === 0 ? 'Selesai hari ini' : 'Selesai besok'} ${timeOf(task.deadline_at)}`
}

const deadlineClass = (task: any) =>
  deadlineDay(task) === 0 ? 'text-red-400 font-medium' : 'text-amber-400 font-medium'

const addedLabel = (iso: string | null) => {
  const d = iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS) : 0
  if (d <= 0) return 'hari ini'
  if (d === 1) return 'kemarin'
  return `${d} hari lalu`
}

const optionFor = (field: any, value: string | undefined) =>
  value ? (field.options || []).find((o: any) => o.value === value) : undefined

const optionStyle = (field: any, value: string) => {
  const opt = optionFor(field, value)
  return opt ? { backgroundColor: opt.color + '33', color: opt.color } : {}
}
</script>
