<template>
  <div class="py-4 sm:py-6">

    <!-- Loading project -->
    <div v-if="projectLoading" class="flex justify-center py-16">
      <div class="w-6 h-6 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else-if="project">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <NuxtLink
            to="/projects"
            class="mt-1 w-8 h-8 flex items-center justify-center rounded-lg text-vault-muted hover:text-vault-accent hover:bg-vault-card transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-xl shrink-0">{{ project.icon || '📁' }}</span>
              <input
                v-if="editingName"
                v-model="editNameValue"
                ref="nameEditInput"
                class="flex-1 font-serif text-2xl text-vault-text bg-transparent border-b border-vault-accent/40 focus:outline-none"
                @keydown.enter="saveNameEdit"
                @keydown.esc="cancelNameEdit"
                @blur="saveNameEdit"
              />
              <h1
                v-else
                class="font-serif text-2xl text-vault-text cursor-pointer hover:text-vault-accent/80 transition-colors truncate"
                @click="startNameEdit"
                title="Klik untuk edit nama"
              >
                {{ project.name }}
              </h1>
            </div>
            <span v-if="project.status === 'done'" class="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full ml-7">
              Selesai
            </span>
          </div>
        </div>

        <!-- Desktop actions -->
        <div class="hidden sm:flex items-center gap-2 shrink-0 ml-3">
          <button @click="showEditModal = true" class="text-xs px-3 py-1.5 border border-vault-border text-vault-muted rounded-lg hover:bg-vault-card transition-colors">Edit</button>
          <button v-if="project.status === 'active'" @click="markDone" class="text-xs px-3 py-1.5 border border-green-400/30 text-green-400 rounded-lg hover:bg-green-400/10 transition-colors">
            Tandai Selesai
          </button>
          <button v-else @click="markActive" class="text-xs px-3 py-1.5 border border-vault-border text-vault-muted rounded-lg hover:bg-vault-card transition-colors">
            Aktifkan Lagi
          </button>
          <button @click="confirmDelete" class="text-xs px-3 py-1.5 border border-red-400/30 text-red-400 rounded-lg hover:bg-red-400/10 transition-colors">
            Hapus
          </button>
        </div>

        <!-- Mobile -->
        <button @click="showMenu = true" class="sm:hidden w-10 h-10 flex items-center justify-center text-vault-muted shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </button>
      </div>

      <!-- Progress Card -->
      <div v-if="topLevelTasks.length > 0" class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-vault-muted">Progress</span>
          <span class="text-xs font-semibold" :style="{ color: project.color }">
            {{ doneTasks }}/{{ topLevelTasks.length }} tasks selesai
          </span>
        </div>
        <div class="h-2 bg-vault-border rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" :style="{ width: progressPct + '%', backgroundColor: project.color }" />
        </div>
      </div>

      <!-- ═══ Tab bar ═══ -->
      <div class="flex gap-1 mb-5 overflow-x-auto no-scrollbar border-b border-vault-border">
        <button
          v-for="t in detailTabs"
          :key="t.key"
          @click="activeTab = t.key"
          class="px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
          :class="activeTab === t.key
            ? 'border-vault-accent text-vault-accent'
            : 'border-transparent text-vault-muted hover:text-vault-text'"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- ═══ TAB: Tasks ═══ -->
      <div v-if="activeTab === 'tasks'" class="mb-8">
        <div v-if="tasksLoading" class="flex justify-center py-6">
          <div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <div v-else class="space-y-2 mb-3">
          <div v-if="topLevelTasks.length === 0" class="text-sm text-vault-muted text-center py-4">
            Belum ada tasks. Tambah di bawah!
          </div>

          <div v-for="task in topLevelTasks" :key="task.id" class="bg-vault-card border border-vault-border rounded-xl overflow-hidden" :class="{ 'opacity-60': task.done }">
            <div class="flex items-center gap-3 px-4 py-3 group">
              <button
                @click="toggleTask(task)"
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                :class="task.done ? 'bg-vault-accent border-vault-accent' : 'border-vault-muted hover:border-vault-accent'"
              >
                <svg v-if="task.done" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </button>

              <span class="flex-1 text-sm text-vault-text" :class="{ 'line-through text-vault-muted': task.done }">
                {{ task.text }}
              </span>

              <!-- Collaborator badge -->
              <span
                v-if="task.collaborator"
                class="text-[10px] px-2 py-0.5 rounded-full bg-vault-accent/10 text-vault-accent font-medium shrink-0"
              >
                {{ task.collaborator }}
              </span>

              <button
                @click="toggleExpand(task.id)"
                class="flex items-center gap-1 shrink-0 transition-colors"
                :class="subtaskCount(task.id) > 0 ? 'text-vault-accent' : 'text-vault-muted hover:text-vault-text'"
              >
                <span v-if="subtaskCount(task.id) > 0" class="text-[10px] font-medium">
                  {{ doneSubtaskCount(task.id) }}/{{ subtaskCount(task.id) }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform duration-200" :class="isExpanded(task.id) ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              <button @click="removeTask(task.id)" class="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all w-7 h-7 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="isExpanded(task.id)" class="border-t border-vault-border bg-vault-bg/40">
              <div v-for="sub in subtasksOf(task.id)" :key="sub.id" class="flex items-center gap-3 px-4 py-2.5 group/sub" :class="{ 'opacity-60': sub.done }">
                <div class="w-4 shrink-0" />
                <button @click="toggleTask(sub)" class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors" :class="sub.done ? 'bg-vault-accent border-vault-accent' : 'border-vault-muted hover:border-vault-accent'">
                  <svg v-if="sub.done" xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 text-vault-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                </button>
                <span class="flex-1 text-xs text-vault-text" :class="{ 'line-through text-vault-muted': sub.done }">{{ sub.text }}</span>
                <span v-if="sub.collaborator" class="text-[9px] px-1.5 py-0.5 rounded-full bg-vault-accent/10 text-vault-accent font-medium shrink-0">{{ sub.collaborator }}</span>
                <button @click="removeTask(sub.id)" class="opacity-0 group-hover/sub:opacity-100 text-vault-muted hover:text-red-400 transition-all w-6 h-6 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form @submit.prevent="addSubtask(task.id)" class="flex items-center gap-2 px-4 py-2.5 border-t border-vault-border/50">
                <div class="w-4 shrink-0" />
                <input v-model="newSubtaskTexts[task.id]" placeholder="Tambah subtask..." class="flex-1 bg-transparent text-xs text-vault-text placeholder:text-vault-muted/50 focus:outline-none" />
                <button type="submit" :disabled="!newSubtaskTexts[task.id]?.trim()" class="text-[10px] font-semibold text-vault-accent disabled:opacity-30 px-2 py-1">+ Tambah</button>
              </form>

              <!-- Related content from same project -->
              <div v-if="taskRelatedLoaded[task.id]" class="border-t border-vault-border/50 px-4 py-3 space-y-2">
                <p class="text-[10px] font-semibold text-vault-muted uppercase tracking-wider">Related Content</p>
                <div v-if="!taskRelatedNotes.length && !taskRelatedLinks.length && !taskRelatedApps.length" class="text-[11px] text-vault-muted/60">Tidak ada konten terkait.</div>
                <div v-if="taskRelatedNotes.length > 0" class="space-y-1">
                  <p class="text-[10px] text-vault-accent font-medium">Notes ({{ taskRelatedNotes.length }})</p>
                  <div v-for="n in taskRelatedNotes.slice(0, 3)" :key="n.id" class="bg-vault-card/60 rounded-lg px-3 py-2">
                    <p class="text-[11px] text-vault-text line-clamp-2" v-html="n.raw" />
                  </div>
                </div>
                <div v-if="taskRelatedLinks.length > 0" class="space-y-1">
                  <p class="text-[10px] text-vault-accent font-medium">Links ({{ taskRelatedLinks.length }})</p>
                  <a v-for="l in taskRelatedLinks.slice(0, 3)" :key="l.id" :href="l.url" target="_blank" rel="noopener" class="flex items-center gap-2 bg-vault-card/60 rounded-lg px-3 py-2 hover:bg-vault-accent/5 transition-colors">
                    <img v-if="l.favicon" :src="l.favicon" class="w-4 h-4 rounded shrink-0" />
                    <span class="text-[11px] text-vault-text truncate">{{ l.title || l.url }}</span>
                  </a>
                </div>
                <div v-if="taskRelatedApps.length > 0" class="space-y-1">
                  <p class="text-[10px] text-vault-accent font-medium">Apps ({{ taskRelatedApps.length }})</p>
                  <div v-for="a in taskRelatedApps.slice(0, 3)" :key="a.id" class="bg-vault-card/60 rounded-lg px-3 py-2">
                    <span class="text-[11px] text-vault-text">{{ a.name }}</span>
                  </div>
                </div>
              </div>
              <div v-else-if="taskRelatedLoading[task.id]" class="border-t border-vault-border/50 px-4 py-3">
                <div class="flex items-center gap-2 text-[11px] text-vault-muted">
                  <div class="w-3 h-3 border border-vault-accent border-t-transparent rounded-full animate-spin" />
                  Loading related content...
                </div>
              </div>
            </div>
          </div>
        </div>

        <form @submit.prevent="addTask" class="flex gap-2">
          <input v-model="newTaskText" placeholder="Tambah task baru..." class="flex-1 bg-vault-card border border-vault-border rounded-xl px-4 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors" />
          <div class="relative">
            <input
              v-model="newTaskCollab"
              placeholder="@collab"
              class="w-28 bg-vault-card border border-vault-border rounded-xl px-3 py-2.5 text-xs text-vault-muted placeholder:text-vault-muted/40 focus:outline-none focus:border-vault-accent/30 transition-colors"
              @focus="showCollabSuggestions = true"
              @blur="setTimeout(() => showCollabSuggestions = false, 150)"
            />
            <div
              v-if="showCollabSuggestions && filteredCollabSuggestions.length > 0"
              class="absolute bottom-full mb-1 left-0 right-0 bg-vault-card border border-vault-border rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto"
            >
              <button
                v-for="s in filteredCollabSuggestions"
                :key="s"
                type="button"
                @mousedown.prevent="pickCollab(s)"
                class="w-full text-left px-3 py-1.5 text-xs text-vault-text hover:bg-vault-accent/10 transition-colors"
              >{{ s }}</button>
            </div>
          </div>
          <button type="submit" :disabled="!newTaskText.trim()" class="bg-vault-accent text-vault-bg px-4 rounded-xl font-semibold text-sm hover:bg-vault-accent-dim transition-colors disabled:opacity-30">+</button>
        </form>
      </div>

      <!-- ═══ TAB: Bugs ═══ -->
      <div v-if="activeTab === 'bugs'" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-vault-muted uppercase tracking-wider">Bug Reports</h2>
          <button @click="openBug(null)" class="text-xs text-vault-accent hover:text-vault-accent-dim transition-colors font-medium">+ Laporkan Bug</button>
        </div>
        <div v-if="bugsLoading" class="flex justify-center py-6"><div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" /></div>
        <div v-else-if="bugs.length === 0" class="text-sm text-vault-muted text-center py-6">Tidak ada bug yang dilaporkan.</div>
        <div v-else class="space-y-2">
          <div v-for="bug in bugs" :key="bug.id" @click="openBug(bug)" class="bg-vault-card border border-vault-border rounded-xl px-4 py-3 cursor-pointer hover:border-vault-accent/20 group transition-colors">
            <div class="flex items-start gap-3">
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5" :class="bugStatusClass(bug.status)">{{ bugStatusLabel(bug.status) }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-vault-text">{{ bug.title }}</p>
                <p v-if="bug.description" class="text-xs text-vault-muted mt-0.5 line-clamp-2">{{ bug.description }}</p>
              </div>
              <button @click.stop="removeBug(bug.id)" class="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all w-7 h-7 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: Project Notes ═══ -->
      <div v-if="activeTab === 'notes'" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-vault-muted uppercase tracking-wider">Notes</h2>
          <button @click="openNote(null)" class="text-xs text-vault-accent hover:text-vault-accent-dim transition-colors font-medium">+ Tambah</button>
        </div>
        <div v-if="notesLoading" class="flex justify-center py-6"><div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" /></div>
        <div v-else-if="notes.length === 0" class="text-sm text-vault-muted text-center py-6">Belum ada notes.</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="note in notes" :key="note.id" @click="openNote(note)" class="bg-vault-card border border-vault-border rounded-xl p-4 cursor-pointer hover:border-vault-accent/20 group transition-colors">
            <p class="text-sm text-vault-text line-clamp-4 whitespace-pre-line leading-relaxed">{{ note.raw }}</p>
            <div class="flex items-center justify-between mt-3">
              <span class="text-[10px] text-vault-muted">{{ formatDate(note.created_at) }}</span>
              <button @click.stop="removeNote(note.id)" class="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all text-[10px]">Hapus</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: Linked Dump Notes ═══ -->
      <div v-if="activeTab === 'dump'" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-vault-muted uppercase tracking-wider">Dump Notes</h2>
          <button @click="openDumpForProject" class="text-xs text-vault-accent hover:text-vault-accent-dim transition-colors font-medium">+ Add Dump</button>
        </div>
        <div v-if="linkedNotesLoading" class="flex justify-center py-6"><div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" /></div>
        <div v-else-if="linkedNotes.length === 0" class="text-sm text-vault-muted text-center py-6">Belum ada dump notes yang di-link.</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="note in linkedNotes" :key="note.id" class="bg-vault-card border border-vault-border rounded-xl p-4 transition-colors">
            <div v-if="note.tag" class="mb-2"><span class="text-[10px] px-2 py-0.5 rounded-full bg-vault-accent/10 text-vault-accent font-medium">{{ note.tag }}</span></div>
            <p class="text-sm text-vault-text line-clamp-4 whitespace-pre-line leading-relaxed" v-html="note.raw" />
            <span class="text-[10px] text-vault-muted block mt-2">{{ formatDate(note.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: Linked Links ═══ -->
      <div v-if="activeTab === 'links'" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-vault-muted uppercase tracking-wider">Links</h2>
          <button @click="showAddLinkInline = !showAddLinkInline" class="text-xs text-vault-accent hover:text-vault-accent-dim transition-colors font-medium">+ Add Link</button>
        </div>
        <form v-if="showAddLinkInline" @submit.prevent="addLinkInline" class="flex gap-2 mb-4">
          <input v-model="inlineLinkUrl" placeholder="https://example.com" class="flex-1 bg-vault-card border border-vault-border rounded-xl px-4 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors" />
          <button type="submit" :disabled="!inlineLinkUrl.trim() || inlineLinkSaving" class="bg-vault-accent text-vault-bg px-4 rounded-xl font-semibold text-sm hover:bg-vault-accent-dim transition-colors disabled:opacity-30">{{ inlineLinkSaving ? '...' : '+' }}</button>
        </form>
        <div v-if="linkedLinksLoading" class="flex justify-center py-6"><div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" /></div>
        <div v-else-if="linkedLinks.length === 0" class="text-sm text-vault-muted text-center py-6">Belum ada links yang di-link.</div>
        <div v-else class="space-y-2">
          <a v-for="link in linkedLinks" :key="link.id" :href="link.url" target="_blank" rel="noopener" class="flex items-center gap-3 bg-vault-card border border-vault-border rounded-xl px-4 py-3 hover:border-vault-accent/20 transition-colors">
            <img v-if="link.favicon" :src="link.favicon" class="w-5 h-5 rounded shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-vault-text font-medium truncate">{{ link.title || link.url }}</p>
              <p v-if="link.description" class="text-[11px] text-vault-muted truncate">{{ link.description }}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
          </a>
        </div>
      </div>

      <!-- ═══ TAB: Linked Apps ═══ -->
      <div v-if="activeTab === 'apps'" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-vault-muted uppercase tracking-wider">Apps</h2>
          <button @click="showAddAppInline = !showAddAppInline" class="text-xs text-vault-accent hover:text-vault-accent-dim transition-colors font-medium">+ Add App</button>
        </div>
        <div v-if="showAddAppInline" class="bg-vault-card border border-vault-border rounded-xl p-4 mb-4 space-y-2">
          <input v-model="inlineAppName" placeholder="Nama app" class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors" />
          <textarea v-model="inlineAppHtml" placeholder="Paste HTML..." rows="4" class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text font-mono placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 resize-none transition-colors" />
          <div class="flex justify-end">
            <button @click="addAppInline" :disabled="!inlineAppName.trim() || !inlineAppHtml.trim() || inlineAppSaving" class="bg-vault-accent text-vault-bg px-4 py-2 rounded-lg text-xs font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-30">{{ inlineAppSaving ? 'Saving...' : 'Simpan' }}</button>
          </div>
        </div>
        <div v-if="linkedAppsLoading" class="flex justify-center py-6"><div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" /></div>
        <div v-else-if="linkedApps.length === 0" class="text-sm text-vault-muted text-center py-6">Belum ada apps yang di-link.</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="app in linkedApps" :key="app.id" class="bg-vault-card border border-vault-border rounded-xl p-4">
            <p class="text-sm font-medium text-vault-text mb-1">{{ app.name }}</p>
            <p v-if="app.description" class="text-[11px] text-vault-muted line-clamp-2">{{ app.description }}</p>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: Focus Stats ═══ -->
      <div v-if="activeTab === 'focus'" class="mb-8 space-y-4">
        <div v-if="focusLoading" class="flex justify-center py-6"><div class="w-5 h-5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" /></div>
        <template v-else>
          <!-- Summary -->
          <div class="bg-vault-card border border-vault-border rounded-xl p-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <p class="text-2xl font-bold text-vault-text">{{ focusTotalMinutes }}</p>
                <p class="text-[10px] text-vault-muted mt-0.5">menit fokus</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-vault-text">{{ focusSessions.length }}</p>
                <p class="text-[10px] text-vault-muted mt-0.5">sesi</p>
              </div>
            </div>
          </div>

          <!-- Per-method breakdown -->
          <div v-if="focusMethodBreakdown.length > 0" class="bg-vault-card border border-vault-border rounded-xl p-4">
            <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Sesi per Metode</p>
            <div class="space-y-2">
              <div v-for="m in focusMethodBreakdown" :key="m.method" class="flex items-center justify-between text-xs">
                <span class="text-vault-text capitalize">{{ m.method }}</span>
                <span class="text-vault-accent font-semibold">{{ m.count }} sesi · {{ m.minutes }}m</span>
              </div>
            </div>
          </div>

          <!-- Weekly chart -->
          <div v-if="focusWeeklyData.length > 0" class="bg-vault-card border border-vault-border rounded-xl p-4">
            <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Minggu Ini</p>
            <div class="flex items-end justify-between gap-1 h-20">
              <div v-for="day in focusWeeklyData" :key="day.label" class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full rounded-t-md transition-all" :class="day.minutes > 0 ? 'bg-vault-accent/60' : 'bg-vault-border'" :style="{ height: day.barHeight + 'px', minHeight: '4px' }" />
                <span class="text-[9px] text-vault-muted">{{ day.label }}</span>
              </div>
            </div>
          </div>

          <!-- Session log -->
          <div v-if="focusSessions.length > 0" class="bg-vault-card border border-vault-border rounded-xl p-4">
            <p class="text-xs text-vault-muted font-medium uppercase tracking-wider mb-3">Log Sesi</p>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div v-for="s in focusSessions" :key="s.id" class="flex items-center justify-between text-xs py-1.5 border-b border-vault-border last:border-0">
                <div class="flex items-center gap-2">
                  <span class="text-vault-muted">{{ formatDate(s.started_at) }}</span>
                  <span class="text-vault-text font-medium">{{ s.duration_minutes }}m</span>
                </div>
                <span class="text-vault-muted capitalize">{{ s.method }}</span>
              </div>
            </div>
          </div>

          <div v-if="focusSessions.length === 0" class="text-sm text-vault-muted text-center py-6">Belum ada focus sessions untuk project ini.</div>
        </template>
      </div>
    </template>

    <!-- Project not found -->
    <div v-else class="text-center py-16">
      <p class="text-vault-muted mb-4">Project tidak ditemukan.</p>
      <NuxtLink to="/projects" class="text-vault-accent text-sm hover:underline">Kembali ke Projects</NuxtLink>
    </div>

    <!-- Mobile action sheet -->
    <ActionSheet v-if="showMenu" :actions="menuActions" @close="showMenu = false" @select="handleMenu" />

    <!-- Modals -->
    <Teleport to="body">

      <!-- Bug Modal -->
      <div v-if="showBugModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeBugModal" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col max-h-[85vh]">
          <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-vault-border shrink-0">
            <h2 class="font-serif text-lg text-vault-text">{{ editingBug ? 'Edit Bug' : 'Laporkan Bug' }}</h2>
            <button @click="closeBugModal" class="text-vault-muted hover:text-vault-text transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label class="block text-xs text-vault-muted mb-1.5">Judul Bug <span class="text-red-400">*</span></label>
              <input
                v-model="bugTitle"
                ref="bugTitleInput"
                placeholder="Contoh: Button submit tidak merespons"
                class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
              />
            </div>
            <div>
              <label class="block text-xs text-vault-muted mb-1.5">Deskripsi (opsional)</label>
              <textarea
                v-model="bugDescription"
                placeholder="Langkah reproduksi, expected vs actual behavior..."
                rows="4"
                class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 resize-none transition-colors"
              />
            </div>
            <div>
              <label class="block text-xs text-vault-muted mb-2">Status</label>
              <div class="flex gap-2">
                <button
                  v-for="s in bugStatuses"
                  :key="s.value"
                  @click="bugStatus = s.value"
                  class="flex-1 py-2 rounded-lg text-xs font-medium border transition-colors"
                  :class="bugStatus === s.value ? s.activeClass : 'bg-vault-bg border-vault-border text-vault-muted hover:text-vault-text'"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>
          <div class="flex gap-3 px-6 pb-6 shrink-0">
            <button @click="closeBugModal" class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors">
              Batal
            </button>
            <button @click="saveBug" :disabled="!bugTitle.trim()" class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30">
              Simpan
            </button>
          </div>
        </div>
      </div>

      <!-- Note Modal -->
      <div v-if="showNoteModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeNoteModal" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col max-h-[80vh]">
          <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-vault-border shrink-0">
            <h2 class="font-serif text-lg text-vault-text">{{ editingNote ? 'Edit Note' : 'Note Baru' }}</h2>
            <button @click="closeNoteModal" class="text-vault-muted hover:text-vault-text transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <textarea
              v-model="noteText"
              ref="noteTextarea"
              placeholder="Tulis note untuk project ini..."
              rows="8"
              class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 resize-none transition-colors"
            />
          </div>
          <div class="flex gap-3 px-6 pb-6 shrink-0">
            <button @click="closeNoteModal" class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors">
              Batal
            </button>
            <button @click="saveNote" :disabled="!noteText.trim()" class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30">
              Simpan
            </button>
          </div>
        </div>
      </div>

      <!-- Dump Modal (for adding dump notes to this project) -->
      <DumpModal
        v-if="showDumpModal"
        :note="null"
        :initial-project-id="projectId"
        @close="showDumpModal = false"
        @save="handleDumpSave"
      />

      <!-- Edit Project Modal -->
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showEditModal = false" />
        <div class="relative bg-vault-card border border-vault-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[85vh] overflow-y-auto">
          <h2 class="font-serif text-xl text-vault-text mb-5">Edit Project</h2>

          <label class="block text-xs text-vault-muted mb-2">Icon</label>
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-for="e in emojiOptions"
              :key="e"
              @click="editIcon = e"
              class="w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all"
              :class="editIcon === e ? 'border-vault-accent scale-110 bg-vault-accent/10' : 'border-transparent hover:bg-vault-bg hover:scale-105'"
            >{{ e }}</button>
          </div>

          <label class="block text-xs text-vault-muted mb-1.5">Nama</label>
          <input v-model="editProjectName" class="w-full bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text focus:outline-none focus:border-vault-accent/30 mb-5 transition-colors" />

          <label class="block text-xs text-vault-muted mb-2.5">Warna</label>
          <div class="flex gap-3 flex-wrap mb-6">
            <button
              v-for="c in colorOptions"
              :key="c"
              @click="editColor = c"
              class="w-8 h-8 rounded-full border-[3px] transition-all"
              :class="editColor === c ? 'scale-125 border-white/70' : 'border-transparent hover:scale-110'"
              :style="{ backgroundColor: c }"
            />
          </div>

          <div class="flex gap-3">
            <button @click="showEditModal = false" class="flex-1 py-2.5 text-sm text-vault-muted border border-vault-border rounded-xl hover:bg-vault-bg transition-colors">Batal</button>
            <button @click="saveEdit" :disabled="!editProjectName.trim()" class="flex-1 py-2.5 text-sm font-semibold bg-vault-accent text-vault-bg rounded-xl hover:bg-vault-accent-dim transition-colors disabled:opacity-30">Simpan</button>
          </div>
        </div>
      </div>

      <!-- Saving overlay -->
      <div v-if="saving" class="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="w-8 h-8 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
      </div>

    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { show: showToast } = useToast()
const {
  fetchProject, updateProject, deleteProject,
  fetchProjectTasks, createProjectTask, toggleProjectTask, deleteProjectTask,
  fetchProjectNotes, createProjectNote, updateProjectNote, deleteProjectNote,
  fetchProjectBugs, createProjectBug, updateProjectBug, deleteProjectBug,
  fetchLinkedNotes, fetchLinkedLinks, fetchLinkedApps, fetchLinkedFocusSessions,
} = useProjects()
const { addLink } = useLinks()
const { createApp: createAppSnippet } = useApps()
const { createNote: createDumpNote } = useNotes()

const projectId = route.params.id as string

// ── Tabs ──────────────────────────────────────────────────────────────────
type TabKey = 'tasks' | 'bugs' | 'notes' | 'dump' | 'links' | 'apps' | 'focus'
const detailTabs: { key: TabKey; label: string }[] = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'bugs', label: 'Bugs' },
  { key: 'notes', label: 'Notes' },
  { key: 'dump', label: 'Dump' },
  { key: 'links', label: 'Links' },
  { key: 'apps', label: 'Apps' },
  { key: 'focus', label: 'Focus' },
]
const activeTab = ref<TabKey>('tasks')

// ── Project ────────────────────────────────────────────────────────────────
const project = ref<any>(null)
const projectLoading = ref(true)
const saving = ref(false)

const editingName = ref(false)
const editNameValue = ref('')
const nameEditInput = ref<HTMLInputElement | null>(null)

const startNameEdit = () => {
  editNameValue.value = project.value?.name || ''
  editingName.value = true
  nextTick(() => nameEditInput.value?.focus())
}
const saveNameEdit = async () => {
  if (!editNameValue.value.trim() || editNameValue.value === project.value?.name) {
    editingName.value = false; return
  }
  await updateProject(projectId, { name: editNameValue.value.trim() })
  project.value = { ...project.value, name: editNameValue.value.trim() }
  editingName.value = false
}
const cancelNameEdit = () => { editingName.value = false }

// ── Edit Project Modal ────────────────────────────────────────────────────
const showEditModal = ref(false)
const editProjectName = ref('')
const editIcon = ref('📁')
const editColor = ref('#6366f1')
const emojiOptions = ['📁', '🚀', '💻', '🎨', '📚', '🎯', '💡', '🔧', '🌟', '🌱', '🏠', '🎵', '📷', '📝', '🧠', '❤️']
const colorOptions = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#f97316', '#14b8a6']

watch(showEditModal, (v) => {
  if (v && project.value) {
    editProjectName.value = project.value.name || ''
    editIcon.value = project.value.icon || '📁'
    editColor.value = project.value.color || '#6366f1'
  }
})

const saveEdit = async () => {
  if (!editProjectName.value.trim()) return
  saving.value = true
  try {
    await updateProject(projectId, {
      name: editProjectName.value.trim(),
      icon: editIcon.value,
      color: editColor.value,
    })
    project.value = {
      ...project.value,
      name: editProjectName.value.trim(),
      icon: editIcon.value,
      color: editColor.value,
    }
    showEditModal.value = false
    showToast('Project diupdate!')
  } finally { saving.value = false }
}

const markDone = async () => {
  saving.value = true
  try {
    await updateProject(projectId, { status: 'done' })
    project.value = { ...project.value, status: 'done' }
    showToast('Project ditandai selesai!')
  } finally { saving.value = false }
}
const markActive = async () => {
  saving.value = true
  try {
    await updateProject(projectId, { status: 'active' })
    project.value = { ...project.value, status: 'active' }
    showToast('Project diaktifkan kembali!')
  } finally { saving.value = false }
}
const confirmDelete = async () => {
  if (!confirm(`Hapus project "${project.value?.name}"? Semua data akan ikut terhapus.`)) return
  saving.value = true
  try {
    await deleteProject(projectId)
    showToast('Project dihapus')
    router.push('/projects')
  } finally { saving.value = false }
}

// ── Mobile menu ────────────────────────────────────────────────────────────
const showMenu = ref(false)
const menuActions = computed(() => [
  { id: 'edit', label: 'Edit Project', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>' },
  project.value?.status === 'active'
    ? { id: 'done', label: 'Tandai Selesai', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>' }
    : { id: 'active', label: 'Aktifkan Lagi', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-vault-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>' },
  { id: 'delete', label: 'Hapus Project', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>', destructive: true },
])
const handleMenu = (id: string) => {
  if (id === 'edit') showEditModal.value = true
  else if (id === 'done') markDone()
  else if (id === 'active') markActive()
  else if (id === 'delete') confirmDelete()
}

// ── Tasks ──────────────────────────────────────────────────────────────────
const tasks = ref<any[]>([])
const tasksLoading = ref(false)
const newTaskText = ref('')
const newTaskCollab = ref('')
const expandedTaskIds = ref<Record<string, boolean>>({})
const newSubtaskTexts = ref<Record<string, string>>({})

const topLevelTasks = computed(() => tasks.value.filter(t => !t.parent_id))
const subtasksOf = (parentId: string) => tasks.value.filter(t => t.parent_id === parentId)
const subtaskCount = (parentId: string) => tasks.value.filter(t => t.parent_id === parentId).length
const doneSubtaskCount = (parentId: string) => tasks.value.filter(t => t.parent_id === parentId && t.done).length
const isExpanded = (id: string) => !!expandedTaskIds.value[id]
const toggleExpand = (id: string) => {
  expandedTaskIds.value[id] = !expandedTaskIds.value[id]
  if (expandedTaskIds.value[id]) loadTaskRelated(id)
}

const doneTasks = computed(() => topLevelTasks.value.filter(t => t.done).length)
const progressPct = computed(() => {
  if (!topLevelTasks.value.length) return 0
  return Math.round((doneTasks.value / topLevelTasks.value.length) * 100)
})

const loadTasks = async () => {
  tasksLoading.value = true
  tasks.value = await fetchProjectTasks(projectId)
  tasksLoading.value = false
}

const addTask = async () => {
  if (!newTaskText.value.trim()) return
  const text = newTaskText.value.trim()
  const collab = newTaskCollab.value.trim() || undefined
  newTaskText.value = ''
  newTaskCollab.value = ''
  const task = await createProjectTask(projectId, text, undefined, collab)
  if (task) tasks.value.push(task)
}

const addSubtask = async (parentId: string) => {
  const text = newSubtaskTexts.value[parentId]?.trim()
  if (!text) return
  newSubtaskTexts.value[parentId] = ''
  const sub = await createProjectTask(projectId, text, parentId)
  if (sub) tasks.value.push(sub)
}

const toggleTask = async (task: any) => {
  const updated = await toggleProjectTask(task.id, !task.done)
  if (updated) {
    const idx = tasks.value.findIndex(t => t.id === task.id)
    if (idx !== -1) tasks.value[idx] = { ...tasks.value[idx], done: updated.done }
  }
}

const removeTask = async (taskId: string) => {
  tasks.value = tasks.value.filter(t => t.id !== taskId && t.parent_id !== taskId)
  await deleteProjectTask(taskId)
}

// ── Bugs ───────────────────────────────────────────────────────────────────
const bugs = ref<any[]>([])
const bugsLoading = ref(false)
const showBugModal = ref(false)
const editingBug = ref<any>(null)
const bugTitle = ref('')
const bugDescription = ref('')
const bugStatus = ref<'open' | 'in_progress' | 'fixed'>('open')
const bugTitleInput = ref<HTMLInputElement | null>(null)

const bugStatuses = [
  { value: 'open' as const, label: 'Open', activeClass: 'bg-red-500/10 border-red-400/40 text-red-400' },
  { value: 'in_progress' as const, label: 'In Progress', activeClass: 'bg-amber-500/10 border-amber-400/40 text-amber-400' },
  { value: 'fixed' as const, label: 'Fixed', activeClass: 'bg-green-500/10 border-green-400/40 text-green-400' },
]

const bugStatusLabel = (s: string) => bugStatuses.find(b => b.value === s)?.label ?? s
const bugStatusClass = (s: string) => {
  if (s === 'open') return 'bg-red-500/10 text-red-400'
  if (s === 'in_progress') return 'bg-amber-500/10 text-amber-400'
  return 'bg-green-500/10 text-green-400'
}

const loadBugs = async () => {
  bugsLoading.value = true
  bugs.value = await fetchProjectBugs(projectId)
  bugsLoading.value = false
}

const openBug = (bug: any | null) => {
  editingBug.value = bug
  bugTitle.value = bug?.title || ''
  bugDescription.value = bug?.description || ''
  bugStatus.value = (bug?.status as 'open' | 'in_progress' | 'fixed') || 'open'
  showBugModal.value = true
  nextTick(() => bugTitleInput.value?.focus())
}
const closeBugModal = () => { showBugModal.value = false; editingBug.value = null }

const saveBug = async () => {
  if (!bugTitle.value.trim()) return
  const payload = { title: bugTitle.value.trim(), description: bugDescription.value.trim(), status: bugStatus.value }
  if (editingBug.value) {
    const updated = await updateProjectBug(editingBug.value.id, payload)
    if (updated) {
      const idx = bugs.value.findIndex(b => b.id === editingBug.value.id)
      if (idx !== -1) bugs.value[idx] = { ...bugs.value[idx], ...updated }
    }
    showToast('Bug diupdate!')
  } else {
    const created = await createProjectBug(projectId, payload)
    if (created) bugs.value.unshift(created)
    showToast('Bug dilaporkan!')
  }
  closeBugModal()
}

const removeBug = async (bugId: string) => {
  bugs.value = bugs.value.filter(b => b.id !== bugId)
  await deleteProjectBug(bugId)
  showToast('Bug dihapus')
}

// ── Project Notes (project_notes table) ───────────────────────────────────
const notes = ref<any[]>([])
const notesLoading = ref(false)
const showNoteModal = ref(false)
const editingNote = ref<any>(null)
const noteText = ref('')
const noteTextarea = ref<HTMLTextAreaElement | null>(null)

const loadNotes = async () => {
  notesLoading.value = true
  notes.value = await fetchProjectNotes(projectId)
  notesLoading.value = false
}

const openNote = (note: any | null) => {
  editingNote.value = note
  noteText.value = note?.raw || ''
  showNoteModal.value = true
  nextTick(() => noteTextarea.value?.focus())
}
const closeNoteModal = () => { showNoteModal.value = false; editingNote.value = null; noteText.value = '' }

const saveNote = async () => {
  if (!noteText.value.trim()) return
  if (editingNote.value) {
    const updated = await updateProjectNote(editingNote.value.id, noteText.value.trim())
    if (updated) {
      const idx = notes.value.findIndex(n => n.id === editingNote.value.id)
      if (idx !== -1) notes.value[idx] = { ...notes.value[idx], raw: updated.raw }
    }
    showToast('Note disimpan!')
  } else {
    const created = await createProjectNote(projectId, noteText.value.trim())
    if (created) notes.value.unshift(created)
    showToast('Note ditambahkan!')
  }
  closeNoteModal()
}

const removeNote = async (noteId: string) => {
  notes.value = notes.value.filter(n => n.id !== noteId)
  await deleteProjectNote(noteId)
  showToast('Note dihapus')
}

// ── Linked Dump Notes ─────────────────────────────────────────────────────
const linkedNotes = ref<any[]>([])
const linkedNotesLoading = ref(false)
const linkedNotesLoaded = ref(false)

const loadLinkedNotes = async () => {
  if (linkedNotesLoaded.value) return
  linkedNotesLoading.value = true
  linkedNotes.value = await fetchLinkedNotes(projectId)
  linkedNotesLoading.value = false
  linkedNotesLoaded.value = true
}

// ── Linked Links ──────────────────────────────────────────────────────────
const linkedLinks = ref<any[]>([])
const linkedLinksLoading = ref(false)
const linkedLinksLoaded = ref(false)

const loadLinkedLinks = async () => {
  if (linkedLinksLoaded.value) return
  linkedLinksLoading.value = true
  linkedLinks.value = await fetchLinkedLinks(projectId)
  linkedLinksLoading.value = false
  linkedLinksLoaded.value = true
}

// ── Linked Apps ───────────────────────────────────────────────────────────
const linkedApps = ref<any[]>([])
const linkedAppsLoading = ref(false)
const linkedAppsLoaded = ref(false)

const loadLinkedApps = async () => {
  if (linkedAppsLoaded.value) return
  linkedAppsLoading.value = true
  linkedApps.value = await fetchLinkedApps(projectId)
  linkedAppsLoading.value = false
  linkedAppsLoaded.value = true
}

// ── Focus Sessions ────────────────────────────────────────────────────────
const focusSessions = ref<any[]>([])
const focusLoading = ref(false)
const focusLoaded = ref(false)

const focusTotalMinutes = computed(() => focusSessions.value.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0))

const focusMethodBreakdown = computed(() => {
  const map: Record<string, { count: number; minutes: number }> = {}
  for (const s of focusSessions.value) {
    if (!map[s.method]) map[s.method] = { count: 0, minutes: 0 }
    map[s.method]!.count++
    map[s.method]!.minutes += s.duration_minutes || 0
  }
  return Object.entries(map).map(([method, v]) => ({ method, ...(v as { count: number; minutes: number }) }))
})

const focusWeeklyData = computed(() => {
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  const dow = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1))

  const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const dayMinutes: number[] = [0, 0, 0, 0, 0, 0, 0]

  for (const s of focusSessions.value) {
    const d = new Date(s.started_at)
    if (d >= weekStart) {
      let idx = d.getDay() - 1
      if (idx < 0) idx = 6
      dayMinutes[idx] += s.duration_minutes || 0
    }
  }
  const maxM = Math.max(...dayMinutes, 1)
  return dayLabels.map((label, i) => ({
    label,
    minutes: dayMinutes[i]!,
    barHeight: Math.max(4, (dayMinutes[i]! / maxM) * 64),
  }))
})

const loadFocus = async () => {
  if (focusLoaded.value) return
  focusLoading.value = true
  focusSessions.value = await fetchLinkedFocusSessions(projectId)
  focusLoading.value = false
  focusLoaded.value = true
}

// ── Task related content ──────────────────────────────────────────────────
const taskRelatedNotes = ref<any[]>([])
const taskRelatedLinks = ref<any[]>([])
const taskRelatedApps = ref<any[]>([])
const taskRelatedLoading = ref<Record<string, boolean>>({})
const taskRelatedLoaded = ref<Record<string, boolean>>({})

const loadTaskRelated = async (taskId: string) => {
  if (taskRelatedLoaded.value[taskId]) return
  taskRelatedLoading.value[taskId] = true
  try {
    // Reuse already-loaded linked data if available, otherwise fetch
    if (linkedNotesLoaded.value) {
      taskRelatedNotes.value = linkedNotes.value
    } else {
      taskRelatedNotes.value = await fetchLinkedNotes(projectId)
      linkedNotes.value = taskRelatedNotes.value
      linkedNotesLoaded.value = true
    }
    if (linkedLinksLoaded.value) {
      taskRelatedLinks.value = linkedLinks.value
    } else {
      taskRelatedLinks.value = await fetchLinkedLinks(projectId)
      linkedLinks.value = taskRelatedLinks.value
      linkedLinksLoaded.value = true
    }
    if (linkedAppsLoaded.value) {
      taskRelatedApps.value = linkedApps.value
    } else {
      taskRelatedApps.value = await fetchLinkedApps(projectId)
      linkedApps.value = taskRelatedApps.value
      linkedAppsLoaded.value = true
    }
  } finally {
    taskRelatedLoading.value[taskId] = false
    taskRelatedLoaded.value[taskId] = true
  }
}

// ── Inline add: Dump ──────────────────────────────────────────────────────
const showDumpModal = ref(false)

const openDumpForProject = () => {
  showDumpModal.value = true
}

const handleDumpSave = async (data: { raw: string; tag: string; projectId?: string | null }) => {
  showDumpModal.value = false
  saving.value = true
  try {
    const note = await createDumpNote({ raw: data.raw, tag: data.tag || '', project_id: data.projectId || projectId })
    if (note) {
      linkedNotes.value.unshift(note)
      showToast('Dump note ditambahkan ke project!')
    }
  } catch (e) {
    showToast('Gagal menyimpan dump note')
  } finally { saving.value = false }
}

// ── Inline add: Links ─────────────────────────────────────────────────────
const showAddLinkInline = ref(false)
const inlineLinkUrl = ref('')
const inlineLinkSaving = ref(false)

const addLinkInline = async () => {
  let url = inlineLinkUrl.value.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  inlineLinkSaving.value = true
  try {
    const link = await addLink(url, projectId)
    if (link) {
      linkedLinks.value.unshift(link)
      inlineLinkUrl.value = ''
      showAddLinkInline.value = false
      showToast('Link ditambahkan ke project!')
    }
  } catch (e) {
    showToast('Gagal menyimpan link')
  } finally { inlineLinkSaving.value = false }
}

// ── Inline add: Apps ──────────────────────────────────────────────────────
const showAddAppInline = ref(false)
const inlineAppName = ref('')
const inlineAppHtml = ref('')
const inlineAppSaving = ref(false)

const addAppInline = async () => {
  if (!inlineAppName.value.trim() || !inlineAppHtml.value.trim()) return
  inlineAppSaving.value = true
  try {
    const app = await createAppSnippet({
      name: inlineAppName.value.trim(),
      html: inlineAppHtml.value,
      project_id: projectId,
    })
    if (app) {
      linkedApps.value.unshift(app)
      inlineAppName.value = ''
      inlineAppHtml.value = ''
      showAddAppInline.value = false
      showToast('App ditambahkan ke project!')
    }
  } catch (e) {
    showToast('Gagal menyimpan app')
  } finally { inlineAppSaving.value = false }
}

// ── Collaborator autocomplete ─────────────────────────────────────────────
const collabSuggestions = computed(() => {
  const set = new Set<string>()
  for (const t of tasks.value) {
    if (t.collaborator) set.add(t.collaborator)
  }
  return Array.from(set).sort()
})
const showCollabSuggestions = ref(false)
const filteredCollabSuggestions = computed(() => {
  const q = newTaskCollab.value.trim().toLowerCase()
  if (!q) return collabSuggestions.value
  return collabSuggestions.value.filter(s => s.toLowerCase().includes(q))
})
const pickCollab = (name: string) => {
  newTaskCollab.value = name
  showCollabSuggestions.value = false
}

// ── Lazy-load tabs ────────────────────────────────────────────────────────
watch(activeTab, (tab) => {
  if (tab === 'dump') loadLinkedNotes()
  else if (tab === 'links') loadLinkedLinks()
  else if (tab === 'apps') loadLinkedApps()
  else if (tab === 'focus') loadFocus()
})

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  projectLoading.value = true
  project.value = await fetchProject(projectId)
  projectLoading.value = false
  if (!project.value) return
  await Promise.all([loadTasks(), loadBugs(), loadNotes()])
})
</script>
