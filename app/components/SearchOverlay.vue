<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[200] flex flex-col bg-vault-bg/95 backdrop-blur-lg"
        @keydown.esc="$emit('close')"
      >
        <!-- Header -->
        <div class="shrink-0 border-b border-vault-border">
          <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              ref="inputRef"
              :value="query"
              @input="onInput"
              placeholder="Cari di semua data..."
              class="flex-1 bg-transparent text-vault-text text-base placeholder:text-vault-muted/50 focus:outline-none"
              autocomplete="off"
              spellcheck="false"
            />
            <div v-if="loading" class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin shrink-0" />
            <button
              @click="$emit('close')"
              class="text-vault-muted hover:text-vault-text transition-colors shrink-0 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Results -->
        <div class="flex-1 overflow-y-auto">
          <div class="max-w-2xl mx-auto px-4 py-4">

            <!-- Empty state: no query -->
            <div v-if="!query.trim()" class="text-center py-16">
              <div class="text-4xl mb-3">🔍</div>
              <p class="text-vault-muted text-sm">Ketik untuk mulai mencari...</p>
              <p class="text-vault-muted/50 text-xs mt-2">Cari di Dump, To-Do, Keuangan, Apps, Links, Projects</p>
            </div>

            <!-- No results -->
            <div v-else-if="!loading && grouped.length === 0" class="text-center py-16">
              <div class="text-4xl mb-3">😕</div>
              <p class="text-vault-muted text-sm">Ga ada hasil untuk '<span class="text-vault-text">{{ query }}</span>'</p>
            </div>

            <!-- Grouped results -->
            <div v-else class="space-y-6">
              <div v-for="group in grouped" :key="group.section">
                <!-- Section header -->
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm">{{ group.icon }}</span>
                  <span class="text-[10px] font-semibold text-vault-muted uppercase tracking-wider">{{ group.label }}</span>
                  <span class="text-[10px] text-vault-muted/50">({{ group.items.length }})</span>
                </div>

                <!-- Result items -->
                <div class="bg-vault-card border border-vault-border rounded-xl overflow-hidden">
                  <button
                    v-for="(item, i) in group.items"
                    :key="item.id"
                    @click="goToResult(item)"
                    class="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-vault-bg/50 transition-colors"
                    :class="{ 'border-t border-vault-border': i > 0 }"
                  >
                    <span class="text-lg shrink-0 mt-0.5">{{ item.icon }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-vault-text leading-tight" v-html="highlight(item.title)" />
                      <p v-if="item.preview" class="text-[11px] text-vault-muted mt-0.5 truncate" v-html="highlight(item.preview)" />
                    </div>
                    <span v-if="item.date" class="text-[10px] text-vault-muted/60 shrink-0 mt-1">{{ item.date }}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Keyboard hint -->
        <div class="shrink-0 border-t border-vault-border">
          <div class="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <span class="text-[10px] text-vault-muted/50">ESC untuk tutup</span>
            <span class="text-[10px] text-vault-muted/50">{{ results.length }} hasil</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SearchResult } from '~/composables/useSearch'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['close'])

const router = useRouter()
const inputRef = ref<HTMLInputElement | null>(null)
const { query, results, grouped, loading, debouncedSearch, clear } = useSearch()

const onInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  debouncedSearch(val)
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const highlight = (text: string): string => {
  const q = query.value.trim()
  if (!q) return text
  const regex = new RegExp(`(${escapeRegex(q)})`, 'gi')
  return text.replace(regex, '<mark class="bg-vault-accent/30 text-vault-text rounded px-0.5">$1</mark>')
}

const goToResult = (item: SearchResult) => {
  emit('close')
  router.push(item.route)
}

// Auto-focus on open
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(() => inputRef.value?.focus())
  } else {
    clear()
  }
})

// Handle back button (Android PWA)
const onPopState = () => {
  if (props.open) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('popstate', onPopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', onPopState)
})
</script>

<style scoped>
.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.15s ease;
}
.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}
</style>
