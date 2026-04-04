<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

onMounted(() => {
  navigateTo('/dump', { replace: true })
})
</script>
