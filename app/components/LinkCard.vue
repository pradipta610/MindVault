<template>
  <div
    class="group bg-vault-card border border-vault-border rounded-xl overflow-hidden hover:border-vault-accent/20 transition-colors"
    draggable="true"
    @dragstart="onDragStart"
  >
    <!-- Thumbnail -->
    <a
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      class="block"
    >
      <div v-if="link.image" class="w-full h-36 sm:h-44 bg-vault-bg overflow-hidden">
        <img
          :src="link.image"
          :alt="link.title || link.url"
          class="w-full h-full object-cover"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
      </div>
    </a>

    <div class="p-3 sm:p-4">
      <!-- Title + favicon -->
      <a
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-start gap-2 mb-1"
      >
        <img
          v-if="link.favicon"
          :src="link.favicon"
          class="w-4 h-4 rounded-sm mt-0.5 shrink-0"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <h3 class="text-sm font-semibold text-vault-text leading-snug line-clamp-2 hover:text-vault-accent transition-colors">
          {{ link.title || link.url }}
        </h3>
      </a>

      <!-- Description -->
      <p v-if="link.description" class="text-xs text-vault-muted leading-relaxed line-clamp-2 mb-2">
        {{ link.description }}
      </p>

      <!-- URL + actions -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] text-vault-muted/60 truncate flex-1">
          {{ getDomain(link.url) }}
        </span>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            @click="$emit('refresh')"
            class="p-1.5 rounded-lg hover:bg-vault-bg text-vault-muted hover:text-vault-accent transition-colors"
            title="Refresh metadata"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
          <button
            @click="$emit('copy')"
            class="p-1.5 rounded-lg hover:bg-vault-bg text-vault-muted hover:text-vault-text transition-colors"
            title="Copy URL"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
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
          @click="$emit('actions')"
          class="sm:hidden p-1.5 rounded-lg text-vault-muted hover:text-vault-text transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ link: any }>()
defineEmits(['refresh', 'copy', 'delete', 'actions'])

const getDomain = (url: string) => {
  try { return new URL(url).hostname } catch { return url }
}

const onDragStart = (e: DragEvent) => {
  e.dataTransfer?.setData('application/x-link-id', props.link.id)
  e.dataTransfer!.effectAllowed = 'move'
}
</script>
