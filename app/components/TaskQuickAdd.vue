<template>
  <div>
    <div v-if="open" class="space-y-2">
      <input
        ref="inputEl"
        v-model="text"
        placeholder="Nama task baru, Enter untuk simpan..."
        @keydown.enter.prevent="submit"
        @keydown.esc="close"
        class="w-full bg-transparent text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none"
      />

      <div class="flex flex-wrap items-center gap-1.5">
        <!-- Category -->
        <label v-if="categoryNames.length" :class="chipCls">
          <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getCategoryColor(cat) }" />
          <select v-model="cat" class="bg-transparent text-xs text-vault-text focus:outline-none max-w-[120px]">
            <option :value="null">Tanpa kategori</option>
            <option v-for="c in categoryNames" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>

        <!-- Date -->
        <label :class="chipCls">
          <span class="text-vault-muted">Tanggal</span>
          <input v-model="date" type="date" class="bg-transparent text-xs text-vault-text focus:outline-none" />
        </label>

        <!-- Deadline -->
        <label :class="chipCls">
          <span class="text-vault-muted">Deadline</span>
          <input v-model="deadline" type="datetime-local" class="bg-transparent text-xs text-vault-text focus:outline-none" />
        </label>

        <!-- Custom fields -->
        <template v-for="f in fields" :key="f.id">
          <label v-if="f.type === 'select'" :class="chipCls">
            <span class="text-vault-muted truncate max-w-[80px]">{{ f.label }}</span>
            <select v-model="custom[f.key]" class="bg-transparent text-xs text-vault-text focus:outline-none max-w-[110px]" :style="{ color: optionColor(f, custom[f.key]) }">
              <option :value="undefined">—</option>
              <option v-for="opt in f.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label v-else-if="f.type === 'date'" :class="chipCls">
            <span class="text-vault-muted truncate max-w-[80px]">{{ f.label }}</span>
            <input v-model="custom[f.key]" type="date" class="bg-transparent text-xs text-vault-text focus:outline-none" />
          </label>
          <button
            v-else-if="f.type === 'checkbox'"
            type="button"
            @click="custom[f.key] = !custom[f.key]"
            :class="[chipCls, custom[f.key] ? '!border-vault-accent/40 text-vault-accent' : 'text-vault-muted']"
          >{{ f.label }} {{ custom[f.key] ? '✓' : '' }}</button>
          <label v-else :class="chipCls">
            <span class="text-vault-muted truncate max-w-[80px]">{{ f.label }}</span>
            <input
              v-model="custom[f.key]"
              :type="f.type === 'number' ? 'number' : 'text'"
              class="bg-transparent text-xs text-vault-text focus:outline-none w-20"
            />
          </label>
        </template>

        <div class="flex items-center gap-1.5 ml-auto">
          <button type="button" @click="close" class="text-xs text-vault-muted hover:text-vault-text px-2 py-1 transition-colors">Batal</button>
          <button
            type="button"
            @click="submit"
            :disabled="!text.trim()"
            class="text-xs font-semibold bg-vault-accent text-vault-bg px-3 py-1 rounded-lg hover:bg-vault-accent-dim disabled:opacity-40 transition-colors"
          >Simpan</button>
        </div>
      </div>
    </div>

    <button
      v-else
      @click="start"
      class="flex items-center gap-1.5 text-sm text-vault-muted hover:text-vault-accent transition-colors py-0.5"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Tambah task
    </button>
  </div>
</template>

<script setup lang="ts">
import type { QuickAddPayload } from '~/types/task-quick-add'

const props = defineProps<{
  defaultCat?: string | null
  defaultDate: string
}>()

const emit = defineEmits<{
  (e: 'submit', payload: QuickAddPayload): void
}>()

const { categoryNames, getCategoryColor } = useCategories()
const { fields } = useTaskFields()

const open = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
const text = ref('')
const cat = ref<string | null>(null)
const date = ref('')
const deadline = ref('')
const custom = ref<Record<string, any>>({})

const start = () => {
  cat.value = props.defaultCat ?? null
  date.value = props.defaultDate
  deadline.value = ''
  custom.value = {}
  open.value = true
  nextTick(() => inputEl.value?.focus())
}

const close = () => {
  text.value = ''
  open.value = false
}

const chipCls = 'inline-flex items-center gap-1.5 text-xs bg-vault-bg border border-vault-border rounded-lg px-2 py-1 transition-colors'

const optionColor = (field: any, value: string | undefined) =>
  (field.options || []).find((o: any) => o.value === value)?.color

// Drop empty values so unset fields don't get stored on the task
const cleanCustom = () => {
  const out: Record<string, any> = {}
  for (const f of fields.value) {
    let val = custom.value[f.key]
    if (val === undefined || val === null || val === '' || val === false) continue
    if (f.type === 'number') val = Number(val)
    out[f.key] = val
  }
  return out
}

// Category, date and fields stay set after saving so a batch of similar
// tasks can be typed one after another; only the name and deadline reset.
const submit = () => {
  const trimmed = text.value.trim()
  if (!trimmed) return
  emit('submit', {
    text: trimmed,
    cat: cat.value,
    date: date.value || props.defaultDate,
    deadline_at: deadline.value ? new Date(deadline.value).toISOString() : null,
    custom_fields: cleanCustom(),
  })
  text.value = ''
  deadline.value = ''
  nextTick(() => inputEl.value?.focus())
}
</script>
