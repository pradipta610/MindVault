<template>
  <div class="py-4 sm:py-6 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">Focus</h2>
      <button
        v-if="ambientSupported"
        @click="showAmbient = !showAmbient"
        class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
        :class="activeSound ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      </button>
    </div>

    <!-- Ambient sound selector -->
    <div v-if="showAmbient" class="bg-vault-card border border-vault-border rounded-xl p-4 mb-4">
      <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Ambient Sound</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="s in ambientSounds"
          :key="s.key"
          @click="toggleSound(s.key)"
          class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
          :class="activeSound === s.key ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent' : 'bg-vault-bg border-vault-border text-vault-muted hover:text-vault-text'"
        >
          {{ s.icon }} {{ s.label }}
        </button>
      </div>
      <div v-if="activeSound" class="mt-3 flex items-center gap-3">
        <span class="text-[11px] text-vault-muted">Volume</span>
        <input
          type="range"
          min="0"
          max="100"
          :value="ambientVolume"
          @input="setAmbientVolume(Number(($event.target as HTMLInputElement).value))"
          class="flex-1 accent-vault-accent h-1"
        />
      </div>
    </div>

    <!-- ═══ Method picker (only when idle) ═══ -->
    <div v-if="timerState === 'idle'" class="space-y-4">
      <!-- Method selection -->
      <div class="bg-vault-card border border-vault-border rounded-xl p-4">
        <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Metode Fokus</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="m in methods"
            :key="m.key"
            @click="selectedMethod = m.key"
            class="px-3 py-3 rounded-xl text-left border transition-colors"
            :class="selectedMethod === m.key ? 'bg-vault-accent/15 border-vault-accent/40' : 'bg-vault-bg border-vault-border hover:border-vault-accent/20'"
          >
            <span class="text-lg block mb-1">{{ m.icon }}</span>
            <span class="text-xs font-semibold block" :class="selectedMethod === m.key ? 'text-vault-accent' : 'text-vault-text'">{{ m.label }}</span>
            <span class="text-[10px] text-vault-muted block mt-0.5">{{ m.desc }}</span>
          </button>
        </div>
      </div>

      <!-- Deadline time picker (only for deadline method) -->
      <div v-if="selectedMethod === 'deadline'" class="bg-vault-card border border-vault-border rounded-xl p-4">
        <label class="text-xs text-vault-muted font-medium uppercase tracking-wider block mb-2">Deadline</label>
        <input
          type="datetime-local"
          v-model="deadlineInput"
          class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2.5 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors"
        />
      </div>

      <!-- Task linking -->
      <div class="bg-vault-card border border-vault-border rounded-xl p-4">
        <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Link ke Task (opsional)</p>
        <div v-if="pendingTasks.length === 0" class="text-xs text-vault-muted/60">Tidak ada task aktif</div>
        <div v-else class="space-y-1.5 max-h-40 overflow-y-auto">
          <button
            @click="linkedTaskId = null"
            class="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
            :class="!linkedTaskId ? 'bg-vault-accent/15 text-vault-accent font-medium' : 'text-vault-muted hover:bg-vault-bg'"
          >
            Tanpa task
          </button>
          <button
            v-for="t in pendingTasks"
            :key="t.id"
            @click="linkedTaskId = t.id"
            class="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2"
            :class="linkedTaskId === t.id ? 'bg-vault-accent/15 text-vault-accent font-medium' : 'text-vault-text hover:bg-vault-bg'"
          >
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :style="{ backgroundColor: getCategoryColor(t.cat) }"
            />
            <span class="truncate">{{ stripHtml(t.text) }}</span>
          </button>
        </div>
      </div>

      <!-- Start button -->
      <button
        @click="startTimer"
        :disabled="selectedMethod === 'deadline' && !deadlineInput"
        class="w-full bg-vault-accent text-vault-bg py-4 rounded-xl text-lg font-bold hover:bg-vault-accent-dim transition-colors disabled:opacity-30 active:scale-[0.98]"
      >
        Mulai Fokus
      </button>
    </div>

    <!-- ═══ Active timer ═══ -->
    <div v-else class="space-y-6">
      <!-- Timer display -->
      <div class="bg-vault-card border border-vault-border rounded-2xl p-8 sm:p-12 text-center">
        <!-- Method badge -->
        <div class="inline-flex items-center gap-1.5 bg-vault-bg rounded-full px-3 py-1 mb-6">
          <span class="text-sm">{{ currentMethodIcon }}</span>
          <span class="text-[11px] font-medium text-vault-muted">{{ currentMethodLabel }}</span>
          <span v-if="pomodoroSessionNum > 0 && selectedMethod === 'pomodoro'" class="text-[11px] text-vault-accent font-medium">
            #{{ pomodoroSessionNum }}
          </span>
        </div>

        <!-- Phase label (for pomodoro) -->
        <p v-if="timerPhase === 'break'" class="text-xs text-green-400 font-medium mb-2 uppercase tracking-wider">
          {{ isLongBreak ? 'Istirahat Panjang' : 'Istirahat' }}
        </p>

        <!-- Big timer -->
        <div class="font-mono text-6xl sm:text-7xl font-bold text-vault-text tracking-tight mb-2 select-none">
          {{ displayTime }}
        </div>

        <!-- Linked task -->
        <div v-if="linkedTask" class="flex items-center justify-center gap-2 mt-4 mb-2">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getCategoryColor(linkedTask.cat) }" />
          <span class="text-xs text-vault-muted truncate max-w-[200px]">{{ stripHtml(linkedTask.text) }}</span>
        </div>

        <!-- Total focus time this session -->
        <p class="text-xs text-vault-muted mt-2">
          Fokus: {{ totalFocusMinutes }} menit
        </p>

        <!-- Controls -->
        <div class="flex items-center justify-center gap-4 mt-8">
          <button
            v-if="timerState === 'running'"
            @click="pauseTimer"
            class="w-14 h-14 rounded-full bg-vault-bg border border-vault-border flex items-center justify-center text-vault-text hover:border-vault-accent/30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>
          <button
            v-if="timerState === 'paused'"
            @click="resumeTimer"
            class="w-14 h-14 rounded-full bg-vault-accent text-vault-bg flex items-center justify-center hover:bg-vault-accent-dim transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button
            v-if="selectedMethod === 'flowtime' && timerState === 'running'"
            @click="finishFlowtime"
            class="w-14 h-14 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/30 transition-colors"
            title="Selesai"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
          <button
            @click="stopTimer"
            class="w-14 h-14 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center hover:bg-red-500/25 transition-colors"
            title="Berhenti"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Stats Dashboard ═══ -->
    <div v-if="timerState === 'idle'" class="mt-8 space-y-4">
      <!-- Today stats -->
      <div class="bg-vault-card border border-vault-border rounded-xl p-4">
        <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Hari Ini</p>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-2xl font-bold text-vault-text">{{ todayStats.totalMinutes }}</p>
            <p class="text-[10px] text-vault-muted mt-0.5">menit fokus</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-vault-text">{{ todayStats.sessions }}</p>
            <p class="text-[10px] text-vault-muted mt-0.5">sesi</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-vault-accent">{{ streak }}🔥</p>
            <p class="text-[10px] text-vault-muted mt-0.5">hari streak</p>
          </div>
        </div>
      </div>

      <!-- Weekly chart -->
      <div class="bg-vault-card border border-vault-border rounded-xl p-4">
        <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Minggu Ini</p>
        <div class="flex items-end justify-between gap-1 h-24">
          <div
            v-for="day in weeklyData"
            :key="day.label"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <div
              class="w-full rounded-t-md transition-all"
              :class="day.minutes > 0 ? 'bg-vault-accent/60' : 'bg-vault-border'"
              :style="{ height: day.barHeight + 'px', minHeight: '4px' }"
            />
            <span class="text-[9px] text-vault-muted">{{ day.label }}</span>
          </div>
        </div>
        <div v-if="weeklyMaxMinutes > 0" class="text-right mt-1">
          <span class="text-[10px] text-vault-muted">max {{ weeklyMaxMinutes }}m</span>
        </div>
      </div>

      <!-- Per-task session count -->
      <div v-if="taskSessionList.length > 0" class="bg-vault-card border border-vault-border rounded-xl p-4">
        <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Sesi per Task</p>
        <div class="space-y-2">
          <div
            v-for="item in taskSessionList"
            :key="item.taskId"
            class="flex items-center gap-2 text-xs"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(item.cat) }" />
            <span class="flex-1 truncate text-vault-text">{{ item.text }}</span>
            <span class="text-vault-accent font-semibold">🍅 {{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- Today's sessions log -->
      <div v-if="todaySessions.length > 0" class="bg-vault-card border border-vault-border rounded-xl p-4">
        <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Log Sesi Hari Ini</p>
        <div class="space-y-2">
          <div
            v-for="s in todaySessions"
            :key="s.id"
            class="flex items-center justify-between text-xs py-1.5 border-b border-vault-border last:border-0"
          >
            <div class="flex items-center gap-2">
              <span class="text-vault-muted">{{ formatTime(s.started_at) }}</span>
              <span class="text-vault-text font-medium">{{ s.duration_minutes }}m</span>
              <span class="text-vault-muted capitalize">{{ s.method }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FocusMethod, FocusSession } from '~/composables/useFocusSessions'

definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { fetchAllPending, tasks } = useTasks()
const { createSession, completeSession, deleteSession, fetchTodaySessions: fetchTodaySessionsApi, fetchSessionsRange, fetchTaskSessionCounts, fetchStreak } = useFocusSessions()
const { getCategoryColor } = useCategories()
const { show: showToast } = useToast()

// ── State ────────────────────────────────────────────────────────────────
const selectedMethod = ref<FocusMethod>('pomodoro')
const linkedTaskId = ref<string | null>(null)
const deadlineInput = ref('')
const timerState = ref<'idle' | 'running' | 'paused'>('idle')
const timerPhase = ref<'focus' | 'break'>('focus')
const isLongBreak = ref(false)
const secondsRemaining = ref(0)
const secondsElapsed = ref(0)
const totalFocusMinutes = ref(0)
const pomodoroSessionNum = ref(0)
const currentSessionId = ref<string | null>(null)
const sessionStartedAt = ref<string | null>(null)
let timerInterval: ReturnType<typeof setInterval> | null = null

// Stats
const todaySessions = ref<FocusSession[]>([])
const streak = ref(0)
const weeklyData = ref<{ label: string; minutes: number; barHeight: number }[]>([])
const weeklyMaxMinutes = ref(0)
const taskSessionList = ref<{ taskId: string; text: string; cat: string | null; count: number }[]>([])

// Ambient
const showAmbient = ref(false)
const activeSound = ref<string | null>(null)
const ambientVolume = ref(50)
const ambientSupported = ref(false)
let audioElement: HTMLAudioElement | null = null

// ── Methods config ───────────────────────────────────────────────────────
const methods = [
  { key: 'pomodoro' as FocusMethod, icon: '🍅', label: 'Pomodoro', desc: '25/5 min' },
  { key: '52/17' as FocusMethod, icon: '⏱️', label: '52/17', desc: '52 focus, 17 break' },
  { key: '90min' as FocusMethod, icon: '🧱', label: '90 Min', desc: '90 focus, 20 break' },
  { key: 'flowtime' as FocusMethod, icon: '🌊', label: 'Flowtime', desc: 'Berhenti saat lelah' },
  { key: 'deadline' as FocusMethod, icon: '⏳', label: 'Deadline', desc: 'Countdown ke target' },
]

const ambientSounds = [
  { key: 'rain', icon: '🌧️', label: 'Hujan', url: 'https://cdn.freesound.org/previews/531/531947_6468493-lq.mp3' },
  { key: 'fire', icon: '🔥', label: 'Api', url: 'https://cdn.freesound.org/previews/277/277021_5143977-lq.mp3' },
  { key: 'wind', icon: '🌬️', label: 'Angin', url: 'https://cdn.freesound.org/previews/456/456058_2718748-lq.mp3' },
]

const methodConfigs: Record<string, { focus: number; shortBreak: number; longBreak?: number; longBreakInterval?: number }> = {
  'pomodoro': { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60, longBreakInterval: 4 },
  '52/17': { focus: 52 * 60, shortBreak: 17 * 60 },
  '90min': { focus: 90 * 60, shortBreak: 20 * 60 },
}

// ── Computed ─────────────────────────────────────────────────────────────
const pendingTasks = computed(() => tasks.value.filter((t: any) => !t.done))

const linkedTask = computed(() => {
  if (!linkedTaskId.value) return null
  return pendingTasks.value.find((t: any) => t.id === linkedTaskId.value) || null
})

const currentMethodIcon = computed(() => methods.find(m => m.key === selectedMethod.value)?.icon || '')
const currentMethodLabel = computed(() => methods.find(m => m.key === selectedMethod.value)?.label || '')

const displayTime = computed(() => {
  const isCountUp = selectedMethod.value === 'flowtime'
  const secs = isCountUp ? secondsElapsed.value : secondsRemaining.value
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
})

const todayStats = computed(() => {
  let totalMinutes = 0
  for (const s of todaySessions.value) totalMinutes += s.duration_minutes
  return { totalMinutes, sessions: todaySessions.value.length }
})

// ── Timer logic ──────────────────────────────────────────────────────────
const startTimer = async () => {
  const now = new Date()
  sessionStartedAt.value = now.toISOString()
  pomodoroSessionNum.value = 1
  totalFocusMinutes.value = 0
  timerPhase.value = 'focus'
  isLongBreak.value = false

  if (selectedMethod.value === 'flowtime') {
    secondsElapsed.value = 0
  } else if (selectedMethod.value === 'deadline') {
    const target = new Date(deadlineInput.value)
    const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
    if (diff <= 0) {
      showToast('Deadline sudah lewat!')
      return
    }
    secondsRemaining.value = diff
  } else {
    const cfg = methodConfigs[selectedMethod.value]
    secondsRemaining.value = cfg?.focus ?? 25 * 60
  }

  // Create DB session
  const session = await createSession({
    method: selectedMethod.value,
    task_id: linkedTaskId.value,
    started_at: sessionStartedAt.value,
  })
  currentSessionId.value = session?.id || null

  timerState.value = 'running'
  startInterval()
}

const startInterval = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (selectedMethod.value === 'flowtime') {
      secondsElapsed.value++
    } else {
      secondsRemaining.value--
      if (secondsRemaining.value <= 0) {
        onTimerComplete()
      }
    }
  }, 1000)
}

const onTimerComplete = () => {
  if (timerInterval) clearInterval(timerInterval)

  if (timerPhase.value === 'focus') {
    // Focus phase ended → go to break
    const cfg = methodConfigs[selectedMethod.value]
    if (cfg) {
      const focusMins = Math.round(cfg.focus / 60)
      totalFocusMinutes.value += focusMins

      // Check long break for pomodoro
      if (selectedMethod.value === 'pomodoro' && cfg.longBreakInterval && pomodoroSessionNum.value % cfg.longBreakInterval === 0) {
        isLongBreak.value = true
        secondsRemaining.value = cfg.longBreak || 15 * 60
      } else {
        isLongBreak.value = false
        secondsRemaining.value = cfg.shortBreak
      }
      timerPhase.value = 'break'
      showToast('Waktu istirahat! 🎉')
      startInterval()
    } else {
      // Deadline method completed
      finishSession()
    }
  } else {
    // Break ended → start next focus
    timerPhase.value = 'focus'
    pomodoroSessionNum.value++
    const cfg = methodConfigs[selectedMethod.value]
    secondsRemaining.value = cfg?.focus ?? 25 * 60
    showToast('Ayo fokus lagi! 💪')
    startInterval()
  }
}

const pauseTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerState.value = 'paused'
}

const resumeTimer = () => {
  timerState.value = 'running'
  startInterval()
}

const finishFlowtime = () => {
  if (timerInterval) clearInterval(timerInterval)
  totalFocusMinutes.value = Math.round(secondsElapsed.value / 60)
  finishSession()
}

const stopTimer = () => {
  if (timerInterval) clearInterval(timerInterval)

  // Calculate focus minutes so far
  if (selectedMethod.value === 'flowtime') {
    totalFocusMinutes.value = Math.round(secondsElapsed.value / 60)
  } else if (timerPhase.value === 'focus') {
    const cfg = methodConfigs[selectedMethod.value]
    if (cfg) {
      const elapsed = cfg.focus - secondsRemaining.value
      totalFocusMinutes.value += Math.round(elapsed / 60)
    } else {
      // deadline
      totalFocusMinutes.value = Math.round((Date.now() - new Date(sessionStartedAt.value!).getTime()) / 60000)
    }
  }

  if (totalFocusMinutes.value >= 1) {
    finishSession()
  } else {
    // Less than 1 minute — discard
    if (currentSessionId.value) deleteSession(currentSessionId.value)
    resetTimer()
    showToast('Sesi dibatalkan')
  }
}

const finishSession = async () => {
  if (currentSessionId.value && totalFocusMinutes.value >= 1) {
    await completeSession(currentSessionId.value, totalFocusMinutes.value)
    showToast(`Sesi selesai! ${totalFocusMinutes.value} menit fokus 🎯`)
  }
  resetTimer()
  loadStats()
}

const resetTimer = () => {
  timerState.value = 'idle'
  timerPhase.value = 'focus'
  secondsRemaining.value = 0
  secondsElapsed.value = 0
  currentSessionId.value = null
  sessionStartedAt.value = null
  isLongBreak.value = false
}

// ── Ambient sound ────────────────────────────────────────────────────────
const toggleSound = (key: string) => {
  if (activeSound.value === key) {
    stopSound()
  } else {
    playSound(key)
  }
}

const playSound = (key: string) => {
  stopSound()
  const sound = ambientSounds.find(s => s.key === key)
  if (!sound) return
  try {
    audioElement = new Audio(sound.url)
    audioElement.loop = true
    audioElement.volume = ambientVolume.value / 100
    audioElement.play()
    activeSound.value = key
  } catch (e) {
    console.error('Failed to play ambient sound:', e)
  }
}

const stopSound = () => {
  if (audioElement) {
    audioElement.pause()
    audioElement.src = ''
    audioElement = null
  }
  activeSound.value = null
}

const setAmbientVolume = (val: number) => {
  ambientVolume.value = val
  if (audioElement) audioElement.volume = val / 100
}

// ── Helpers ──────────────────────────────────────────────────────────────
const stripHtml = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const formatTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

// ── Stats loading ────────────────────────────────────────────────────────
const loadStats = async () => {
  const sessions = await fetchTodaySessionsApi()
  todaySessions.value = sessions

  const s = await fetchStreak()
  streak.value = s

  // Weekly chart
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  const dayOfWeek = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const weekSessions = await fetchSessionsRange(weekStart.toISOString(), weekEnd.toISOString())
  const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const dayMinutes: number[] = [0, 0, 0, 0, 0, 0, 0]

  for (const ws of weekSessions) {
    const d = new Date(ws.started_at)
    let idx = d.getDay() - 1
    if (idx < 0) idx = 6
    dayMinutes[idx] += ws.duration_minutes
  }

  const maxM = Math.max(...dayMinutes, 1)
  weeklyMaxMinutes.value = maxM
  weeklyData.value = dayLabels.map((label, i) => ({
    label,
    minutes: dayMinutes[i]!,
    barHeight: Math.max(4, (dayMinutes[i]! / maxM) * 80),
  }))

  // Per-task session count
  const counts = await fetchTaskSessionCounts()
  const list: typeof taskSessionList.value = []
  for (const [taskId, count] of Object.entries(counts) as [string, number][]) {
    const task = pendingTasks.value.find((t: any) => t.id === taskId)
    list.push({
      taskId,
      text: task ? stripHtml(task.text) : 'Task dihapus',
      cat: task?.cat || null,
      count,
    })
  }
  list.sort((a, b) => b.count - a.count)
  taskSessionList.value = list.slice(0, 10)
}

// ── Lifecycle ────────────────────────────────────────────────────────────
onMounted(() => {
  ambientSupported.value = typeof Audio !== 'undefined'
})

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  stopSound()
})

watch(user, async (u) => {
  if (u) {
    await fetchAllPending()
    loadStats()
  }
}, { immediate: true })
</script>
