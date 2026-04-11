<template>
  <div
    class="bg-vault-card border border-vault-border rounded-xl overflow-hidden hover:border-vault-accent/20 group relative shadow-sm"
    :style="{ transition: 'box-shadow 0.4s ease, background-color 0.3s ease, border-color 0.3s ease' }"
  >
    <!-- Single thumbnail preview — click opens lightbox -->
    <div v-if="noteImages.length > 0" class="relative cursor-pointer" @click.stop="lightboxOpen = true">
      <img
        :src="noteImages[0]"
        class="w-full h-40 object-cover"
        loading="lazy"
      />
      <div v-if="noteImages.length > 1" class="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full font-medium">
        1/{{ noteImages.length }}
      </div>
    </div>

    <div class="p-4 cursor-pointer" @click="$emit('click')">
      <div class="flex items-start justify-between gap-3 mb-2">
        <h3 class="font-medium text-vault-text text-sm leading-snug flex-1" v-html="highlight(stripHtml(note.title || note.raw), true)" />
        <div class="flex items-center gap-2 shrink-0">
          <span
            class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5"
            :style="{ backgroundColor: getCategoryColor(note.tag) + '33', color: getCategoryColor(note.tag) }"
          >
            <span class="text-[9px]">{{ getCategoryIcon(note.tag) }}</span>
            {{ getCategoryLabel(note.tag) }}
          </span>
          <!-- Mobile: "..." trigger for action sheet -->
          <button
            @click.stop="showActions = true"
            class="sm:hidden w-[44px] h-[44px] -mr-2 flex items-center justify-center text-vault-muted hover:text-vault-text transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </button>
          <!-- Desktop: hover buttons -->
          <button
            @click.stop="$emit('transfer')"
            class="hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-vault-accent transition-all"
            title="Jadikan task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </button>
          <button
            @click.stop="confirmDelete"
            class="hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      <p class="text-vault-muted text-xs line-clamp-2 mb-3" v-html="highlight(stripHtml(note.raw))" />

      <div v-if="note.fokus" class="text-[11px] text-vault-accent/80 italic mb-2">
        {{ note.fokus }}
      </div>

      <div v-if="note.poin && note.poin.length" class="flex flex-wrap gap-1 mb-2">
        <span
          v-for="(p, i) in note.poin.slice(0, 3)"
          :key="i"
          class="text-[10px] bg-vault-bg px-2 py-0.5 rounded text-vault-muted"
        >
          {{ p }}
        </span>
        <span v-if="note.poin.length > 3" class="text-[10px] text-vault-muted">
          +{{ note.poin.length - 3 }}
        </span>
      </div>

      <div v-if="note.reminder_at" class="flex items-center gap-1 text-[11px] text-vault-accent/80 mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {{ formatReminder(note.reminder_at) }}
      </div>

      <div class="text-[10px] text-vault-muted/60">
        {{ formatDate(note.created_at) }}
      </div>
    </div>

    <ActionSheet
      v-if="showActions"
      :actions="actionItems"
      @close="showActions = false"
      @select="handleActionSelect"
    />

    <Teleport to="body">
      <ImageLightbox
        v-if="lightboxOpen"
        :images="noteImages"
        :start-index="0"
        @close="lightboxOpen = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'

const props = defineProps<{ note: any; searchQuery?: string }>()
const emit = defineEmits(['click', 'delete', 'transfer'])

const showActions = ref(false)
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth < 640
})

const actionItems = [
  { id: 'transfer', label: 'Jadikan Task', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>' },
  { id: 'delete', label: 'Hapus', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>', destructive: true },
]

const handleActionSelect = (id: string) => {
  showActions.value = false
  if (id === 'transfer') emit('transfer')
  else if (id === 'delete') confirmDelete()
}
const { getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()

const lightboxOpen = ref(false)

const noteImages = computed(() => {
  // Legacy: images stored as separate array
  if (props.note.images && Array.isArray(props.note.images) && props.note.images.length > 0) {
    return props.note.images as string[]
  }
  // New: extract inline images from HTML content
  if (props.note.raw) {
    const regex = /<img[^>]+src="([^"]+)"/g
    const urls: string[] = []
    let match
    while ((match = regex.exec(props.note.raw)) !== null) {
      if (match[1]) urls.push(match[1])
    }
    return urls
  }
  return []
})

const confirmDelete = () => {
  if (confirm('Yakin mau hapus note ini?')) {
    emit('delete')
  }
}

const stripHtml = (html: string): string => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

const truncateText = (text: string, len = 60) => {
  return text.length > len ? text.substring(0, len) + '...' : text
}

const escapeHtml = (str: string) => {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const highlight = (text: string, truncate = false) => {
  if (!text) return ''
  const plain = truncate ? truncateText(text) : text
  const safe = escapeHtml(plain)
  if (!props.searchQuery?.trim()) return safe
  const escaped = props.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const marked = safe.replace(regex, '<mark class="bg-vault-accent/30 text-vault-text rounded px-0.5">$1</mark>')
  return import.meta.client ? DOMPurify.sanitize(marked) : marked
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
