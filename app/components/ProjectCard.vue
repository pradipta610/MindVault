<template>
  <NuxtLink
    :to="`/projects/${project.id}`"
    class="block group bg-vault-card border border-vault-border rounded-2xl p-5 hover:border-vault-accent/30 transition-all hover:shadow-lg active:scale-[0.98]"
  >
    <div class="flex items-start justify-between mb-3">
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
        :style="{ backgroundColor: project.color + '22' }"
      >
        {{ project.icon || '📁' }}
      </div>
      <div class="flex items-center gap-2 mt-0.5">
        <span
          v-if="project.status === 'done'"
          class="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-medium"
        >
          Selesai
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 text-vault-muted group-hover:text-vault-accent transition-colors"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </div>

    <h3
      class="font-serif text-lg text-vault-text mb-3 leading-snug"
      :class="{ 'line-through text-vault-muted': project.status === 'done' }"
    >
      {{ project.name }}
    </h3>

    <div v-if="project.totalTasks > 0" class="flex items-center gap-2">
      <div class="flex-1 h-1.5 bg-vault-border rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{ width: progressPct + '%', backgroundColor: project.color }"
        />
      </div>
      <span class="text-[10px] text-vault-muted shrink-0">{{ project.doneTasks }}/{{ project.totalTasks }}</span>
    </div>
    <div v-else class="text-[10px] text-vault-muted">Belum ada tasks</div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{ project: any }>()

const progressPct = computed(() => {
  if (!props.project.totalTasks) return 0
  return Math.round((props.project.doneTasks / props.project.totalTasks) * 100)
})
</script>
