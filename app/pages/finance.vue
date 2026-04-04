<template>
  <div class="min-h-screen bg-vault-bg flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto w-full">
    <div class="text-center">
      <div class="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-4xl mx-auto mb-6">
        💰
      </div>
      <h1 class="font-serif text-3xl text-vault-text mb-3">Catatan Keuangan</h1>
      <p class="text-vault-muted text-sm mb-8 max-w-xs mx-auto">Catat pemasukan, pengeluaran, dan kelola keuangan kamu. Segera hadir!</p>
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-vault-muted hover:text-vault-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Kembali ke Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })
</script>
