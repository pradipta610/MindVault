<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg backdrop-blur-md border transition-all"
          :class="{
            'bg-emerald-500/90 text-white border-emerald-400/30': toast.type === 'success',
            'bg-red-500/90 text-white border-red-400/30': toast.type === 'error',
            'bg-vault-accent/90 text-vault-bg border-vault-accent/30': toast.type === 'info',
          }"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts } = useToast()
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
