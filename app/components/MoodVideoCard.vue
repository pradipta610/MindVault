<template>
  <div class="bg-vault-bg border border-vault-border rounded-lg p-3 flex flex-col">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-base">{{ emoji }}</span>
      <span class="text-xs font-semibold text-vault-text">{{ label }}</span>
    </div>

    <!-- Preview area -->
    <div class="relative aspect-video bg-black/30 rounded-md overflow-hidden mb-2 flex items-center justify-center">
      <video
        v-if="currentUrl && !isGif"
        :src="currentUrl"
        autoplay
        loop
        muted
        playsinline
        class="w-full h-full object-cover"
      />
      <img
        v-else-if="currentUrl && isGif"
        :src="currentUrl"
        class="w-full h-full object-cover"
      />
      <span v-else class="text-xs text-vault-muted/60">Belum ada media</span>

      <div
        v-if="loading"
        class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center px-2"
      >
        <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin mb-2" />
        <p class="text-[10px] text-vault-text">{{ progressMsg }}</p>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="video/mp4,video/webm,image/gif"
      class="hidden"
      @change="onFileChosen"
    />

    <div class="flex gap-2">
      <button
        @click="triggerFilePick"
        :disabled="loading"
        class="flex-1 bg-vault-accent text-vault-bg px-2 py-1.5 rounded-md text-[11px] font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-40"
      >
        {{ currentUrl ? 'Ganti' : 'Upload' }}
      </button>
      <button
        v-if="currentUrl"
        @click="handleClear"
        :disabled="loading"
        class="px-2 py-1.5 rounded-md text-[11px] font-medium text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors disabled:opacity-40"
      >
        Hapus
      </button>
    </div>

    <p v-if="errorMsg" class="mt-2 text-[10px] text-red-400">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
type MoodMode = 'working' | 'resting'

const props = defineProps<{
  mode: MoodMode
  label: string
  emoji: string
}>()

const { moodWorkingUrl, moodRestingUrl, loadMoodUrls, uploadAndSave, clearMoodUrl } = useMoodVideos()
const { show: showToast } = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const progressMsg = ref('')
const errorMsg = ref('')

const currentUrl = computed(() =>
  props.mode === 'working' ? moodWorkingUrl.value : moodRestingUrl.value
)

const isGif = computed(() => {
  const url = currentUrl.value
  return !!url && /\.gif(\?|$)/i.test(url)
})

onMounted(() => {
  loadMoodUrls()
})

const triggerFilePick = () => {
  errorMsg.value = ''
  fileInput.value?.click()
}

const onFileChosen = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Reset input so same file can be reselected later
  target.value = ''

  // Validate file size (max 10MB to avoid slow uploads)
  const maxBytes = 10 * 1024 * 1024
  if (file.size > maxBytes) {
    errorMsg.value = `File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`
    return
  }

  loading.value = true
  errorMsg.value = ''
  progressMsg.value = 'Uploading...'

  try {
    await uploadAndSave(file, props.mode)
    showToast(`${props.label} berhasil di-upload!`)
  } catch (err: any) {
    const msg = err?.message || String(err)
    errorMsg.value = msg.length > 120 ? msg.slice(0, 120) + '...' : msg
    showToast('Gagal upload', 'error')
  } finally {
    loading.value = false
    progressMsg.value = ''
  }
}

const handleClear = async () => {
  if (!confirm(`Hapus ${props.label}?`)) return
  try {
    await clearMoodUrl(props.mode)
    showToast('Video dihapus')
  } catch (err: any) {
    showToast('Gagal menghapus', 'error')
  }
}
</script>
