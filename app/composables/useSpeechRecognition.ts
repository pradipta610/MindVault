const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null

export const useSpeechRecognition = () => {
  const isSupported = !!SpeechRecognition
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')

  let recognition: any = null

  const start = (lang = 'id-ID') => {
    if (!isSupported || isListening.value) return
    recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e: any) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      transcript.value = final
      interimTranscript.value = interim
    }

    recognition.onerror = (e: any) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        console.warn('SpeechRecognition error:', e.error)
      }
      isListening.value = false
    }

    recognition.onend = () => {
      isListening.value = false
    }

    transcript.value = ''
    interimTranscript.value = ''
    isListening.value = true
    recognition.start()
  }

  const stop = () => {
    if (recognition && isListening.value) {
      recognition.stop()
    }
    isListening.value = false
  }

  const toggle = (lang = 'id-ID') => {
    if (isListening.value) stop()
    else start(lang)
  }

  const fullTranscript = computed(() =>
    (transcript.value + ' ' + interimTranscript.value).trim()
  )

  onBeforeUnmount(() => {
    if (recognition) {
      try { recognition.abort() } catch {}
    }
  })

  return { isSupported, isListening, transcript, interimTranscript, fullTranscript, start, stop, toggle }
}
