<template>
  <div
    class="fixed inset-0 z-[200] flex items-center justify-center select-none"
    @click="$emit('close')"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <div class="absolute inset-0 bg-black/95" />

    <!-- Close button -->
    <button
      @click.stop="$emit('close')"
      class="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Index indicator -->
    <div v-if="images.length > 1" class="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-sm px-3 py-1 rounded-full font-medium">
      {{ currentIndex + 1 }}/{{ images.length }}
    </div>

    <!-- Image -->
    <div class="relative w-full h-full flex items-center justify-center px-12 sm:px-16">
      <img
        :src="images[currentIndex]"
        class="max-w-full max-h-[85vh] object-contain rounded-lg"
        @click.stop
        draggable="false"
      />
    </div>

    <!-- Left arrow -->
    <button
      v-if="images.length > 1 && currentIndex > 0"
      @click.stop="prev"
      class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </button>

    <!-- Right arrow -->
    <button
      v-if="images.length > 1 && currentIndex < images.length - 1"
      @click.stop="next"
      class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  images: string[]
  startIndex?: number
}>()

const emit = defineEmits(['close'])

const currentIndex = ref(props.startIndex || 0)

const prev = () => {
  if (currentIndex.value > 0) currentIndex.value--
}
const next = () => {
  if (currentIndex.value < props.images.length - 1) currentIndex.value++
}

// Touch swipe support
let touchStartX = 0
let touchStartY = 0

const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0]!.clientX
    touchStartY = e.touches[0]!.clientY
  }
}

const onTouchEnd = (e: TouchEvent) => {
  if (e.changedTouches.length === 1) {
    const dx = e.changedTouches[0]!.clientX - touchStartX
    const dy = e.changedTouches[0]!.clientY - touchStartY
    // Only swipe if horizontal movement > 50px and greater than vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
    }
  }
}

// Keyboard navigation
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'Escape') emit('close')
}

// Lock body scroll while lightbox is open
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>
