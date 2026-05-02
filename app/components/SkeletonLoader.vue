<template>
  <div class="animate-pulse space-y-3" :class="containerClass">

    <!-- type: list — rows of text lines (notes, tasks) -->
    <template v-if="type === 'list'">
      <div v-for="i in count" :key="i" class="bg-vault-card border border-vault-border rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2.5">
          <div class="h-4 rounded-full bg-vault-border" :style="{ width: tagWidths[i % tagWidths.length] }" />
        </div>
        <div class="space-y-2">
          <div class="h-3.5 bg-vault-border rounded-full w-full" />
          <div class="h-3.5 bg-vault-border rounded-full" :style="{ width: lineWidths[i % lineWidths.length] }" />
        </div>
      </div>
    </template>

    <!-- type: task — compact task rows -->
    <template v-else-if="type === 'task'">
      <div v-for="i in count" :key="i" class="flex items-center gap-3 bg-vault-card border border-vault-border rounded-xl px-4 py-3">
        <div class="w-5 h-5 rounded border-2 border-vault-border shrink-0" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3.5 bg-vault-border rounded-full" :style="{ width: lineWidths[i % lineWidths.length] }" />
        </div>
        <div class="h-4 w-12 bg-vault-border rounded-full shrink-0" />
      </div>
    </template>

    <!-- type: card — grid cards (projects, apps) -->
    <template v-else-if="type === 'card'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div v-for="i in count" :key="i" class="bg-vault-card border border-vault-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 rounded-lg bg-vault-border shrink-0" />
            <div class="h-4 bg-vault-border rounded-full flex-1" />
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-vault-border rounded-full w-full" />
            <div class="h-3 bg-vault-border rounded-full w-2/3" />
          </div>
        </div>
      </div>
    </template>

    <!-- type: finance — transaction rows -->
    <template v-else-if="type === 'finance'">
      <div v-for="i in count" :key="i" class="flex items-center gap-3 py-3 border-b border-vault-border">
        <div class="w-9 h-9 rounded-xl bg-vault-border shrink-0" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3.5 bg-vault-border rounded-full" :style="{ width: lineWidths[i % lineWidths.length] }" />
          <div class="h-3 bg-vault-border rounded-full w-20" />
        </div>
        <div class="h-4 bg-vault-border rounded-full w-16 shrink-0" />
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'list' | 'task' | 'card' | 'finance'
  count?: number
  containerClass?: string
}>(), {
  type: 'list',
  count: 4,
})

const tagWidths = ['32%', '45%', '28%', '38%', '42%']
const lineWidths = ['90%', '75%', '85%', '65%', '80%']
</script>
