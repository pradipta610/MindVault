<template>
  <button
    @click="$emit('sort', col)"
    class="px-3 py-2.5 flex items-center gap-1 text-left hover:text-vault-text transition-colors truncate"
    :class="{ 'text-vault-accent': isActive }"
  >
    <span class="truncate">{{ label }}</span>
    <svg
      v-if="isActive && sortDir === 'asc'"
      xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
    ><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
    <svg
      v-else-if="isActive && sortDir === 'desc'"
      xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
    ><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  col: string
  sortField: string | null
  sortDir: 'asc' | 'desc' | null
}>()
defineEmits<{ (e: 'sort', col: string): void }>()

const isActive = computed(() => props.sortField === props.col)
</script>
