<template>
  <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />
    <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">

      <div class="flex items-center justify-between p-4 border-b border-vault-border">
        <h3 class="font-serif text-xl text-vault-text">{{ task ? 'Edit Task' : 'Task Baru' }}</h3>
        <button @click="$emit('close')" class="text-vault-muted hover:text-vault-text transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">

        <!-- Existing images -->
        <div v-if="existingImages.length > 0">
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div v-for="(img, i) in existingImages" :key="'ex-' + i" class="relative shrink-0 group/img">
              <img :src="img" class="w-28 h-28 object-cover rounded-lg cursor-pointer border border-vault-border" loading="lazy" />
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

        <!-- Pending image previews -->
        <div v-if="pendingPreviews.length > 0">
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div v-for="(preview, i) in pendingPreviews" :key="'new-' + i" class="relative shrink-0 group/img">
              <img :src="preview" class="w-28 h-28 object-cover rounded-lg border border-vault-accent/30" />
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

        <!-- Category selector -->
        <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
          <button
            v-for="t in tags"
            :key="t"
            @click="selectedCat = t"
            class="px-3 py-1 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1"
            :class="selectedCat === t ? 'border-transparent' : 'bg-transparent border-vault-border text-vault-muted hover:text-vault-text'"
            :style="selectedCat === t ? { backgroundColor: getCategoryColor(t) + '33', color: getCategoryColor(t) } : {}"
          >
            <span class="text-[10px]">{{ getCategoryIcon(t) }}</span>
            {{ t }}
          </button>
        </div>

        <!-- Rich text editor -->
        <TiptapEditor v-model="rawText" placeholder="Isi task..." />

        <!-- Date section -->
        <div>
          <label class="block text-xs text-vault-muted mb-2">Tanggal</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <button
              @click="selectedDate = todayStr"
              class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              :class="selectedDate === todayStr ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent' : 'bg-vault-bg border-vault-border text-vault-muted hover:text-vault-text'"
            >Hari ini</button>
            <button
              @click="selectedDate = tomorrowStr"
              class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              :class="selectedDate === tomorrowStr ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent' : 'bg-vault-bg border-vault-border text-vault-muted hover:text-vault-text'"
            >Besok</button>
          </div>
          <input
            type="date"
            v-model="selectedDate"
            class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
        </div>

        <!-- Deadline datetime (optional) -->
        <div class="border-t border-vault-border pt-4">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-vault-muted font-medium flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Deadline (opsional)
            </label>
            <button v-if="deadlineAt" @click="deadlineAt = ''" class="text-[11px] text-red-400/70 hover:text-red-400 transition-colors">Hapus</button>
          </div>
          <input
            type="datetime-local"
            v-model="deadlineAt"
            class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
          <p v-if="deadlineAt" class="text-[11px] text-vault-muted mt-1.5">Notifikasi pengingat akan dikirim pada waktu ini.</p>
        </div>

      </div>

      <div class="p-4 border-t border-vault-border flex gap-2">
        <button
          @click="triggerFileInput"
          :disabled="totalImageCount >= 4"
          class="bg-vault-bg border border-vault-border text-vault-muted px-3 py-2.5 rounded-lg text-sm hover:text-vault-text hover:border-vault-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          title="Tambah foto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21ZM8.25 8.625a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
          </svg>
        </button>
        <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="handleFileSelect" />
        <button
          @click="save"
          :disabled="!rawText.trim() && pendingFiles.length === 0 && existingImages.length === 0"
          class="flex-1 bg-vault-accent text-vault-bg px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
        >Simpan</button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  task: any
  initialText?: string
  initialCat?: string
  initialDate?: string
  initialImages?: string[]
}>()

const emit = defineEmits(['close', 'save'])

const { categoryNames, getCategoryColor, getCategoryIcon } = useCategories()
const tags = categoryNames

const todayStr = new Date().toISOString().split('T')[0]
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

const rawText = ref(props.task?.text || props.initialText || '')
const selectedCat = ref(props.task?.cat || props.initialCat || categoryNames.value[0] || '')
const selectedDate = ref(props.task?.date || props.initialDate || todayStr)

const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const deadlineAt = ref(toLocalInput(props.task?.deadline_at))

const existingImages = ref<string[]>([...(props.task?.images || props.initialImages || [])])
const removedImages = ref<string[]>([])
const pendingFiles = ref<File[]>([])
const pendingPreviews = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const totalImageCount = computed(() => existingImages.value.length + pendingFiles.value.length)

const triggerFileInput = () => fileInput.value?.click()

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const remaining = 4 - totalImageCount.value
  const files = Array.from(input.files).slice(0, remaining)
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    pendingFiles.value.push(file)
    pendingPreviews.value.push(URL.createObjectURL(file))
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

const save = () => {
  if (!rawText.value.trim() && pendingFiles.value.length === 0 && existingImages.value.length === 0) return
  emit('save', {
    text: rawText.value,
    cat: selectedCat.value,
    date: selectedDate.value,
    pendingFiles: pendingFiles.value,
    existingImages: existingImages.value,
    removedImages: removedImages.value,
    deadlineAt: deadlineAt.value ? new Date(deadlineAt.value).toISOString() : null,
  })
}

onBeforeUnmount(() => {
  pendingPreviews.value.forEach(url => URL.revokeObjectURL(url))
})
</script>
