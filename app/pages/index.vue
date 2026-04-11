<template>
  <div class="py-4 sm:py-6">

    <!-- Header -->
    <div class="mb-6">
      <h1 class="font-serif text-2xl sm:text-3xl text-vault-text mb-1">Hei, {{ userName }}!</h1>
      <p class="text-vault-muted text-sm">Mau ngapain hari ini?</p>
    </div>

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
          �
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

watch(user, async (u) => {
  if (!u) return
  const [notesRes, tasksRes, projectsRes, linksRes, appsRes] = await Promise.all([
    client.from('notes').select('id', { count: 'exact', head: true }),
    client.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false),
    client.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    client.from('links').select('id', { count: 'exact', head: true }),
    client.from('apps').select('id', { count: 'exact', head: true }),
  ])
  notesCount.value = notesRes.count ?? 0
  tasksCount.value = tasksRes.count ?? 0
  projectsCount.value = projectsRes.count ?? 0
  linksCount.value = linksRes.count ?? 0
  appsCount.value = appsRes.count ?? 0
}, { immediate: true })
</script>
