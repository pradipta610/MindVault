<template>
  <div
    class="bg-vault-card border border-vault-border rounded-xl overflow-hidden hover:border-vault-accent/20 group relative"
    :style="{ transition: 'box-shadow 0.4s ease, background-color 0.3s ease, border-color 0.3s ease' }"
  >
    <!-- Photo thumbnails — accordion expand -->
    <div v-if="taskImages.length > 0" class="relative">
      <div
        class="overflow-hidden"
        :style="{
          maxHeight: expandedIndex !== null ? '2000px' : '200px',
          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }"
      >
        <!-- Expanded single image -->
        <div v-if="expandedIndex !== null" @click.stop="expandedIndex = null" class="cursor-zoom-out">
          <img
            :src="taskImages[expandedIndex]"
            class="w-full object-contain max-h-[70vh] bg-black/5"
            loading="lazy"
          />
          <div class="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            Klik untuk tutup
          </div>
        </div>

        <!-- Collapsed thumbnails -->
        <template v-else>
          <div v-if="taskImages.length === 1" class="w-full cursor-zoom-in" @click.stop="expandedIndex = 0">
            <img :src="taskImages[0]" class="w-full h-40 object-cover" loading="lazy" />
          </div>
          <div v-else class="grid grid-cols-2 gap-0.5">
            <img
              v-for="(img, i) in taskImages.slice(0, 4)"
              :key="i"
              :src="img"
              class="w-full h-24 object-cover cursor-zoom-in hover:brightness-90"
              loading="lazy"
              @click.stop="expandedIndex = i"
            />
          </div>
          <div v-if="taskImages.length > 4" class="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            +{{ taskImages.length - 4 }}
          </div>
        </template>
      </div>
    </div>

    <div class="p-4 cursor-pointer" @click="$emit('click')">
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <!-- Done toggle -->
          <button
            @click.stop="$emit('toggle')"
            class="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
            :class="task.done ? 'bg-vault-accent border-vault-accent' : 'border-vault-muted hover:border-vault-accent'"
          >
            <svg v-if="task.done" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
          <!-- Text preview -->
          <h3
            class="font-medium text-vault-text text-sm leading-snug flex-1 line-clamp-2"
            :class="{ 'line-through text-vault-muted': task.done }"
            v-html="highlight(previewText)"
          />
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span
            class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5"
            :style="{ backgroundColor: getCategoryColor(task.cat) + '33', color: getCategoryColor(task.cat) }"
          >
            <span class="text-[9px]">{{ getCategoryIcon(task.cat) }}</span>
            {{ getCategoryLabel(task.cat) }}
          </span>
          <!-- Mobile: "..." trigger -->
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
            @click.stop="$emit('toNote')"
            class="hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-vault-accent transition-all"
            title="Jadikan note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </button>
          <button
            @click.stop="$emit('delete')"
            class="hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="task.rolled_from" class="text-[10px] text-amber-500/70 flex items-center gap-0.5 ml-8">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        dari {{ task.rolled_from }}
      </div>
    </div>

    <ActionSheet
      v-if="showActions"
      :actions="taskActionItems"
      @close="showActions = false"
      @select="handleActionSelect"
    />
  </div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'

const props = defineProps<{ task: any; searchQuery?: string }>()
const emit = defineEmits(['toggle', 'delete', 'toNote', 'click'])

const { getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()
const showActions = ref(false)
const expandedIndex = ref<number | null>(null)

const taskImages = computed(() => {
  if (!props.task.images || !Array.isArray(props.task.images)) return []
  return props.task.images as string[]
})

const previewText = computed(() => {
  const html = props.task.text || ''
  return html.replace(/<[^>]*>/g, '').trim()
})

const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const truncateText = (text: string, len = 80) =>
  text.length > len ? text.substring(0, len) + '...' : text

const highlight = (text: string) => {
  if (!text) return ''
  const safe = escapeHtml(truncateText(text))
  if (!props.searchQuery?.trim()) return safe
  const escaped = props.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return DOMPurify.sanitize(
    safe.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-vault-accent/30 text-vault-text rounded px-0.5">$1</mark>')
  )
}

const taskActionItems = [
  { id: 'toNote', label: 'Jadikan Note', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>' },
  { id: 'delete', label: 'Hapus', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>', destructive: true },
]

const handleActionSelect = (id: string) => {
  showActions.value = false
  if (id === 'toNote') emit('toNote')
  else if (id === 'delete') emit('delete')
}
</script>
