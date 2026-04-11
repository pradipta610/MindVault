<template>
  <div class="relative" ref="containerRef">
    <!-- Filter icon button -->
    <button
      @click="open = !open"
      class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative"
      :class="hasFilter ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
      </svg>
      <span v-if="hasFilter" class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-vault-accent" />
    </button>

    <!-- Desktop dropdown -->
    <Transition name="fade">
      <div
        v-if="open && !isMobile"
        class="absolute right-0 top-full mt-1.5 z-50 bg-vault-card border border-vault-border rounded-xl shadow-lg p-3 min-w-[200px]"
      >
        <p class="text-[11px] text-vault-muted font-medium uppercase tracking-wider mb-2">Kategori</p>
        <div class="space-y-1">
          <button
            @click="selectCat('all')"
            class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
            :class="modelValue === 'all' ? 'bg-vault-accent/15 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-vault-muted/40" />
            Semua
          </button>
          <button
            v-for="c in categories"
            :key="c"
            @click="selectCat(c)"
            class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
            :class="modelValue === c ? 'bg-vault-accent/15' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
            :style="modelValue === c ? { color: getCategoryColor(c) } : {}"
          >
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: getCategoryColor(c) }" />
            <span class="text-[10px]">{{ getCategoryIcon(c) }}</span>
            {{ c }}
          </button>
        </div>
        <button
          v-if="hasFilter"
          @click="selectCat('all')"
          class="w-full mt-2 pt-2 border-t border-vault-border text-[11px] text-red-400/80 hover:text-red-400 transition-colors text-center"
        >Reset filter</button>
      </div>
    </Transition>

    <!-- Mobile bottom sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="open && isMobile" class="fixed inset-0 z-[100]" @click="open = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div class="absolute bottom-0 left-0 right-0 bg-vault-card border-t border-vault-border rounded-t-2xl p-4 pb-8" @click.stop>
            <div class="w-10 h-1 rounded-full bg-vault-border mx-auto mb-4" />
            <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Filter Kategori</p>
            <div class="space-y-1">
              <button
                @click="selectCat('all')"
                class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3"
                :class="modelValue === 'all' ? 'bg-vault-accent/15 text-vault-accent' : 'text-vault-text hover:bg-vault-bg'"
              >
                <span class="w-3 h-3 rounded-full bg-vault-muted/40" />
                Semua kategori
              </button>
              <button
                v-for="c in categories"
                :key="c"
                @click="selectCat(c)"
                class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3"
                :class="modelValue === c ? '' : 'text-vault-text hover:bg-vault-bg'"
                :style="modelValue === c ? { backgroundColor: getCategoryColor(c) + '22', color: getCategoryColor(c) } : {}"
              >
                <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: getCategoryColor(c) }" />
                <span class="text-xs">{{ getCategoryIcon(c) }}</span>
                {{ c }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  categories: string[]
}>()

const emit = defineEmits(['update:modelValue'])

const { getCategoryColor, getCategoryIcon } = useCategories()

const open = ref(false)
const isMobile = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const hasFilter = computed(() => props.modelValue !== 'all')

const selectCat = (cat: string) => {
  emit('update:modelValue', cat)
  open.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.sheet-enter-active, .sheet-leave-active { transition: all 0.3s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from > :last-child, .sheet-leave-to > :last-child { transform: translateY(100%); }
</style>
