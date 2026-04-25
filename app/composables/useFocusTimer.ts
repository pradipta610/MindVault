// Global focus timer state + logic.
// All state lives at module level so it persists across route navigations.
// The component that renders the UI is just a view — it doesn't own the state.

import type { FocusMethod } from '~/composables/useFocusSessions'

const methodConfigs: Record<string, { focus: number; shortBreak: number; longBreak?: number; longBreakInterval?: number }> = {
  'pomodoro': { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60, longBreakInterval: 4 },
  '52/17':   { focus: 52 * 60, shortBreak: 17 * 60 },
  '90min':   { focus: 90 * 60, shortBreak: 20 * 60 },
}

// ── Module-level state (singleton — persists across navigations) ──────────
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

// Timer interval + toast callback are also module-level
let timerInterval: ReturnType<typeof setInterval> | null = null
let toastFn: ((msg: string, type?: 'success' | 'error' | 'info') => void) | null = null
let afterFinishCallback: (() => void) | null = null

export const useFocusTimer = () => {
  // Lazy-init dependencies (can only be called in component setup)
  const { createSession, completeSession, deleteSession } = useFocusSessions()
  const { show: showToast } = useToast()
  toastFn = showToast

  // ── Internal helpers ─────────────────────────────────────────────────
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
      const cfg = methodConfigs[selectedMethod.value]
      if (cfg) {
        const focusMins = Math.round(cfg.focus / 60)
        totalFocusMinutes.value += focusMins

        if (selectedMethod.value === 'pomodoro' && cfg.longBreakInterval && pomodoroSessionNum.value % cfg.longBreakInterval === 0) {
          isLongBreak.value = true
          secondsRemaining.value = cfg.longBreak || 15 * 60
        } else {
          isLongBreak.value = false
          secondsRemaining.value = cfg.shortBreak
        }
        timerPhase.value = 'break'
        toastFn?.('Waktu istirahat! 🎉')
        startInterval()
      } else {
        finishSession()
      }
    } else {
      timerPhase.value = 'focus'
      pomodoroSessionNum.value++
      const cfg = methodConfigs[selectedMethod.value]
      secondsRemaining.value = cfg?.focus ?? 25 * 60
      toastFn?.('Ayo fokus lagi! 💪')
      startInterval()
    }
  }

  const resetTimer = () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = null
    timerState.value = 'idle'
    timerPhase.value = 'focus'
    secondsRemaining.value = 0
    secondsElapsed.value = 0
    currentSessionId.value = null
    sessionStartedAt.value = null
    isLongBreak.value = false
    totalFocusMinutes.value = 0
    pomodoroSessionNum.value = 0
  }

  const finishSession = async () => {
    if (currentSessionId.value && totalFocusMinutes.value >= 1) {
      await completeSession(currentSessionId.value, totalFocusMinutes.value)
      toastFn?.(`Sesi selesai! ${totalFocusMinutes.value} menit fokus 🎯`)
    }
    resetTimer()
    afterFinishCallback?.()
  }

  // ── Public actions ───────────────────────────────────────────────────
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
        toastFn?.('Deadline sudah lewat!')
        return
      }
      secondsRemaining.value = diff
    } else {
      const cfg = methodConfigs[selectedMethod.value]
      secondsRemaining.value = cfg?.focus ?? 25 * 60
    }

    const session = await createSession({
      method: selectedMethod.value,
      task_id: linkedTaskId.value,
      started_at: sessionStartedAt.value,
    })
    currentSessionId.value = session?.id || null

    timerState.value = 'running'
    startInterval()
  }

  const pauseTimer = () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = null
    timerState.value = 'paused'
  }

  const resumeTimer = () => {
    timerState.value = 'running'
    startInterval()
  }

  const finishFlowtime = () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = null
    totalFocusMinutes.value = Math.round(secondsElapsed.value / 60)
    finishSession()
  }

  const stopTimer = () => {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = null

    if (selectedMethod.value === 'flowtime') {
      totalFocusMinutes.value = Math.round(secondsElapsed.value / 60)
    } else if (timerPhase.value === 'focus') {
      const cfg = methodConfigs[selectedMethod.value]
      if (cfg) {
        const elapsed = cfg.focus - secondsRemaining.value
        totalFocusMinutes.value += Math.round(elapsed / 60)
      } else {
        totalFocusMinutes.value = Math.round((Date.now() - new Date(sessionStartedAt.value!).getTime()) / 60000)
      }
    }

    if (totalFocusMinutes.value >= 1) {
      finishSession()
    } else {
      if (currentSessionId.value) deleteSession(currentSessionId.value)
      resetTimer()
      toastFn?.('Sesi dibatalkan')
    }
  }

  // Register callback that runs after finishSession (e.g. reload stats)
  const onAfterFinish = (cb: () => void) => {
    afterFinishCallback = cb
  }

  return {
    // state
    selectedMethod,
    linkedTaskId,
    deadlineInput,
    timerState,
    timerPhase,
    isLongBreak,
    secondsRemaining,
    secondsElapsed,
    totalFocusMinutes,
    pomodoroSessionNum,
    currentSessionId,
    sessionStartedAt,
    // actions
    startTimer,
    pauseTimer,
    resumeTimer,
    finishFlowtime,
    stopTimer,
    resetTimer,
    onAfterFinish,
    // config
    methodConfigs,
  }
}
