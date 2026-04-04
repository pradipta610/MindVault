<template>
  <div class="min-h-screen bg-vault-bg font-sans flex flex-col">
    <header
      v-if="user && !isLoginPage"
      class="sticky top-0 z-50 bg-vault-bg/80 backdrop-blur-md border-b border-vault-border"
    >
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/dump" class="font-serif text-2xl text-vault-accent tracking-wide">
          MindVault
        </NuxtLink>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 bg-vault-card border border-vault-border rounded-full px-2 py-1.5">
            <button
              v-for="t in (['dark', 'white', 'cream', 'matcha', 'lilac'] as const)"
              :key="t"
              @click="setTheme(t)"
              class="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-2 transition-all"
              :class="current === t ? 'scale-110 border-vault-accent' : 'border-transparent hover:scale-105'"
              :style="{ backgroundColor: themePreviewColors[t] }"
              :title="t.charAt(0).toUpperCase() + t.slice(1)"
            />
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

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 pb-24">
      <slot />
    </main>

    <nav
      v-if="user && !isLoginPage && !isSettingsPage"
      class="fixed bottom-0 left-0 right-0 z-50 bg-vault-bg/90 backdrop-blur-md border-t border-vault-border"
    >
      <div class="max-w-4xl mx-auto flex">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors"
          :class="isActive(tab.to) ? 'text-vault-accent' : 'text-vault-muted hover:text-vault-text'"
        >
          <div v-html="tab.icon" class="w-5 h-5 mb-1" />
          {{ tab.label }}
        </NuxtLink>
      </div>
    </nav>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const route = useRoute()
const { current, setTheme, initTheme, themePreviewColors } = useTheme()

onMounted(() => {
  initTheme()
})

const isLoginPage = computed(() => route.path === '/login' || route.path === '/confirm')
const isSettingsPage = computed(() => route.path === '/settings')

const isActive = (path: string) => route.path === path

const tabs = [
  {
    to: '/dump',
    label: 'DUMP',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>'
  },
  {
    to: '/todo',
    label: 'TO-DO',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>'
  },
  {
    to: '/backlog',
    label: 'BACKLOG',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>'
  }
]
</script>
