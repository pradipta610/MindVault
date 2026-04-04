<template>
  <div class="fixed inset-0 z-[200] flex items-center justify-center" @click="$emit('close')">
    <div class="absolute inset-0 bg-black/90" />
    <div class="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center">
      <img
        :src="images[currentIndex]"
        class="max-w-full max-h-[90vh] object-contain rounded-lg"
        @click.stop
      />

      <button
        v-if="images.length > 1 && currentIndex > 0"
        @click.stop="currentIndex--"
        class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      <button
        v-if="images.length > 1 && currentIndex < images.length - 1"
        @click.stop="currentIndex++"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <button
        @click.stop="$emit('close')"
        class="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      <div v-if="images.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        <div
          v-for="(_, i) in images"
          :key="i"
          class="w-2 h-2 rounded-full transition-colors"
          :class="i === currentIndex ? 'bg-white' : 'bg-white/40'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  images: string[]
  startIndex?: number
}>()

defineEmits(['close'])

const currentIndex = ref(props.startIndex || 0)
</script>
