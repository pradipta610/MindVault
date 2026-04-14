<template>
  <div class="min-h-screen bg-[#0f0f0d] flex flex-col">
    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-6 h-6 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Not found -->
    <div v-else-if="!app" class="flex-1 flex flex-col items-center justify-center gap-3 px-4">
      <div class="text-4xl">🔗</div>
      <p class="text-[#8a8a7a] text-sm text-center">Link ini tidak valid atau sudah direvoke oleh pemiliknya.</p>
      <NuxtLink to="/login" class="text-[#d4a853] text-sm hover:underline mt-2">Login ke MindVault →</NuxtLink>
    </div>

    <!-- Shared app runner -->
    <template v-else>
      <div class="flex items-center justify-between px-4 h-12 border-b border-[#2a2a28] shrink-0 bg-[#0f0f0d]/95 backdrop-blur-sm">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-6 h-6 rounded-md bg-[#d4a853]/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-[#d4a853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          </div>
          <h3 class="text-sm font-semibold text-[#e8e8e0] truncate">{{ app.name }}</h3>
        </div>
        <span class="text-[10px] text-[#8a8a7a] px-2 py-0.5 rounded-full border border-[#2a2a28] shrink-0">Shared via MindVault</span>
      </div>
      <iframe
        :srcdoc="app.html"
        class="flex-1 w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, auth: false })

const route = useRoute()
const token = route.params.token as string

const { fetchSharedApp } = useApps()
const app = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    app.value = await fetchSharedApp(token)
  } finally {
    loading.value = false
  }
})
</script>
