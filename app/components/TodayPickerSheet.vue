<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')" />

      <div
        class="relative w-full sm:max-w-md bg-vault-card border-t sm:border border-vault-border rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[80vh] sm:max-h-[70vh] overflow-hidden"
        :style="{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }"
      >
        <div class="w-10 h-1 rounded-full bg-vault-muted/30 mx-auto mt-3 sm:hidden" />

        <div class="px-4 pt-3 pb-2 shrink-0">
          <h3 class="text-sm font-semibold text-vault-text mb-2">Pilih task untuk hari ini</h3>
          <input
            v-model="query"
            placeholder="Cari task..."
            class="w-full bg-vault-bg border border-vault-border rounded-xl px-3 py-2 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
        </div>

        <div class="flex-1 overflow-y-auto px-2 pb-2">
          <p v-if="filtered.length === 0" class="text-center text-xs text-vault-muted py-8">
            {{ tasks.length === 0 ? 'Semua task sudah masuk rencana hari ini.' : 'Tidak ada task yang cocok.' }}
          </p>

          <button
            v-for="task in filtered"
            :key="task.id"
            @click="toggle(task.id)"
            class="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            :class="picked.has(task.id) ? 'bg-vault-accent/10' : 'hover:bg-vault-bg'"
          >
            <span
              class="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="picked.has(task.id) ? 'bg-vault-accent border-vault-accent' : 'border-vault-muted/50'"
            >
              <svg v-if="picked.has(task.id)" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>

            <span class="flex-1 min-w-0 text-sm text-vault-text truncate">{{ plainText(task.text) }}</span>

            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 max-w-[100px] truncate"
              :style="{ backgroundColor: getCategoryColor(task.cat) + '33', color: getCategoryColor(task.cat) }"
            >{{ task.cat || 'uncategorized' }}</span>
          </button>
        </div>

        <div class="px-4 py-3 border-t border-vault-border flex items-center gap-2 shrink-0">
          <button
            @click="$emit('close')"
            class="flex-1 py-2.5 rounded-xl border border-vault-border text-sm font-medium text-vault-muted hover:text-vault-text transition-colors"
          >Batal</button>
          <button
            :disabled="picked.size === 0"
            @click="confirm"
            class="flex-1 py-2.5 rounded-xl bg-vault-accent text-vault-bg text-sm font-semibold transition-opacity disabled:opacity-40"
          >Tambahkan{{ picked.size > 0 ? ` (${picked.size})` : '' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ tasks: any[] }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', ids: string[]): void
}>()

const { getCategoryColor } = useCategories()

const plainText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim()

const visible = ref(false)
const query = ref('')
const picked = ref(new Set<string>())

onMounted(() => requestAnimationFrame(() => { visible.value = true }))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.tasks
  return props.tasks.filter((t: any) => plainText(t.text).toLowerCase().includes(q))
})

const toggle = (id: string) => {
  const next = new Set(picked.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  picked.value = next
}

const confirm = () => {
  if (picked.value.size === 0) return
  emit('confirm', [...picked.value])
}
</script>
