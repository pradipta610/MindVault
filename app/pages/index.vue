<template>
  <div class="min-h-screen bg-vault-bg flex flex-col px-4 py-8 max-w-4xl mx-auto w-full">

    <!-- Header -->
    <div class="mb-8 mt-2">
      <h1 class="font-serif text-3xl sm:text-4xl text-vault-accent tracking-wide mb-1">MindVault</h1>
      <p class="text-vault-muted text-sm">Hei, {{ userName }}! Mau ngapain hari ini?</p>
    </div>

    <!-- Workspace cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <!-- Dump -->
      <NuxtLink to="/dump" class="group bg-vault-card border border-vault-border rounded-2xl p-5 hover:border-vault-accent/30 transition-all hover:shadow-lg active:scale-[0.98]">
        <div class="flex items-start justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-vault-accent/10 flex items-center justify-center text-2xl">
            🗂️
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted group-hover:text-vault-accent transition-colors mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
        <h2 class="font-serif text-xl text-vault-text mb-1">Dump</h2>
        <p class="text-xs text-vault-muted mb-3">Tuang semua pikiran, ide, dan catatan bebas.</p>
        <div class="flex items-center gap-3">
          <span class="text-xs bg-vault-bg px-2.5 py-1 rounded-full text-vault-muted border border-vault-border">
            {{ notesCount }} notes
          </span>
          <span class="text-xs bg-vault-bg px-2.5 py-1 rounded-full text-vault-muted border border-vault-border">
            {{ tasksCount }} tasks
          </span>
        </div>
      </NuxtLink>

      <!-- Projects -->
      <NuxtLink to="/projects" class="group bg-vault-card border border-vault-border rounded-2xl p-5 hover:border-vault-accent/30 transition-all hover:shadow-lg active:scale-[0.98]">
        <div class="flex items-start justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">
            📁
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted group-hover:text-vault-accent transition-colors mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
        <h2 class="font-serif text-xl text-vault-text mb-1">Projects</h2>
        <p class="text-xs text-vault-muted mb-3">Kelola project, tasks, dan fitur per project.</p>
        <div class="flex items-center gap-3">
          <span class="text-xs bg-vault-bg px-2.5 py-1 rounded-full text-vault-muted border border-vault-border">
            {{ projectsCount }} active
          </span>
        </div>
      </NuxtLink>

      <!-- Catatan Keuangan -->
      <NuxtLink to="/finance" class="group bg-vault-card border border-vault-border rounded-2xl p-5 hover:border-vault-accent/30 transition-all hover:shadow-lg active:scale-[0.98] sm:col-span-2">
        <div class="flex items-start justify-between mb-4">
          <div class="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl">
            💰
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted group-hover:text-vault-accent transition-colors mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
        <h2 class="font-serif text-xl text-vault-text mb-1">Catatan Keuangan</h2>
        <p class="text-xs text-vault-muted mb-3">Catat pemasukan, pengeluaran, dan kelola keuangan.</p>
        <div class="flex items-center gap-3">
          <span class="text-xs bg-vault-bg px-2.5 py-1 rounded-full text-vault-muted border border-vault-border">
            Coming soon
          </span>
        </div>
      </NuxtLink>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })

const user = useSupabaseUser()
const client = useSupabaseClient()

const userName = computed(() => {
  return user.value?.user_metadata?.full_name?.split(' ')[0]
    || user.value?.email?.split('@')[0]
    || 'kamu'
})

const notesCount = ref(0)
const tasksCount = ref(0)
const projectsCount = ref(0)

watch(user, async (u) => {
  if (!u) return
  const [notesRes, tasksRes] = await Promise.all([
    client.from('notes').select('id', { count: 'exact', head: true }),
    client.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false),
  ])
  notesCount.value = notesRes.count ?? 0
  tasksCount.value = tasksRes.count ?? 0
}, { immediate: true })
</script>
