<template>
  <div class="todo-calendar select-none">
    <!-- Header: month/year + view toggle + nav -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <button @click="navigate(-1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-vault-muted hover:text-vault-text hover:bg-vault-bg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button @click="goToToday" class="text-sm font-semibold text-vault-text min-w-[140px] text-center hover:text-vault-accent transition-colors">
          {{ headerLabel }}
        </button>
        <button @click="navigate(1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-vault-muted hover:text-vault-text hover:bg-vault-bg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      <div class="flex bg-vault-bg rounded-lg p-0.5">
        <button
          @click="calView = 'month'"
          class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
          :class="calView === 'month' ? 'bg-vault-card text-vault-text shadow-sm' : 'text-vault-muted hover:text-vault-text'"
        >Bulan</button>
        <button
          @click="calView = 'week'"
          class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
          :class="calView === 'week' ? 'bg-vault-card text-vault-text shadow-sm' : 'text-vault-muted hover:text-vault-text'"
        >Minggu</button>
      </div>
    </div>

    <!-- Day labels -->
    <div class="grid grid-cols-7 mb-1">
      <div v-for="d in dayLabels" :key="d" class="text-center text-[10px] font-medium text-vault-muted uppercase py-1">
        {{ d }}
      </div>
    </div>

    <!-- Monthly grid -->
    <div
      v-if="calView === 'month'"
      class="grid grid-cols-7"
      @touchstart.passive="onSwipeStart"
      @touchend.passive="onSwipeEnd"
    >
      <button
        v-for="day in monthDays"
        :key="day.key"
        @click="day.date && selectDay(day.date)"
        class="relative flex flex-col items-center py-1.5 rounded-lg transition-colors"
        :class="getDayClass(day)"
        :disabled="!day.date"
      >
        <span class="text-xs leading-none mb-0.5" :class="getDayTextClass(day)">
          {{ day.num || '' }}
        </span>
        <div v-if="day.date && getDots(day.date).length > 0" class="flex gap-0.5 mt-0.5">
          <span
            v-for="(color, i) in getDots(day.date).slice(0, 3)"
            :key="i"
            class="w-1 h-1 rounded-full"
            :style="{ backgroundColor: color }"
          />
          <span v-if="getDots(day.date).length > 3" class="w-1 h-1 rounded-full bg-vault-muted" />
        </div>
        <div v-else class="h-[6px]" />
      </button>
    </div>

    <!-- Weekly grid -->
    <div
      v-else
      class="grid grid-cols-7"
      @touchstart.passive="onSwipeStart"
      @touchend.passive="onSwipeEnd"
    >
      <button
        v-for="day in weekDays"
        :key="day.key"
        @click="selectDay(day.date)"
        class="relative flex flex-col items-center py-2 rounded-lg transition-colors"
        :class="getDayClass(day)"
      >
        <span class="text-xs leading-none mb-0.5" :class="getDayTextClass(day)">
          {{ day.num }}
        </span>
        <div v-if="getDots(day.date).length > 0" class="flex gap-0.5 mt-0.5">
          <span
            v-for="(color, i) in getDots(day.date).slice(0, 3)"
            :key="i"
            class="w-1 h-1 rounded-full"
            :style="{ backgroundColor: color }"
          />
        </div>
        <div v-else class="h-[6px]" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  selectedDate: string
  taskDots: Record<string, string[]>
}>()

const emit = defineEmits(['select'])

const { getCategoryColor } = useCategories()

const calView = ref<'month' | 'week'>('month')
const viewYear = ref(0)
const viewMonth = ref(0)
const viewWeekStart = ref('')

const todayStr = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

// Init from selected date
const initFromDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
  viewWeekStart.value = getWeekStart(dateStr)
}

onMounted(() => initFromDate(props.selectedDate))

watch(() => props.selectedDate, (val) => {
  const d = new Date(val + 'T00:00:00')
  if (calView.value === 'month') {
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
  } else {
    viewWeekStart.value = getWeekStart(val)
  }
})

const headerLabel = computed(() => {
  if (calView.value === 'month') {
    const d = new Date(viewYear.value, viewMonth.value, 1)
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }
  const ws = new Date(viewWeekStart.value + 'T00:00:00')
  const we = new Date(ws)
  we.setDate(we.getDate() + 6)
  const sm = ws.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  const em = we.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${sm} - ${em}`
})

const getWeekStart = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toDateStr(d)
}

const toDateStr = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Month grid: 6 rows x 7 cols
const monthDays = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  let startDay = first.getDay()
  if (startDay === 0) startDay = 7
  startDay--

  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const cells: { key: string; date: string; num: number; currentMonth: boolean }[] = []

  // Leading blanks from previous month
  const prevMonthDays = new Date(viewYear.value, viewMonth.value, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(viewYear.value, viewMonth.value - 1, prevMonthDays - i)
    cells.push({ key: 'p' + i, date: toDateStr(d), num: prevMonthDays - i, currentMonth: false })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(viewYear.value, viewMonth.value, i)
    cells.push({ key: 'c' + i, date: toDateStr(d), num: i, currentMonth: true })
  }

  // Trailing days from next month
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear.value, viewMonth.value + 1, i)
    cells.push({ key: 'n' + i, date: toDateStr(d), num: i, currentMonth: false })
  }

  return cells
})

// Week grid: 7 days
const weekDays = computed(() => {
  const start = new Date(viewWeekStart.value + 'T00:00:00')
  const days: { key: string; date: string; num: number; currentMonth: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push({ key: 'w' + i, date: toDateStr(d), num: d.getDate(), currentMonth: true })
  }
  return days
})

// Visible date range for parent to fetch dots
const visibleRange = computed(() => {
  if (calView.value === 'month') {
    const cells = monthDays.value
    return { start: cells[0]?.date ?? '', end: cells[cells.length - 1]?.date ?? '' }
  }
  const start = viewWeekStart.value
  const end = new Date(start + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  return { start, end: toDateStr(end) }
})

defineExpose({ visibleRange })

watch(visibleRange, (range) => {
  emit('select', props.selectedDate)
}, { deep: true })

const getDots = (date: string): string[] => {
  const cats = props.taskDots[date]
  if (!cats || cats.length === 0) return []
  const uniqueCats = [...new Set(cats)]
  return uniqueCats.map(cat => getCategoryColor(cat))
}

const getDayClass = (day: { date: string; currentMonth: boolean }) => {
  if (!day.date) return 'cursor-default'
  if (day.date === props.selectedDate) return 'bg-vault-accent/20'
  if (day.date === todayStr.value) return 'bg-vault-card'
  if (!day.currentMonth) return 'opacity-30'
  return 'hover:bg-vault-bg'
}

const getDayTextClass = (day: { date: string; currentMonth: boolean }) => {
  if (day.date === props.selectedDate) return 'text-vault-accent font-semibold'
  if (day.date === todayStr.value) return 'text-vault-text font-semibold'
  if (!day.currentMonth) return 'text-vault-muted'
  return 'text-vault-text'
}

const selectDay = (date: string) => {
  emit('select', date)
}

const navigate = (dir: number) => {
  if (calView.value === 'month') {
    viewMonth.value += dir
    if (viewMonth.value > 11) { viewMonth.value = 0; viewYear.value++ }
    if (viewMonth.value < 0) { viewMonth.value = 11; viewYear.value-- }
  } else {
    const ws = new Date(viewWeekStart.value + 'T00:00:00')
    ws.setDate(ws.getDate() + dir * 7)
    viewWeekStart.value = toDateStr(ws)
  }
}

const goToToday = () => {
  const today = todayStr.value
  initFromDate(today)
  emit('select', today)
}

// Swipe support for mobile
let swipeStartX = 0
const onSwipeStart = (e: TouchEvent) => {
  if (e.touches.length === 1) swipeStartX = e.touches[0]?.clientX ?? 0
}
const onSwipeEnd = (e: TouchEvent) => {
  if (e.changedTouches.length === 1) {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - swipeStartX
    if (Math.abs(dx) > 60) {
      navigate(dx < 0 ? 1 : -1)
    }
  }
}
</script>
