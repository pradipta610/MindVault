<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[200] flex flex-col"
        @keydown.esc="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />

        <!-- Panel -->
        <div class="relative w-full max-w-xl mx-auto mt-[env(safe-area-inset-top)] sm:mt-16 flex flex-col max-h-[85vh] bg-vault-card border border-vault-border rounded-none sm:rounded-2xl overflow-hidden shadow-2xl">

          <!-- Search input -->
          <div class="flex items-center gap-2.5 px-4 py-3 border-b border-vault-border">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              ref="inputRef"
              :value="query"
              @input="onInput"
              placeholder="Cari di semua data..."
              class="flex-1 bg-transparent text-sm text-vault-text placeholder:text-vault-muted/40 focus:outline-none"
              autocomplete="off"
              spellcheck="false"
            />
            <div v-if="loading" class="w-4 h-4 border-2 border-vault-accent border-t-transparent rounded-full animate-spin shrink-0" />
            <button v-if="query" @click="clearInput" class="text-vault-muted/40 hover:text-vault-muted transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            <kbd class="hidden sm:inline text-[9px] text-vault-muted/30 border border-vault-border/50 rounded px-1 py-0.5 font-mono leading-none">ESC</kbd>
          </div>

          <!-- Results body -->
          <div class="flex-1 overflow-y-auto overscroll-contain">

            <!-- Empty: no query -->
            <div v-if="!query.trim()" class="px-4 py-10 text-center">
              <p class="text-xs text-vault-muted/50">Ketik untuk mulai mencari...</p>
            </div>

            <!-- No results -->
            <div v-else-if="!loading && grouped.length === 0" class="px-4 py-10 text-center">
              <p class="text-xs text-vault-muted">Ga ada hasil untuk '<span class="text-vault-text font-medium">{{ query }}</span>'</p>
            </div>

            <!-- Grouped results -->
            <div v-else class="py-1">
              <div v-for="group in grouped" :key="group.section">
                <!-- Section label -->
                <div class="px-4 pt-3 pb-1.5 flex items-center gap-1.5">
                  <span class="text-[11px]">{{ group.icon }}</span>
                  <span class="text-[10px] font-semibold text-vault-muted/70 uppercase tracking-wider">{{ group.label }}</span>
                </div>

                <!-- Items -->
                <button
                  v-for="item in group.items"
                  :key="item.id"
                  @click="goToResult(item)"
                  class="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-vault-bg/40 active:bg-vault-bg/60 transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] text-vault-text leading-snug truncate" v-html="highlight(item.title)" />
                    <p v-if="item.preview" class="text-[11px] text-vault-muted/60 mt-0.5 truncate" v-html="highlight(item.preview)" />
                  </div>
                  <span v-if="item.date" class="text-[10px] text-vault-muted/40 shrink-0 tabular-nums">{{ item.date }}</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div v-if="query.trim() && results.length > 0" class="px-4 py-1.5 border-t border-vault-border/50 flex items-center justify-end">
            <span class="text-[10px] text-vault-muted/40">{{ results.length }} hasil</span>
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

const clearInput = () => {
  clear()
  nextTick(() => inputRef.value?.focus())
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
