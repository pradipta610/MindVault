<template>
  <div class="space-y-2">
    <div
      v-for="item in items"
      :key="item.tempId"
      class="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
      :class="item.duplicateStatus === 'exact_duplicate'
        ? 'bg-vault-bg/50 border-vault-border opacity-50'
        : 'bg-vault-card border-vault-border'"
    >
      <!-- Include checkbox (not selectable for exact duplicates) -->
      <button
        v-if="item.duplicateStatus !== 'exact_duplicate'"
        @click="$emit('toggle-selected', item.tempId)"
        class="w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-colors"
        :class="item.selected ? 'bg-vault-accent border-vault-accent' : 'border-vault-border'"
      >
        <svg v-if="item.selected" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </button>
      <div v-else class="w-5 h-5 shrink-0" />

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm text-vault-text truncate">{{ item.rawDescription }}</p>
          <span class="text-sm font-semibold shrink-0" :class="item.type === 'income' ? 'text-vault-positive' : 'text-vault-negative'">
            {{ item.type === 'income' ? '+' : '-' }}{{ formatIDR(item.amount) }}
          </span>
        </div>
        <p class="text-[11px] text-vault-muted mt-0.5">{{ formatDate(item.date) }}</p>

        <!-- Status badges -->
        <div v-if="item.duplicateStatus !== 'none'" class="mt-1.5 flex items-center gap-2 flex-wrap">
          <span
            v-if="item.duplicateStatus === 'exact_duplicate'"
            class="text-[10px] px-2 py-0.5 rounded-full bg-vault-muted/15 text-vault-muted"
          >
            Sudah pernah diimport
          </span>
          <template v-else-if="item.duplicateStatus === 'possible_existing'">
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
              Possible Existing Transaction
            </span>
            <div class="flex gap-1">
              <button
                @click="$emit('set-action', item.tempId, 'skip')"
                class="text-[10px] px-2 py-0.5 rounded-full border transition-colors"
                :class="item.action === 'skip' ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent' : 'border-vault-border text-vault-muted'"
              >
                Skip
              </button>
              <button
                @click="$emit('set-action', item.tempId, 'import')"
                class="text-[10px] px-2 py-0.5 rounded-full border transition-colors"
                :class="item.action === 'import' ? 'bg-vault-accent/20 border-vault-accent/40 text-vault-accent' : 'border-vault-border text-vault-muted'"
              >
                Import Anyway
              </button>
            </div>
          </template>
        </div>

        <!-- Category picker -->
        <select
          v-if="item.duplicateStatus !== 'exact_duplicate'"
          :value="item.category"
          @change="$emit('set-category', item.tempId, ($event.target as HTMLSelectElement).value)"
          class="mt-2 text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1 text-vault-text focus:outline-none focus:border-vault-accent/30"
        >
          <option v-for="cat in categoriesForType(item.type)" :key="cat.key" :value="cat.key">
            {{ cat.emoji }} {{ cat.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImportPreviewItem } from '~/types/finance-import'

defineProps<{ items: ImportPreviewItem[] }>()
defineEmits<{
  'toggle-selected': [tempId: string]
  'set-action': [tempId: string, action: 'import' | 'skip']
  'set-category': [tempId: string, category: string]
}>()

const { categoriesForType } = useFinanceCategories()

const formatIDR = (amount: number) => 'Rp ' + Math.abs(amount).toLocaleString('id-ID')
const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
</script>
