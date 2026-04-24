<template>
  <div class="min-h-screen bg-vault-bg font-sans flex flex-col">
    <header
      v-if="user && !isLoginPage"
      class="sticky top-0 z-50 bg-vault-bg/80 backdrop-blur-md border-b border-vault-border"
    >
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="font-serif text-2xl text-vault-accent tracking-wide">
          MindVault
        </NuxtLink>
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
                <svg
                  v-if="current === t.key"
                  xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                >
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

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 pb-20">
      <slot />
    </main>

    <!-- ===== Bottom Navigation ===== -->
    <nav
      v-if="user && !isLoginPage"
      class="fixed bottom-0 left-0 right-0 z-50 bg-vault-bg/90 backdrop-blur-md border-t border-vault-border"
    >
      <div class="max-w-4xl mx-auto flex">
        <!-- Mobile: show primaryTabs + More button -->
        <!-- Desktop (sm+): show allTabs -->

        <!-- Primary tabs (always visible) -->
        <NuxtLink
          v-for="tab in primaryTabs"
          :key="tab.to"
          :to="tab.to"
          class="flex-1 flex flex-col items-center py-2.5 text-[10px] sm:text-xs font-medium transition-colors min-w-0"
          :class="isActiveTab(tab.to) ? 'text-vault-accent' : 'text-vault-muted hover:text-vault-text'"
        >
          <div v-html="tab.icon" class="w-5 h-5 mb-0.5" />
          {{ tab.label }}
        </NuxtLink>

        <!-- Desktop-only extra tabs -->
        <NuxtLink
          v-for="tab in secondaryTabs"
          :key="tab.to"
          :to="tab.to"
          class="hidden sm:flex flex-1 flex-col items-center py-2.5 text-xs font-medium transition-colors min-w-0"
          :class="isActiveTab(tab.to) ? 'text-vault-accent' : 'text-vault-muted hover:text-vault-text'"
        >
          <div v-html="tab.icon" class="w-5 h-5 mb-0.5" />
          {{ tab.label }}
        </NuxtLink>

        <!-- Mobile "More" button -->
        <button
          @click="moreMenuOpen = !moreMenuOpen"
          class="sm:hidden flex-1 flex flex-col items-center py-2.5 text-[10px] font-medium transition-colors min-w-0"
          :class="isSecondaryActive || moreMenuOpen ? 'text-vault-accent' : 'text-vault-muted'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          More
        </button>
      </div>
    </nav>

    <!-- ===== Mobile "More" bottom sheet ===== -->
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="moreMenuOpen"
          class="fixed inset-0 z-[80] sm:hidden"
          @click.self="moreMenuOpen = false"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/40" @click="moreMenuOpen = false" />

          <!-- Sheet -->
          <div class="absolute bottom-0 left-0 right-0 bg-vault-card border-t border-vault-border rounded-t-2xl pb-safe">
            <!-- Drag handle -->
            <div class="flex justify-center pt-3 pb-2">
              <div class="w-10 h-1 rounded-full bg-vault-muted/30" />
            </div>

            <!-- Grid of secondary pages -->
            <div class="grid grid-cols-4 gap-1 px-4 pb-4">
              <NuxtLink
                v-for="item in moreMenuItems"
                :key="item.to"
                :to="item.to"
                @click="moreMenuOpen = false"
                class="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors"
                :class="isActiveTab(item.to) ? 'bg-vault-accent/10 text-vault-accent' : 'text-vault-muted hover:bg-vault-bg active:bg-vault-bg'"
              >
                <div class="text-xl">{{ item.emoji }}</div>
                <span class="text-[11px] font-medium">{{ item.label }}</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Floating search button (non-home pages) -->
    <button
      v-if="user && !isLoginPage && route.path !== '/'"
      @click="searchOpen = true"
      class="fixed bottom-20 right-4 z-[60] w-11 h-11 rounded-full bg-vault-card border border-vault-border shadow-lg flex items-center justify-center text-vault-muted hover:text-vault-accent hover:border-vault-accent/40 transition-all active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    </button>

    <SearchOverlay :open="searchOpen" @close="searchOpen = false" />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const route = useRoute()
const { current, setTheme, initTheme, themePreviewColors } = useTheme()
const mobileThemeOpen = ref(false)
const moreMenuOpen = ref(false)
const searchOpen = ref(false)

// Close more menu on route change
watch(() => route.path, () => {
  moreMenuOpen.value = false
})

const themeList = [
  { key: 'dark' as const, label: 'Dark' },
  { key: 'white' as const, label: 'White Elegant' },
  { key: 'cream' as const, label: 'Cream Elegant' },
  { key: 'matcha' as const, label: 'Matcha' },
  { key: 'lilac' as const, label: 'Lilac' },
]

onMounted(() => {
  initTheme()
  // Global Ctrl+K / Cmd+K
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      searchOpen.value = true
    }
  }
  window.addEventListener('keydown', handler)
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
})

const isLoginPage = computed(() => route.path === '/login' || route.path === '/confirm')

const isActiveTab = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// Primary tabs — always visible on mobile + desktop
const primaryTabs = [
  {
    to: '/',
    label: 'Home',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>'
  },
  {
    to: '/dump',
    label: 'Dump',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>'
  },
  {
    to: '/todo',
    label: 'To-Do',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>'
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>'
  },
]

// Secondary tabs — visible on desktop, hidden on mobile (shown in More sheet)
const secondaryTabs = [
  {
    to: '/focus',
    label: 'Focus',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>'
  },
  {
    to: '/links',
    label: 'Links',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.862-2.04a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364l1.757 1.757" /></svg>'
  },
  {
    to: '/apps',
    label: 'Apps',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>'
  },
  {
    to: '/finance',
    label: 'Finance',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>'
  },
  {
    to: '/backlog',
    label: 'Backlog',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>'
  },
]

// "More" menu items for mobile sheet
const moreMenuItems = [
  { to: '/focus', label: 'Focus', emoji: '⏱️' },
  { to: '/links', label: 'Links', emoji: '🔗' },
  { to: '/apps', label: 'Apps', emoji: '⚡' },
  { to: '/finance', label: 'Finance', emoji: '💰' },
  { to: '/backlog', label: 'Backlog', emoji: '📦' },
  { to: '/settings', label: 'Settings', emoji: '⚙️' },
]

// Whether any secondary page is currently active (to highlight "More" button)
const isSecondaryActive = computed(() =>
  moreMenuItems.some(item => isActiveTab(item.to))
)
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child {
  transform: translateY(100%);
}
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
