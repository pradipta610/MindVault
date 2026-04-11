<template>
  <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />
    <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-vault-border">
        <h3 class="font-serif text-xl text-vault-text">
          {{ note ? 'Edit Note' : 'New Dump' }}
        </h3>
        <button @click="$emit('close')" class="text-vault-muted hover:text-vault-text transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
          <button
            v-for="t in tags"
            :key="t"
            @click="selectedTag = t"
            class="px-3 py-1 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1"
            :class="selectedTag === t
              ? 'border-transparent'
              : 'bg-transparent border-vault-border text-vault-muted hover:text-vault-text'"
            :style="selectedTag === t ? { backgroundColor: getCategoryColor(t) + '33', color: getCategoryColor(t) } : {}"
          >
            <span class="text-[10px]">{{ getCategoryIcon(t) }}</span>
            {{ t }}
          </button>
        </div>
        <div v-else class="flex items-center gap-2 text-xs text-vault-muted">
          <span>📂</span>
          <span>Belum ada kategori.</span>
          <NuxtLink to="/settings" class="text-vault-accent hover:underline" @click="$emit('close')">Tambah di Settings</NuxtLink>
        </div>

        <TiptapEditor
          v-model="rawText"
          placeholder="Tulis apa aja yang ada di pikiran..."
          :on-image-upload="handleImageUpload"
        />

        <!-- Reminder datetime -->
        <div class="border-t border-vault-border pt-4">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-vault-muted font-medium flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              Reminder &amp; To-do
            </label>
            <button v-if="reminderAt" @click="reminderAt = ''" class="text-[11px] text-red-400/70 hover:text-red-400 transition-colors">Hapus</button>
          </div>
          <input
            type="datetime-local"
            v-model="reminderAt"
            class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
          <p class="text-[11px] text-vault-muted mt-1.5">Jika diset, note otomatis masuk To-do pada tanggal ini dan notifikasi akan dikirim.</p>
        </div>

        <div v-if="note && note.title" class="space-y-3 border-t border-vault-border pt-4">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-vault-accent" />
            <span class="text-xs font-semibold text-vault-accent uppercase tracking-wider">AI Summary</span>
          </div>

          <div v-if="note.title" class="bg-vault-bg rounded-lg p-3">
            <p class="text-xs text-vault-muted mb-1">Judul</p>
            <p class="text-sm text-vault-text font-medium">{{ note.title }}</p>
          </div>

          <div v-if="note.fokus" class="bg-vault-bg rounded-lg p-3">
            <p class="text-xs text-vault-muted mb-1">Fokus</p>
            <p class="text-sm text-vault-accent italic">{{ note.fokus }}</p>
          </div>

          <div v-if="note.poin && note.poin.length" class="bg-vault-bg rounded-lg p-3">
            <p class="text-xs text-vault-muted mb-2">Poin Utama</p>
            <ul class="space-y-1">
              <li v-for="(p, i) in note.poin" :key="i" class="text-sm text-vault-text flex gap-2">
                <span class="text-vault-accent shrink-0">•</span>
                {{ p }}
              </li>
            </ul>
          </div>

          <div v-if="note.action && note.action.length" class="bg-vault-bg rounded-lg p-3">
            <p class="text-xs text-vault-muted mb-2">Action Items</p>
            <ul class="space-y-1">
              <li v-for="(a, i) in note.action" :key="i" class="text-sm text-vault-text flex gap-2">
                <span class="text-vault-accent shrink-0">→</span>
                {{ a }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-vault-border flex gap-2">
        <button
          v-if="note"
          @click="processWithAI"
          :disabled="processing || !hasApiKey"
          class="flex-1 bg-vault-bg border border-vault-accent/30 text-vault-accent px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-vault-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="processing" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ processing ? 'Processing...' : 'AI Process' }}
        </button>
        <button
          @click="save"
          :disabled="!hasContent"
          class="flex-1 bg-vault-accent text-vault-bg px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  note: any
  initialRaw?: string
  initialTag?: string
}>()

const emit = defineEmits(['close', 'save', 'process'])

const { categoryNames, getCategoryColor, getCategoryIcon } = useCategories()
const { uploadInlineImage } = useNoteImages()
const tags = categoryNames
const rawText = ref(props.note?.raw || props.initialRaw || '')
const selectedTag = ref(props.note?.tag || props.initialTag || categoryNames.value[0] || '')
const processing = ref(false)

const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const reminderAt = ref(toLocalInput(props.note?.reminder_at))

const { anthropicKey } = useSettings()
const hasApiKey = computed(() => !!anthropicKey.value)

const hasContent = computed(() => {
  const stripped = rawText.value.replace(/<[^>]*>/g, '').trim()
  const hasImages = /<img\s/.test(rawText.value)
  return stripped.length > 0 || hasImages
})

const handleImageUpload = async (file: File): Promise<string> => {
  return await uploadInlineImage(file)
}

const save = () => {
  if (!hasContent.value) return
  emit('save', {
    raw: rawText.value,
    tag: selectedTag.value,
    reminderAt: reminderAt.value ? new Date(reminderAt.value).toISOString() : null,
  })
}

const processWithAI = async () => {
  if (!props.note || !anthropicKey.value) return
  processing.value = true
  try {
    const result = await $fetch('/api/ai-process', {
      method: 'POST',
      body: {
        raw: rawText.value,
        apiKey: anthropicKey.value,
      },
    })
    emit('process', { id: props.note.id, result })
  } catch (e) {
    console.error('AI processing failed:', e)
    alert('AI processing failed. Check your API key.')
  } finally {
    processing.value = false
  }
}
</script>
