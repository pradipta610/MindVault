<template>
  <div class="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button
      v-for="day in days"
      :key="day.date"
      @click="$emit('select', day.date)"
      class="flex flex-col items-center min-w-[2.75rem] sm:min-w-[3rem] py-2 px-1.5 sm:px-2 rounded-xl text-center transition-all"
      :class="day.date === selectedDate
        ? 'bg-vault-accent/20 border border-vault-accent/40'
        : day.isToday
          ? 'bg-vault-card border border-vault-border'
          : 'hover:bg-vault-card border border-transparent'"
    >
      <span
        class="text-[10px] font-medium uppercase mb-1"
        :class="day.date === selectedDate ? 'text-vault-accent' : 'text-vault-muted'"
      >
        {{ day.dayName }}
      </span>
      <span
        class="text-base sm:text-lg font-semibold"
        :class="day.date === selectedDate ? 'text-vault-accent' : day.isToday ? 'text-vault-text' : 'text-vault-muted'"
      >
        {{ day.dayNum }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  selectedDate: string
}>()

defineEmits(['select'])

const days = computed(() => {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = -3; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    result.push({
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0,
    })
  }
  return result
})
</script>
