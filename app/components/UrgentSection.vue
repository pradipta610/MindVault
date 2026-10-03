<template>
  <div class="mb-4 bg-vault-card border border-vault-border rounded-xl">
    <!-- Header -->
    <div class="px-4 py-2.5 flex items-center justify-between gap-2" :class="{ 'border-b border-vault-border': !collapsed }">
      <button @click="toggleCollapsed" class="text-xs font-medium text-vault-muted flex items-center gap-1.5 hover:text-vault-text transition-colors">
        🔥 Urgent
        <span class="tabular-nums" :class="urgentTasks.length ? 'text-red-400' : ''">({{ urgentTasks.length }})</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 transition-transform" :class="collapsed ? '-rotate-90' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <!-- Filter popover -->
      <div class="relative" ref="popoverRef">
        <button
          @click="showFilter = !showFilter"
          class="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
          :class="showFilter ? 'bg-vault-accent/15 text-vault-accent' : 'text-vault-muted hover:text-vault-accent'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
          </svg>
          Filter<span v-if="activeRuleCount" class="tabular-nums">· {{ activeRuleCount }}</span>
        </button>

        <Transition name="fade">
          <div
            v-if="showFilter"
            class="absolute right-0 top-full mt-1.5 z-50 bg-vault-card border border-vault-border rounded-xl shadow-lg p-3 w-[300px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto space-y-3"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs text-vault-muted">Task masuk Urgent kalau cocok semua aturan</p>
              <button v-if="activeRuleCount" @click="resetRules" class="text-[11px] text-vault-accent hover:underline shrink-0 ml-2">Reset</button>
            </div>

            <!-- When to do it (task date) -->
            <div>
              <p class="text-[11px] font-medium text-vault-text mb-1.5">Kapan dikerjain</p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="opt in WHEN_OPTIONS"
                  :key="opt.value"
                  @click="rules.when = opt.value"
                  :class="pillCls(rules.when === opt.value)"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- Select-type custom fields (status, priority, ...) -->
            <div v-for="f in selectFields" :key="f.id">
              <p class="text-[11px] font-medium text-vault-text mb-1.5">{{ f.label }}</p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="opt in f.options"
                  :key="opt.value"
                  @click="toggleFieldValue(f.key, opt.value)"
                  :class="pillCls(isFieldValueOn(f.key, opt.value))"
                  :style="isFieldValueOn(f.key, opt.value) ? { backgroundColor: opt.color + '33', color: opt.color, borderColor: opt.color + '66' } : {}"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- Date added -->
            <div>
              <p class="text-[11px] font-medium text-vault-text mb-1.5">Tanggal dimasukkan</p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="opt in ADDED_OPTIONS"
                  :key="opt.value"
                  @click="rules.addedAgo = opt.value"
                  :class="pillCls(rules.addedAgo === opt.value)"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <template v-if="!collapsed">
      <div v-if="!activeRuleCount" class="px-4 py-3 text-xs text-vault-muted">
        Atur filter dulu buat nentuin task mana yang urgent.
      </div>
      <div v-else-if="urgentTasks.length === 0" class="px-4 py-3 text-xs text-vault-muted">
        Aman, nggak ada task urgent.
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
            <span :class="dueClass(task.date)">{{ dueLabel(task.date) }}</span>
            <span>·</span>
            <span>masuk {{ addedLabel(task.created_at) }}</span>
            <template v-for="f in ruleFields" :key="f.id">
              <span
                v-if="task.custom_fields?.[f.key]"
                class="px-1.5 rounded-full font-medium"
                :style="optionStyle(f, task.custom_fields[f.key])"
              >{{ optionLabel(f, task.custom_fields[f.key]) }}</span>
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
type When = 'any' | 'overdue' | 'today' | '3d' | '7d'

interface UrgentRules {
  when: When
  fieldValues: Record<string, string[]>
  addedAgo: number
}

const props = defineProps<{ tasks: any[] }>()
defineEmits<{
  (e: 'toggle-done', taskId: string): void
  (e: 'edit', task: any): void
  (e: 'add-to-today', taskId: string): void
}>()

const { getCategoryColor, getCategoryIcon } = useCategories()
const { fields } = useTaskFields()

const WHEN_OPTIONS: { value: When; label: string }[] = [
  { value: 'any', label: 'Kapan aja' },
  { value: 'overdue', label: 'Udah lewat' },
  { value: 'today', label: 'Hari ini / lewat' },
  { value: '3d', label: '≤ 3 hari lagi' },
  { value: '7d', label: '≤ 7 hari lagi' },
]

const ADDED_OPTIONS = [
  { value: 0, label: 'Kapan aja' },
  { value: 3, label: '≥ 3 hari lalu' },
  { value: 7, label: '≥ 7 hari lalu' },
  { value: 14, label: '≥ 14 hari lalu' },
  { value: 30, label: '≥ 30 hari lalu' },
]

const RULES_KEY = 'mv_urgent_rules'
const COLLAPSED_KEY = 'mv_urgent_collapsed'
const DEFAULT_RULES: UrgentRules = { when: 'today', fieldValues: {}, addedAgo: 0 }

const rules = ref<UrgentRules>({ ...DEFAULT_RULES, fieldValues: {} })
const collapsed = ref(false)
const showFilter = ref(false)
const popoverRef = ref<HTMLElement | null>(null)

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(RULES_KEY) || 'null')
    if (saved) rules.value = { ...DEFAULT_RULES, ...saved, fieldValues: saved.fieldValues || {} }
    collapsed.value = localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {}
})

watch(rules, (val) => {
  try { localStorage.setItem(RULES_KEY, JSON.stringify(val)) } catch {}
}, { deep: true })

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
  try { localStorage.setItem(COLLAPSED_KEY, collapsed.value ? '1' : '0') } catch {}
}

const resetRules = () => {
  rules.value = { when: 'any', fieldValues: {}, addedAgo: 0 }
}

// ── Field rules ───────────────────────────────────────────────────────────
const selectFields = computed(() => fields.value.filter((f: any) => f.type === 'select' && f.options?.length))

// Ignore values left over from deleted fields/options
const activeFieldValues = computed(() => {
  const out: Record<string, string[]> = {}
  for (const f of selectFields.value) {
    const valid = new Set((f.options || []).map((o: any) => o.value))
    const vals = (rules.value.fieldValues[f.key] || []).filter(v => valid.has(v))
    if (vals.length) out[f.key] = vals
  }
  return out
})

const ruleFields = computed(() => selectFields.value.filter((f: any) => activeFieldValues.value[f.key]))

const isFieldValueOn = (key: string, value: string) => (rules.value.fieldValues[key] || []).includes(value)

const toggleFieldValue = (key: string, value: string) => {
  const cur = rules.value.fieldValues[key] || []
  const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]
  rules.value.fieldValues = { ...rules.value.fieldValues, [key]: next }
}

const activeRuleCount = computed(() =>
  (rules.value.when !== 'any' ? 1 : 0)
  + Object.keys(activeFieldValues.value).length
  + (rules.value.addedAgo > 0 ? 1 : 0)
)

// ── Matching ──────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)
const DAY_MS = 86_400_000

const addDays = (dateStr: string, n: number) =>
  new Date(new Date(dateStr + 'T00:00:00Z').getTime() + n * DAY_MS).toISOString().slice(0, 10)

const matchesWhen = (date: string | null) => {
  const when = rules.value.when
  if (when === 'any') return true
  if (!date) return false
  const today = todayStr()
  if (when === 'overdue') return date < today
  if (when === 'today') return date <= today
  return date <= addDays(today, when === '3d' ? 3 : 7)
}

const daysSince = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS) : 0)

const urgentTasks = computed(() => {
  if (!activeRuleCount.value) return []
  const fieldRules = Object.entries(activeFieldValues.value)
  return props.tasks
    .filter((t: any) => {
      if (!matchesWhen(t.date)) return false
      if (rules.value.addedAgo > 0 && daysSince(t.created_at) < rules.value.addedAgo) return false
      return fieldRules.every(([key, vals]) => vals.includes(t.custom_fields?.[key]))
    })
    .sort((a: any, b: any) =>
      (a.date || '9999').localeCompare(b.date || '9999') || (a.created_at || '').localeCompare(b.created_at || '')
    )
})

// ── Display helpers ──────────────────────────────────────────────────────
const plainText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const dayDiff = (date: string) =>
  Math.round((new Date(date + 'T00:00:00Z').getTime() - new Date(todayStr() + 'T00:00:00Z').getTime()) / DAY_MS)

const dueLabel = (date: string | null) => {
  if (!date) return 'Tanpa tanggal'
  const d = dayDiff(date)
  if (d < 0) return `Lewat ${-d} hari`
  if (d === 0) return 'Hari ini'
  if (d === 1) return 'Besok'
  return `${d} hari lagi`
}

const dueClass = (date: string | null) => {
  if (!date) return ''
  const d = dayDiff(date)
  if (d < 0) return 'text-red-400 font-medium'
  if (d === 0) return 'text-amber-400 font-medium'
  return ''
}

const addedLabel = (iso: string | null) => {
  const d = daysSince(iso)
  if (d <= 0) return 'hari ini'
  if (d === 1) return 'kemarin'
  return `${d} hari lalu`
}

const optionFor = (field: any, value: string) => (field.options || []).find((o: any) => o.value === value)
const optionLabel = (field: any, value: string) => optionFor(field, value)?.label || value
const optionStyle = (field: any, value: string) => {
  const opt = optionFor(field, value)
  return opt ? { backgroundColor: opt.color + '33', color: opt.color } : {}
}

const pillCls = (on: boolean) => [
  'text-[11px] px-2 py-1 rounded-full border transition-colors',
  on ? 'bg-vault-accent/15 text-vault-accent border-vault-accent/40' : 'border-vault-border text-vault-muted hover:text-vault-text',
]

// ── Close popover on outside click ───────────────────────────────────────
const handleClickOutside = (e: MouseEvent) => {
  if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) showFilter.value = false
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
