<template>
  <div class="min-h-screen bg-vault-bg font-sans flex flex-col">
    <header class="sticky top-0 z-50 bg-vault-bg/80 backdrop-blur-md border-b border-vault-border">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <span class="font-serif text-2xl text-vault-accent tracking-wide">MindVault</span>
        <div class="flex items-center gap-3">
          <!-- Desktop theme switcher -->
          <div class="hidden sm:flex items-center gap-1.5 bg-vault-card border border-vault-border rounded-full px-2 py-1.5">
            <button
              v-for="t in themeList"
              :key="t.key"
              @click="setTheme(t.key)"
              class="w-5 h-5 rounded-full border-2 transition-all"
              :class="current === t.key ? 'scale-110 border-vault-accent' : 'border-transparent hover:scale-105'"
              :style="{ backgroundColor: themePreviewColors[t.key] }"
              :title="t.label"
            />
          </div>

          <!-- Mobile theme dropdown trigger -->
          <div class="relative sm:hidden">
            <button
              @click="mobileThemeOpen = !mobileThemeOpen"
              class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-vault-card transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88a1.5 1.5 0 0 1 2.12 0l1.38 1.38a1.5 1.5 0 0 1 0 2.12l-2.88 2.88M10.5 8.197v.378" />
              </svg>
            </button>
            <div
              v-if="mobileThemeOpen"
              class="absolute right-0 top-12 w-56 bg-vault-card border border-vault-border rounded-xl shadow-lg overflow-hidden z-[60]"
            >
              <button
                v-for="t in themeList"
                :key="t.key"
                @click="setTheme(t.key); mobileThemeOpen = false"
                class="w-full flex items-center gap-3 px-4 min-h-[44px] hover:bg-vault-bg transition-colors"
              >
                <div
                  class="w-6 h-6 rounded-full border-2 shrink-0"
                  :class="current === t.key ? 'border-vault-accent' : 'border-vault-border'"
                  :style="{ backgroundColor: themePreviewColors[t.key] }"
                />
                <span class="flex-1 text-sm text-vault-text text-left">{{ t.label }}</span>
                <svg v-if="current === t.key" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </button>
            </div>
            <div v-if="mobileThemeOpen" class="fixed inset-0 z-[59]" @click="mobileThemeOpen = false" />
          </div>

          <NuxtLink
            to="/settings"
            class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-vault-card transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
const { current, setTheme, initTheme, themePreviewColors } = useTheme()
const mobileThemeOpen = ref(false)

const themeList = [
  { key: 'dark' as const, label: 'Dark' },
  { key: 'white' as const, label: 'White Elegant' },
  { key: 'cream' as const, label: 'Cream Elegant' },
  { key: 'matcha' as const, label: 'Matcha' },
  { key: 'lilac' as const, label: 'Lilac' },
]

onMounted(() => {
  initTheme()
})
</script>
