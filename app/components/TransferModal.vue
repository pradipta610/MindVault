<template>
  <div class="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />
    <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-4">
      <h3 class="font-serif text-lg text-vault-text">{{ title }}</h3>

      <div v-if="showText">
        <label class="block text-xs text-vault-muted mb-1">Teks</label>
        <input
          v-model="taskText"
          class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
        />
      </div>

      <div v-if="showCategory">
        <label class="block text-xs text-vault-muted mb-1">Kategori</label>
        <div v-if="categories.length > 0" class="flex flex-wrap gap-2">
          <button
            v-for="c in categories"
            :key="c"
            @click="selectedCat = c"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1"
            :class="selectedCat === c
              ? 'border-transparent'
              : 'bg-vault-bg border-vault-border text-vault-muted hover:text-vault-text'"
            :style="selectedCat === c ? { backgroundColor: getCategoryColor(c) + '33', color: getCategoryColor(c) } : {}"
          >
            <span class="text-[10px]">{{ getCategoryIcon(c) }}</span>
            {{ c }}
          </button>
        </div>
        <p v-else class="text-xs text-vault-muted">Belum ada kategori. Akan disimpan tanpa kategori.</p>
      </div>

      <div v-if="showDate">
        <label class="block text-xs text-vault-muted mb-1">Tanggal</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button
            @click="selectedDate = todayStr"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            :class="selectedDate === todayStr
              ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
              : 'bg-vault-bg border-vault-border text-vault-muted hover:text-vault-text'"
          >
            Hari ini
          </button>
          <button
            @click="selectedDate = tomorrowStr"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            :class="selectedDate === tomorrowStr
              ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent'
              : 'bg-vault-bg border-vault-border text-vault-muted hover:text-vault-text'"
          >
            Besok
          </button>
        </div>
        <input
          type="date"
          v-model="selectedDate"
          class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 transition-colors"
        />
      </div>

      <div class="flex gap-2 pt-2">
        <button
          @click="$emit('close')"
          class="flex-1 bg-vault-bg border border-vault-border text-vault-muted px-4 py-2.5 rounded-lg text-sm font-medium hover:text-vault-text transition-colors"
        >
          Batal
        </button>
        <button
          @click="handleConfirm"
          :disabled="showText && !taskText.trim()"
          class="flex-1 bg-vault-accent text-vault-bg px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  confirmLabel?: string
  initialText?: string
  initialCat?: string
  initialDate?: string
  showText?: boolean
  showCategory?: boolean
  showDate?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [data: { text: string; cat: string; date: string }]
}>()

const { categoryNames, hasCategories, getCategoryColor, getCategoryIcon, getCategoryLabel } = useCategories()
const categories = categoryNames

const todayStr = new Date().toISOString().split('T')[0]
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

const taskText = ref(props.initialText || '')
const selectedCat = ref(props.initialCat || categoryNames.value[0] || '')
const selectedDate = ref(props.initialDate || todayStr)

const handleConfirm = () => {
  emit('confirm', {
    text: taskText.value.trim(),
    cat: selectedCat.value,
    date: selectedDate.value,
  })
}
</script>
