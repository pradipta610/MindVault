<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[200]" @click.self="$emit('close')">
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        :style="{ transition: 'opacity 0.3s ease' }"
        @click="$emit('close')"
      />
      <div
        ref="sheetEl"
        class="absolute bottom-0 left-0 right-0 bg-vault-card border-t border-vault-border rounded-t-2xl overflow-hidden"
        :style="{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }"
      >
        <div class="w-10 h-1 rounded-full bg-vault-muted/30 mx-auto mt-3 mb-2" />

        <div class="px-4 pb-4 space-y-1">
          <button
            v-for="action in actions"
            :key="action.id"
            @click="$emit('select', action.id)"
            class="w-full flex items-center gap-3 px-4 rounded-xl transition-colors"
            :class="action.destructive ? 'hover:bg-red-500/10' : 'hover:bg-vault-bg'"
            style="min-height: 52px"
          >
            <span class="text-lg shrink-0" v-html="action.icon" />
            <span
              class="text-sm font-medium"
              :class="action.destructive ? 'text-red-400' : 'text-vault-text'"
            >
              {{ action.label }}
            </span>
          </button>

          <button
            @click="$emit('close')"
            class="w-full flex items-center justify-center px-4 rounded-xl hover:bg-vault-bg transition-colors mt-2 border border-vault-border"
            style="min-height: 52px"
          >
            <span class="text-sm font-medium text-vault-muted">Batalkan</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
export interface ActionItem {
  id: string
  label: string
  icon: string
  destructive?: boolean
}

defineProps<{ actions: ActionItem[] }>()
defineEmits(['close', 'select'])

const visible = ref(false)
const sheetEl = ref<HTMLElement | null>(null)

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
})
</script>
