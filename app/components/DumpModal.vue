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
        <!-- Existing images (edit mode) -->
        <div v-if="existingImages.length > 0">
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div v-for="(img, i) in existingImages" :key="'ex-' + i" class="relative shrink-0 group/img">
              <img
                :src="img"
                class="w-28 h-28 object-cover rounded-lg cursor-pointer border border-vault-border"
                @click="openLightbox(i, 'existing')"
              />
              <button
                @click="removeExistingImage(i)"
                class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- New image previews -->
        <div v-if="pendingPreviews.length > 0">
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div v-for="(preview, i) in pendingPreviews" :key="'new-' + i" class="relative shrink-0 group/img">
              <img
                :src="preview"
                class="w-28 h-28 object-cover rounded-lg border border-vault-accent/30"
              />
              <button
                @click="removePendingImage(i)"
                class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <div class="absolute bottom-1 left-1 bg-vault-accent/80 text-vault-bg text-[9px] px-1.5 py-0.5 rounded font-medium">Baru</div>
            </div>
          </div>
        </div>

        <!-- Upload progress -->
        <div v-if="uploading" class="flex items-center gap-3 bg-vault-bg rounded-lg p-3">
          <div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin shrink-0" />
          <div class="flex-1">
            <p class="text-xs text-vault-muted mb-1">Mengupload foto...</p>
            <div class="w-full bg-vault-border rounded-full h-1.5">
              <div class="bg-vault-accent h-1.5 rounded-full transition-all" :style="{ width: uploadProgress + '%' }" />
            </div>
          </div>
        </div>

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

        <textarea
          v-model="rawText"
          placeholder="Tulis apa aja yang ada di pikiran..."
          class="w-full bg-vault-bg border border-vault-border rounded-xl p-3 text-vault-text text-sm placeholder:text-vault-muted/50 resize-none focus:outline-none focus:border-vault-accent/30 transition-colors"
          rows="6"
          autofocus
        />

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
          @click="triggerFileInput"
          :disabled="totalImageCount >= 4 || uploading"
          class="bg-vault-bg border border-vault-border text-vault-muted px-3 py-2.5 rounded-lg text-sm hover:text-vault-text hover:border-vault-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          title="Tambah foto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21ZM8.25 8.625a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
          </svg>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />
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
          :disabled="(!rawText.trim() && pendingFiles.length === 0 && existingImages.length === 0) || uploading"
          class="flex-1 bg-vault-accent text-vault-bg px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
        >
          Save
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <ImageLightbox
      v-if="lightboxOpen"
      :images="lightboxImages"
      :start-index="lightboxIndex"
      @close="lightboxOpen = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  note: any
  initialRaw?: string
  initialTag?: string
}>()

const emit = defineEmits(['close', 'save', 'process'])

const { categoryNames, hasCategories, getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()
const { uploading, uploadProgress, uploadImages, deleteImage } = useNoteImages()
const { show: showToast } = useToast()
const tags = categoryNames
const rawText = ref(props.note?.raw || props.initialRaw || '')
const selectedTag = ref(props.note?.tag || props.initialTag || categoryNames.value[0] || '')
const processing = ref(false)

const existingImages = ref<string[]>([...(props.note?.images || [])])
const removedImages = ref<string[]>([])
const pendingFiles = ref<File[]>([])
const pendingPreviews = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const lightboxOpen = ref(false)
const lightboxImages = ref<string[]>([])
const lightboxIndex = ref(0)

const totalImageCount = computed(() => existingImages.value.length + pendingFiles.value.length)

const { anthropicKey } = useSettings()
const hasApiKey = computed(() => !!anthropicKey.value)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return

  const remaining = 4 - totalImageCount.value
  const files = Array.from(input.files).slice(0, remaining)

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    pendingFiles.value.push(file)
    const url = URL.createObjectURL(file)
    pendingPreviews.value.push(url)
  }

  input.value = ''
}

const removePendingImage = (index: number) => {
  URL.revokeObjectURL(pendingPreviews.value[index]!)
  pendingFiles.value.splice(index, 1)
  pendingPreviews.value.splice(index, 1)
}

const removeExistingImage = (index: number) => {
  const url = existingImages.value[index]!
  removedImages.value.push(url)
  existingImages.value.splice(index, 1)
}

const openLightbox = (index: number, source: 'existing' | 'pending') => {
  if (source === 'existing') {
    lightboxImages.value = [...existingImages.value]
    lightboxIndex.value = index
  }
  lightboxOpen.value = true
}

const save = () => {
  if (!rawText.value.trim() && pendingFiles.value.length === 0 && existingImages.value.length === 0) return
  emit('save', {
    raw: rawText.value,
    tag: selectedTag.value,
    pendingFiles: pendingFiles.value,
    existingImages: existingImages.value,
    removedImages: removedImages.value,
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

onBeforeUnmount(() => {
  pendingPreviews.value.forEach(url => URL.revokeObjectURL(url))
})
</script>
