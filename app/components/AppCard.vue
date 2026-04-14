<template>
  <div
    class="group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/20 transition-colors cursor-pointer"
    draggable="true"
    @dragstart="onDragStart"
    @click="$emit('run')"
  >
    <div class="flex items-start justify-between gap-2 mb-2">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-vault-accent/10 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        </div>
        <h3 class="text-sm font-semibold text-vault-text truncate">{{ app.name }}</h3>
        <span v-if="app.share_token" class="text-[9px] px-1.5 py-0.5 rounded-full bg-vault-accent/10 text-vault-accent font-medium shrink-0" title="Shared">🔗</span>
      </div>
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" @click.stop>
        <button
          @click="$emit('share')"
          class="p-1.5 rounded-lg hover:bg-vault-bg text-vault-muted hover:text-vault-accent transition-colors"
          title="Share"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
          </svg>
        </button>
        <button
          @click="$emit('edit')"
          class="p-1.5 rounded-lg hover:bg-vault-bg text-vault-muted hover:text-vault-accent transition-colors"
          title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
        </button>
        <button
          @click="$emit('delete')"
          class="p-1.5 rounded-lg hover:bg-red-500/10 text-vault-muted hover:text-red-400 transition-colors"
          title="Hapus"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
      <!-- Mobile action trigger -->
      <button
        @click.stop="$emit('actions')"
        class="sm:hidden p-1.5 rounded-lg text-vault-muted hover:text-vault-text transition-colors shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>
    </div>
    <p v-if="app.description" class="text-xs text-vault-muted leading-relaxed line-clamp-2 mb-2">
      {{ app.description }}
    </p>
    <p class="text-[11px] text-vault-muted/50">
      {{ new Date(app.updated_at || app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ app: any }>()
defineEmits(['run', 'edit', 'delete', 'share', 'actions'])

const onDragStart = (e: DragEvent) => {
  e.dataTransfer?.setData('application/x-app-id', props.app.id)
  e.dataTransfer!.effectAllowed = 'move'
}
</script>
