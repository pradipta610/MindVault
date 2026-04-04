<template>
  <div
    @click="$emit('click')"
    class="bg-vault-card border border-vault-border rounded-xl p-4 cursor-pointer hover:border-vault-accent/20 transition-all group relative"
  >
    <div class="flex items-start justify-between gap-3 mb-2">
      <h3 class="font-medium text-vault-text text-sm leading-snug flex-1" v-html="highlight(note.title || truncateRaw(note.raw))" />
      <div class="flex items-center gap-2 shrink-0">
        <span
          class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5"
          :style="{ backgroundColor: getCategoryColor(note.tag) + '33', color: getCategoryColor(note.tag) }"
        >
          <span class="text-[9px]">{{ getCategoryIcon(note.tag) }}</span>
          {{ getCategoryLabel(note.tag) }}
        </span>
        <button
          @click.stop="$emit('transfer')"
          class="sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-vault-accent transition-all"
          title="Jadikan task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
        <button
          @click.stop="confirmDelete"
          class="sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>

    <p class="text-vault-muted text-xs line-clamp-2 mb-3" v-html="highlight(note.raw)" />

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

    <div class="text-[10px] text-vault-muted/60">
      {{ formatDate(note.created_at) }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ note: any; searchQuery?: string }>()
const emit = defineEmits(['click', 'delete', 'transfer'])
const { getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()

const confirmDelete = () => {
  if (confirm('Yakin mau hapus note ini?')) {
    emit('delete')
  }
}

const truncateRaw = (raw: string) => {
  return raw.length > 60 ? raw.substring(0, 60) + '...' : raw
}

const escapeHtml = (str: string) => {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const highlight = (text: string) => {
  if (!text) return ''
  const safe = escapeHtml(text)
  if (!props.searchQuery?.trim()) return safe
  const escaped = props.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return safe.replace(regex, '<mark class="bg-vault-accent/30 text-vault-text rounded px-0.5">$1</mark>')
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
</script>
