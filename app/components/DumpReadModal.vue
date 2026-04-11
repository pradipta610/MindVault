<template>
  <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />
    <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-vault-border">
        <div class="flex items-center gap-2 min-w-0">
          <span
            class="text-[11px] px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 shrink-0"
            :style="{ backgroundColor: getCategoryColor(note.tag) + '33', color: getCategoryColor(note.tag) }"
          >
            <span class="text-[10px]">{{ getCategoryIcon(note.tag) }}</span>
            {{ getCategoryLabel(note.tag) }}
          </span>
          <span class="text-[11px] text-vault-muted/60 truncate">{{ formatDate(note.created_at) }}</span>
        </div>
        <button @click="$emit('close')" class="text-vault-muted hover:text-vault-text transition-colors shrink-0 ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Images -->
        <div v-if="noteImages.length > 0" class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <img
            v-for="(img, i) in noteImages"
            :key="i"
            :src="img"
            class="h-36 rounded-lg object-cover cursor-pointer border border-vault-border hover:border-vault-accent/30 transition-colors shrink-0"
            @click="openLightbox(i)"
          />
        </div>

        <!-- Title -->
        <h3 v-if="note.title" class="font-serif text-xl text-vault-text leading-snug">
          {{ stripHtml(note.title) }}
        </h3>

        <!-- Raw content -->
        <div
          class="prose-read text-sm text-vault-text leading-relaxed"
          v-html="sanitizedContent"
        />

        <!-- Reminder -->
        <div v-if="note.reminder_at" class="flex items-center gap-2 text-xs text-vault-accent/80 bg-vault-accent/5 rounded-lg px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          {{ formatReminder(note.reminder_at) }}
        </div>

        <!-- AI Summary -->
        <div v-if="note.title || note.fokus || (note.poin && note.poin.length) || (note.action && note.action.length)" class="space-y-3 border-t border-vault-border pt-4">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-vault-accent" />
            <span class="text-xs font-semibold text-vault-accent uppercase tracking-wider">AI Summary</span>
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

      <!-- Action buttons -->
      <div class="p-4 border-t border-vault-border flex gap-2">
        <button
          @click="$emit('edit')"
          class="flex-1 bg-vault-accent text-vault-bg px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Edit
        </button>
        <button
          @click="$emit('delete')"
          class="bg-vault-bg border border-vault-border text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500/10 hover:border-red-400/30 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Hapus
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <ImageLightbox
      v-if="lightboxOpen"
      :images="noteImages"
      :start-index="lightboxIndex"
      @close="lightboxOpen = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'

const props = defineProps<{ note: any }>()
defineEmits(['close', 'edit', 'delete'])

const { getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const noteImages = computed(() => {
  // Legacy: images stored as separate array
  if (props.note.images && Array.isArray(props.note.images) && props.note.images.length > 0) {
    return props.note.images as string[]
  }
  return []
})

const hasInlineImages = computed(() => {
  return props.note.raw && /<img\s/.test(props.note.raw)
})

const sanitizedContent = computed(() => {
  if (!props.note.raw) return ''
  return import.meta.client ? DOMPurify.sanitize(props.note.raw, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'class'] }) : props.note.raw
})

const stripHtml = (html: string): string => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

const openLightbox = (index: number) => {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatReminder = (isoStr: string) => {
  const d = new Date(isoStr)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Hari ini ${time}`
  if (isTomorrow) return `Besok ${time}`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<style>
.prose-read p {
  margin: 0;
}
.prose-read p + p {
  margin-top: 0.5em;
}
.prose-read ul {
  list-style: disc;
  padding-left: 1.25em;
  margin: 0.25em 0;
}
.prose-read li {
  margin: 0.125em 0;
}
.prose-read li p {
  margin: 0;
}
.prose-read strong {
  font-weight: 700;
}
.prose-read em {
  font-style: italic;
}
.prose-read img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5em 0;
}
</style>
