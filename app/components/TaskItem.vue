<template>
  <div
    class="flex items-center gap-3 bg-vault-card border border-vault-border rounded-xl px-3 sm:px-4 py-3 group hover:border-vault-accent/20 transition-all"
  >
    <button
      @click="$emit('toggle')"
      class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
      :class="task.done
        ? 'bg-vault-accent border-vault-accent'
        : 'border-vault-muted hover:border-vault-accent'"
    >
      <svg
        v-if="task.done"
        xmlns="http://www.w3.org/2000/svg"
        class="w-3 h-3 text-vault-bg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </button>

    <div class="flex-1 min-w-0">
      <p
        class="text-sm leading-snug"
        :class="task.done ? 'text-vault-muted line-through' : 'text-vault-text'"
      >
        {{ task.text }}
      </p>
      <div class="flex items-center gap-2 mt-1">
        <span
          class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-0.5"
          :style="{ backgroundColor: getCategoryColor(task.cat) + '33', color: getCategoryColor(task.cat) }"
        >
          <span class="text-[9px]">{{ getCategoryIcon(task.cat) }}</span>
          {{ getCategoryLabel(task.cat) }}
        </span>
        <span
          v-if="task.rolled_from"
          class="text-[10px] text-amber-500/70 flex items-center gap-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
          dari {{ task.rolled_from }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-1 shrink-0">
      <button
        @click="$emit('toNote')"
        class="sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-vault-accent transition-all"
        title="Jadikan note"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </button>
      <button
        @click="$emit('delete')"
        class="sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ task: any }>()
defineEmits(['toggle', 'delete', 'toNote'])
const { getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()
</script>
