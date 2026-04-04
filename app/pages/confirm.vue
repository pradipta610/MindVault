<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="w-8 h-8 border-2 border-vault-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p class="text-vault-muted">Authenticating...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()

watch(user, (val) => {
  if (val) {
    navigateTo('/dump', { replace: true })
  }
}, { immediate: true })
</script>
