<template>
  <button
    ref="triggerEl"
    type="button"
    @click.stop="toggle"
    :class="variant === 'cell' ? cellCls : chipCls"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" :class="modelValue ? 'text-vault-accent' : 'text-vault-muted'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path v-if="withTime" stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
    <span class="truncate" :class="modelValue ? 'text-vault-text' : 'text-vault-muted'">{{ displayText }}</span>
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      ref="popoverEl"
      class="fixed z-[200] w-[264px] bg-vault-card border border-vault-border rounded-xl shadow-xl p-3 select-none"
      :style="{ top: pos.top + 'px', left: pos.left + 'px' }"
      @click.stop
    >
      <!-- Quick picks -->
      <div class="grid grid-cols-4 gap-1 mb-3">
        <button
          v-for="q in quickPicks"
          :key="q.label"
          type="button"
          @click="pickDate(q.date)"
          class="text-[11px] py-1.5 rounded-lg border transition-colors"
          :class="selectedDate === q.date ? 'bg-vault-accent/15 text-vault-accent border-vault-accent/40' : 'border-vault-border text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
        >{{ q.label }}</button>
      </div>

      <!-- Month nav -->
      <div class="flex items-center justify-between mb-1.5">
        <button type="button" @click="shiftMonth(-1)" class="w-7 h-7 rounded-lg flex items-center justify-center text-vault-muted hover:text-vault-text hover:bg-vault-bg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <span class="text-xs font-semibold text-vault-text">{{ monthLabel }}</span>
        <button type="button" @click="shiftMonth(1)" class="w-7 h-7 rounded-lg flex items-center justify-center text-vault-muted hover:text-vault-text hover:bg-vault-bg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      <!-- Day grid -->
      <div class="grid grid-cols-7 text-center">
        <span v-for="d in DAY_LABELS" :key="d" class="text-[10px] text-vault-muted py-1">{{ d }}</span>
        <button
          v-for="cell in cells"
          :key="cell.date"
          type="button"
          @click="pickDate(cell.date)"
          class="h-8 text-xs rounded-lg transition-colors"
          :class="dayCls(cell)"
        >{{ cell.num }}</button>
      </div>

      <!-- Time -->
      <div v-if="withTime" class="mt-3 pt-3 border-t border-vault-border">
        <div class="flex items-center gap-1 flex-wrap">
          <button
            v-for="t in TIME_PICKS"
            :key="t"
            type="button"
            @click="pickTime(t)"
            class="text-[11px] px-2 py-1 rounded-lg border tabular-nums transition-colors"
            :class="selectedTime === t ? 'bg-vault-accent/15 text-vault-accent border-vault-accent/40' : 'border-vault-border text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
          >{{ t }}</button>
          <input
            type="time"
            :value="selectedTime"
            @change="pickTime(($event.target as HTMLInputElement).value)"
            class="text-[11px] bg-vault-bg border border-vault-border rounded-lg px-1.5 py-1 text-vault-text focus:outline-none focus:border-vault-accent/40 tabular-nums"
          />
        </div>
      </div>

      <!-- Footer -->
      <div v-if="clearable || withTime" class="flex items-center justify-between mt-3">
        <button
          v-if="clearable && modelValue"
          type="button"
          @click="clear"
          class="text-[11px] text-vault-muted hover:text-red-400 transition-colors"
        >Hapus</button>
        <span v-else />
        <button
          v-if="withTime"
          type="button"
          @click="open = false"
          class="text-[11px] font-semibold bg-vault-accent text-vault-bg px-3 py-1 rounded-lg hover:bg-vault-accent-dim transition-colors"
        >Selesai</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// Value format: 'YYYY-MM-DD', or 'YYYY-MM-DDTHH:mm' (local) when withTime.
const props = withDefaults(defineProps<{
  modelValue: string | null | undefined
  withTime?: boolean
  placeholder?: string
  clearable?: boolean
  variant?: 'chip' | 'cell'
}>(), {
  withTime: false,
  placeholder: 'Pilih tanggal',
  clearable: true,
  variant: 'chip',
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const TIME_PICKS = ['09:00', '12:00', '17:00', '21:00']
const DEFAULT_TIME = '17:00'

const chipCls = 'inline-flex items-center gap-1.5 text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1 hover:border-vault-accent/40 transition-colors max-w-full'
const cellCls = 'w-full inline-flex items-center gap-1.5 text-xs rounded px-1.5 py-1 hover:bg-vault-bg transition-colors text-left'

const open = ref(false)
const triggerEl = ref<HTMLElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const pos = ref({ top: 0, left: 0 })
const viewYear = ref(0)
const viewMonth = ref(0)

const pad = (n: number) => String(n).padStart(2, '0')
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseDate = (s: string) => new Date(s + 'T00:00:00')
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return toDateStr(d) }

const selectedDate = computed(() => (props.modelValue || '').slice(0, 10))
const selectedTime = computed(() => (props.modelValue || '').slice(11, 16))

const displayText = computed(() => {
  if (!selectedDate.value) return props.placeholder
  const diff = Math.round((parseDate(selectedDate.value).getTime() - parseDate(addDays(0)).getTime()) / 86_400_000)
  let label: string
  if (diff === 0) label = 'Hari ini'
  else if (diff === 1) label = 'Besok'
  else if (diff === -1) label = 'Kemarin'
  else {
    const d = parseDate(selectedDate.value)
    const sameYear = d.getFullYear() === new Date().getFullYear()
    label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
  }
  return props.withTime && selectedTime.value ? `${label} ${selectedTime.value}` : label
})

const quickPicks = computed(() => {
  const nextMonday = new Date()
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7))
  return [
    { label: 'Hari ini', date: addDays(0) },
    { label: 'Besok', date: addDays(1) },
    { label: 'Lusa', date: addDays(2) },
    { label: 'Senin', date: toDateStr(nextMonday) },
  ]
})

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
)

// 6-week grid starting on Monday
const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const offset = (first.getDay() + 6) % 7
  const out: { date: string; num: number; inMonth: boolean }[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(viewYear.value, viewMonth.value, 1 - offset + i)
    out.push({ date: toDateStr(d), num: d.getDate(), inMonth: d.getMonth() === viewMonth.value })
  }
  return out
})

const dayCls = (cell: { date: string; inMonth: boolean }) => {
  if (cell.date === selectedDate.value) return 'bg-vault-accent text-vault-bg font-semibold'
  if (cell.date === addDays(0)) return 'text-vault-accent font-semibold hover:bg-vault-bg'
  return cell.inMonth ? 'text-vault-text hover:bg-vault-bg' : 'text-vault-muted/40 hover:bg-vault-bg'
}

const shiftMonth = (dir: number) => {
  const d = new Date(viewYear.value, viewMonth.value + dir, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

const position = () => {
  const el = triggerEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const width = 264
  const height = popoverEl.value?.offsetHeight || (props.withTime ? 420 : 360)
  const below = window.innerHeight - r.bottom
  const top = below >= height + 8 || below >= r.top ? r.bottom + 6 : r.top - height - 6
  const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8)
  pos.value = { top: Math.max(8, top), left }
}

const toggle = () => {
  if (open.value) { open.value = false; return }
  const base = selectedDate.value ? parseDate(selectedDate.value) : new Date()
  viewYear.value = base.getFullYear()
  viewMonth.value = base.getMonth()
  open.value = true
  position()
  nextTick(position)
}

const pickDate = (date: string) => {
  if (props.withTime) {
    emit('update:modelValue', `${date}T${selectedTime.value || DEFAULT_TIME}`)
    const d = parseDate(date)
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
  } else {
    emit('update:modelValue', date)
    open.value = false
  }
}

const pickTime = (time: string) => {
  if (!time) return
  emit('update:modelValue', `${selectedDate.value || addDays(0)}T${time}`)
}

const clear = () => {
  emit('update:modelValue', '')
  open.value = false
}

const onDocDown = (e: MouseEvent) => {
  if (!open.value) return
  const t = e.target as Node
  if (triggerEl.value?.contains(t) || popoverEl.value?.contains(t)) return
  open.value = false
}
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open.value = false }
const onReflow = () => { if (open.value) position() }

onMounted(() => {
  document.addEventListener('mousedown', onDocDown)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', onReflow)
  window.addEventListener('scroll', onReflow, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocDown)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onReflow)
  window.removeEventListener('scroll', onReflow, true)
})
</script>
