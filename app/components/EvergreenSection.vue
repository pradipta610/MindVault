<template>
  <div v-if="tasks.length > 0 || archivedTasks.length > 0" class="mb-4 bg-vault-card border border-vault-border rounded-xl overflow-hidden">
    <div class="px-4 py-2.5 border-b border-vault-border flex items-center justify-between">
      <span class="text-xs font-medium text-vault-muted flex items-center gap-1.5">
        📌 Evergreen
      </span>
      <button
        v-if="archivedTasks.length > 0"
        @click="archivedExpanded = !archivedExpanded; $emit('load-archived')"
        class="text-[11px] text-vault-muted hover:text-vault-accent transition-colors"
      >Diarsipkan ({{ archivedTasks.length }})</button>
    </div>

    <div v-if="tasks.length === 0" class="px-4 py-3 text-xs text-vault-muted">Belum ada task evergreen.</div>

    <div
      v-for="task in tasks"
      :key="task.id"
      class="px-4 py-2.5 border-b border-vault-border last:border-b-0 flex items-center gap-3 hover:bg-vault-bg/40 transition-colors group"
    >
      <button
        @click.stop="$emit('toggle-done', task.id)"
        class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
        :class="isDoneToday(task) ? 'bg-vault-accent border-vault-accent' : 'border-vault-muted hover:border-vault-accent'"
      >
        <svg v-if="isDoneToday(task)" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </button>

      <p
        class="flex-1 min-w-0 text-sm text-vault-text truncate cursor-pointer"
        :class="{ 'line-through text-vault-muted': isDoneToday(task) }"
        @click="$emit('edit', task)"
      >{{ plainText(task.text) }}</p>

      <span
        class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5 shrink-0"
        :style="{ backgroundColor: getCategoryColor(task.cat) + '33', color: getCategoryColor(task.cat) }"
      >
        <span class="text-[9px]">{{ getCategoryIcon(task.cat) }}</span>
        {{ task.cat || 'uncategorized' }}
      </span>

      <!-- Mobile: "..." menu -->
      <button
        @click.stop="openActionsFor = task"
        class="sm:hidden w-[36px] h-[36px] -mr-1 flex items-center justify-center text-vault-muted hover:text-vault-text transition-colors shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>

      <!-- Desktop: hover icons -->
      <div class="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button @click.stop="$emit('edit', task)" title="Edit" class="w-6 h-6 rounded flex items-center justify-center text-vault-muted hover:text-vault-accent hover:bg-vault-accent/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
        </button>
        <button @click.stop="$emit('convert', task)" title="Jadikan task biasa" class="w-6 h-6 rounded flex items-center justify-center text-vault-muted hover:text-vault-accent hover:bg-vault-accent/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75h1.5m9 0h-9" />
          </svg>
        </button>
        <button @click.stop="$emit('archive', task)" title="Arsipkan" class="w-6 h-6 rounded flex items-center justify-center text-vault-muted hover:text-red-400 hover:bg-red-400/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Archived evergreen tasks -->
    <template v-if="archivedExpanded">
      <div v-for="task in archivedTasks" :key="task.id" class="px-4 py-2.5 border-t border-vault-border flex items-center gap-3 opacity-60">
        <p class="flex-1 min-w-0 text-sm text-vault-muted truncate">{{ plainText(task.text) }}</p>
        <button @click.stop="$emit('unarchive', task)" class="text-[11px] text-vault-accent hover:underline shrink-0">Aktifkan</button>
      </div>
    </template>

    <ActionSheet
      v-if="openActionsFor"
      :actions="actionItems"
      @close="openActionsFor = null"
      @select="handleActionSelect"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tasks: any[]; archivedTasks: any[] }>()
const emit = defineEmits<{
  (e: 'toggle-done', taskId: string): void
  (e: 'edit', task: any): void
  (e: 'archive', task: any): void
  (e: 'unarchive', task: any): void
  (e: 'convert', task: any): void
  (e: 'load-archived'): void
}>()

const { getCategoryColor, getCategoryIcon } = useCategories()

const archivedExpanded = ref(false)
const openActionsFor = ref<any>(null)

const todayStr = () => new Date().toISOString().split('T')[0]
const isDoneToday = (task: any) => task.last_done_date === todayStr()

const plainText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const actionItems = [
  { id: 'edit', label: 'Edit Task', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>' },
  { id: 'convert', label: 'Jadikan Task Biasa', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75h1.5m9 0h-9" /></svg>' },
  { id: 'archive', label: 'Arsipkan', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>', destructive: true },
]

const handleActionSelect = (id: string) => {
  const task = openActionsFor.value
  openActionsFor.value = null
  if (!task) return
  if (id === 'edit') emit('edit', task)
  else if (id === 'convert') emit('convert', task)
  else if (id === 'archive') emit('archive', task)
}
</script>
