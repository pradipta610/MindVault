<template>
  <div class="py-4 sm:py-6">

    <!-- Header -->
    <div class="mb-5">
      <h1 class="font-serif text-2xl sm:text-3xl text-vault-text mb-1">Hei, {{ userName }}!</h1>
      <p class="text-vault-muted text-sm">Mau ngapain hari ini?</p>
    </div>

    <!-- Search bar -->
    <button
      @click="searchOpen = true"
      class="w-full flex items-center gap-3 bg-vault-card border border-vault-border rounded-xl px-4 py-3 mb-5 text-left hover:border-vault-accent/30 transition-colors group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted group-hover:text-vault-accent transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <span class="text-sm text-vault-muted/60 flex-1">Cari di semua data...</span>
      <kbd class="hidden sm:inline-flex text-[10px] text-vault-muted/40 border border-vault-border rounded px-1.5 py-0.5 font-mono">Ctrl K</kbd>
    </button>

    <SearchOverlay :open="searchOpen" @close="searchOpen = false" />

    <!-- Workspace cards -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4">

      <!-- Dump -->
      <NuxtLink to="/dump" class="group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/30 transition-all active:scale-[0.98]">
        <div class="w-10 h-10 rounded-xl bg-vault-accent/10 flex items-center justify-center text-xl mb-3">
          🗂️
        </div>
        <h2 class="font-semibold text-sm text-vault-text mb-0.5">Dump</h2>
        <p class="text-[11px] text-vault-muted leading-relaxed">Pikiran, ide, catatan</p>
        <span class="inline-block mt-2 text-[11px] bg-vault-bg px-2 py-0.5 rounded-full text-vault-muted border border-vault-border">
          {{ notesCount }} notes
        </span>
      </NuxtLink>

      <!-- Todo -->
      <NuxtLink to="/todo" class="group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/30 transition-all active:scale-[0.98]">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl mb-3">
          ✅
        </div>
        <h2 class="font-semibold text-sm text-vault-text mb-0.5">To-Do</h2>
        <p class="text-[11px] text-vault-muted leading-relaxed">Task harian</p>
        <span class="inline-block mt-2 text-[11px] bg-vault-bg px-2 py-0.5 rounded-full text-vault-muted border border-vault-border">
          {{ tasksCount }} tasks
        </span>
      </NuxtLink>

      <!-- Projects -->
      <NuxtLink to="/projects" class="group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/30 transition-all active:scale-[0.98]">
        <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl mb-3">
          📁
        </div>
        <h2 class="font-semibold text-sm text-vault-text mb-0.5">Projects</h2>
        <p class="text-[11px] text-vault-muted leading-relaxed">Kelola project & fitur</p>
        <span class="inline-block mt-2 text-[11px] bg-vault-bg px-2 py-0.5 rounded-full text-vault-muted border border-vault-border">
          {{ projectsCount }} active
        </span>
      </NuxtLink>

      <!-- Finance -->
      <NuxtLink to="/finance" class="group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/30 transition-all active:scale-[0.98]">
        <div class="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl mb-3">
          💰
        </div>
        <h2 class="font-semibold text-sm text-vault-text mb-0.5">Finance</h2>
        <p class="text-[11px] text-vault-muted leading-relaxed">Pemasukan & pengeluaran</p>
      </NuxtLink>

      <!-- Links -->
      <NuxtLink to="/links" class="group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/30 transition-all active:scale-[0.98]">
        <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl mb-3">
          🔗
        </div>
        <h2 class="font-semibold text-sm text-vault-text mb-0.5">Links</h2>
        <p class="text-[11px] text-vault-muted leading-relaxed">Simpan & preview URL</p>
        <span class="inline-block mt-2 text-[11px] bg-vault-bg px-2 py-0.5 rounded-full text-vault-muted border border-vault-border">
          {{ linksCount }} links
        </span>
      </NuxtLink>

      <!-- Apps -->
      <NuxtLink to="/apps" class="group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/30 transition-all active:scale-[0.98]">
        <div class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl mb-3">
          ⚡
        </div>
        <h2 class="font-semibold text-sm text-vault-text mb-0.5">Apps</h2>
        <p class="text-[11px] text-vault-muted leading-relaxed">HTML snippets & tools</p>
        <span class="inline-block mt-2 text-[11px] bg-vault-bg px-2 py-0.5 rounded-full text-vault-muted border border-vault-border">
          {{ appsCount }} apps
        </span>
      </NuxtLink>

      <!-- Backlog (full width) -->
      <NuxtLink to="/backlog" class="col-span-2 group bg-vault-card border border-vault-border rounded-xl p-4 hover:border-vault-accent/30 transition-all active:scale-[0.98] flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-vault-muted/10 flex items-center justify-center text-xl shrink-0">
          📦
        </div>
        <div>
          <h2 class="font-semibold text-sm text-vault-text mb-0.5">Backlog</h2>
          <p class="text-[11px] text-vault-muted leading-relaxed">Item yang sudah selesai & arsip</p>
        </div>
      </NuxtLink>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const client = useSupabaseClient()
const searchOpen = ref(false)
const { register: registerSync } = useBackgroundSync()

// Ctrl+K / Cmd+K keyboard shortcut
onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      searchOpen.value = true
    }
  }
  window.addEventListener('keydown', handler)
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
})

const userName = computed(() => {
  return user.value?.user_metadata?.full_name?.split(' ')[0]
    || user.value?.email?.split('@')[0]
    || 'kamu'
})

const notesCount = ref(0)
const tasksCount = ref(0)
const projectsCount = ref(0)
const linksCount = ref(0)
const appsCount = ref(0)

const safeCount = async (query: any): Promise<number> => {
  try {
    const res = await query
    return res.count ?? 0
  } catch { return 0 }
}

const loadCounts = async () => {
  if (!user.value) return
  const [notes, tasks, proj, links, apps] = await Promise.all([
    safeCount(client.from('notes').select('id', { count: 'exact', head: true })),
    safeCount(client.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false)),
    safeCount(client.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    safeCount(client.from('links').select('id', { count: 'exact', head: true })),
    safeCount(client.from('apps').select('id', { count: 'exact', head: true })),
  ])
  notesCount.value = notes
  tasksCount.value = tasks
  projectsCount.value = proj
  linksCount.value = links
  appsCount.value = apps
}

watch(user, (u) => { if (u) loadCounts() }, { immediate: true })
registerSync(loadCounts)
</script>
