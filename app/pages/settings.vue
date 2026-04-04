<template>
  <div class="py-4 sm:py-6">
    <div class="flex items-center gap-3 mb-6 sm:mb-8">
      <button @click="$router.back()" class="text-vault-muted hover:text-vault-text transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>
      <h2 class="font-serif text-2xl sm:text-3xl text-vault-text">Settings</h2>
    </div>

    <div v-if="user" class="bg-vault-card border border-vault-border rounded-xl p-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-vault-accent/20 flex items-center justify-center">
          <span class="text-vault-accent font-semibold text-sm">
            {{ user.email?.charAt(0).toUpperCase() }}
          </span>
        </div>
        <div>
          <p class="text-sm text-vault-text font-medium">{{ user.user_metadata?.full_name || 'User' }}</p>
          <p class="text-xs text-vault-muted">{{ user.email }}</p>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Theme Switcher -->
      <div class="bg-vault-card border border-vault-border rounded-xl p-4">
        <label class="block text-sm text-vault-text font-medium mb-3">Tema</label>
        <div class="space-y-1">
          <button
            v-for="t in themeList"
            :key="t.key"
            @click="setTheme(t.key)"
            class="w-full flex items-center gap-3 px-3 min-h-[44px] rounded-lg transition-colors"
            :class="currentTheme === t.key ? 'bg-vault-accent/10' : 'hover:bg-vault-bg'"
          >
            <div
              class="w-6 h-6 rounded-full border-2 shrink-0"
              :class="currentTheme === t.key ? 'border-vault-accent' : 'border-vault-border'"
              :style="{ backgroundColor: themePreviewColors[t.key] }"
            />
            <span class="flex-1 text-sm text-vault-text text-left">{{ t.label }}</span>
            <svg
              v-if="currentTheme === t.key"
              xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-vault-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
        </div>
      </div>

      <div class="bg-vault-card border border-vault-border rounded-xl p-4">
        <label class="block text-sm text-vault-text font-medium mb-1">Anthropic API Key</label>
        <p class="text-xs text-vault-muted mb-3">
          Digunakan untuk AI processing pada fitur Dump. Key disimpan di browser kamu saja.
        </p>
        <div class="flex gap-2">
          <input
            v-model="apiKeyInput"
            :type="showKey ? 'text' : 'password'"
            placeholder="sk-ant-..."
            class="flex-1 bg-vault-bg border border-vault-border rounded-lg px-3 py-2.5 text-sm text-vault-text placeholder:text-vault-muted/40 focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
          <button
            @click="showKey = !showKey"
            class="px-3 bg-vault-bg border border-vault-border rounded-lg text-vault-muted hover:text-vault-text transition-colors"
          >
            <svg v-if="!showKey" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </button>
        </div>
        <button
          @click="handleSaveKey"
          class="mt-3 bg-vault-accent text-vault-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors w-full"
        >
          {{ saved ? 'Tersimpan!' : 'Simpan Key' }}
        </button>
      </div>

      <div class="bg-vault-card border border-vault-border rounded-xl p-4">
        <label class="block text-sm text-vault-text font-medium mb-3">Kategori</label>

        <div v-if="!hasCategories && !seedDismissed" class="mb-4 border border-vault-accent/20 rounded-lg p-4 text-center space-y-3">
          <p class="text-sm text-vault-text">Mau mulai dengan kategori default kami?</p>
          <p class="text-xs text-vault-muted"> freelance, belajar, personal, misc</p>
          <div class="flex gap-2 justify-center">
            <button
              @click="handleSeedDefaults"
              class="bg-vault-accent text-vault-bg px-4 py-2 rounded-lg text-xs font-semibold hover:bg-vault-accent-dim transition-colors"
            >
              Ya, pakai default
            </button>
            <button
              @click="seedDismissed = true"
              class="bg-vault-bg border border-vault-border text-vault-muted px-4 py-2 rounded-lg text-xs font-medium hover:text-vault-text transition-colors"
            >
              Tidak, buat sendiri
            </button>
          </div>
        </div>

        <div v-if="!hasCategories && seedDismissed" class="mb-4 text-center py-6">
          <p class="text-vault-muted text-sm">Belum ada kategori. Tambah kategori pertamamu!</p>
        </div>

        <div v-if="allCategories.length > 0" class="space-y-2 mb-4">
          <div
            v-for="cat in allCategories"
            :key="cat.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-vault-bg group"
          >
            <span class="text-base">{{ cat.icon }}</span>
            <div class="flex-1 flex items-center gap-2">
              <div class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: cat.color }" />
              <span class="text-sm text-vault-text">{{ cat.name }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="startEdit(cat)"
                class="sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-vault-accent transition-all p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
              <button
                @click="handleDeleteCategory(cat.id, cat.name)"
                class="sm:opacity-0 sm:group-hover:opacity-100 text-vault-muted hover:text-red-400 transition-all p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="border border-vault-border rounded-lg p-3 space-y-3">
          <p class="text-xs text-vault-muted font-medium">
            {{ editingCat ? 'Edit Kategori' : 'Tambah Kategori' }}
          </p>
          <input
            v-model="catForm.name"
            placeholder="Nama kategori"
            :disabled="false"
            class="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text placeholder:text-vault-muted/50 focus:outline-none focus:border-vault-accent/30 transition-colors"
          />
          <div>
            <p class="text-[10px] text-vault-muted mb-1.5">Warna</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in presetColors"
                :key="color"
                @click="catForm.color = color"
                class="w-7 h-7 rounded-full border-2 transition-all"
                :class="catForm.color === color ? 'scale-110 border-vault-text' : 'border-transparent hover:scale-105'"
                :style="{ backgroundColor: color }"
              />
            </div>
          </div>
          <div>
            <p class="text-[10px] text-vault-muted mb-1.5">Icon</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="emoji in presetEmojis"
                :key="emoji"
                @click="catForm.icon = emoji"
                class="w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-all"
                :class="catForm.icon === emoji ? 'border-vault-accent bg-vault-accent/10 scale-110' : 'border-vault-border hover:bg-vault-bg'"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              v-if="editingCat"
              @click="cancelEdit"
              class="flex-1 bg-vault-bg border border-vault-border text-vault-muted px-3 py-2 rounded-lg text-xs font-medium hover:text-vault-text transition-colors"
            >
              Batal
            </button>
            <button
              @click="handleSaveCategory"
              :disabled="!catForm.name.trim()"
              class="flex-1 bg-vault-accent text-vault-bg px-3 py-2 rounded-lg text-xs font-semibold hover:bg-vault-accent-dim transition-colors disabled:opacity-30"
            >
              {{ editingCat ? 'Update' : 'Tambah' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="bg-vault-card border border-vault-border rounded-xl p-4">
        <label class="block text-sm text-vault-text font-medium mb-1">Notifikasi</label>
        <p class="text-xs text-vault-muted mb-3">Aktifkan notifikasi untuk reminder dan deadline.</p>
        <div v-if="!notifSupported" class="text-xs text-vault-muted">Browser tidak mendukung notifikasi.</div>
        <template v-else>
          <p class="text-xs mb-3" :class="notifPermission === 'granted' ? 'text-green-400' : 'text-vault-muted'">
            Status: {{ notifPermission === 'granted' ? 'Aktif' : notifPermission === 'denied' ? 'Diblokir (ubah di settings browser)' : 'Belum diaktifkan' }}
          </p>
          <button
            v-if="notifPermission !== 'granted'"
            @click="handleEnableNotif"
            class="w-full bg-vault-accent text-vault-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-vault-accent-dim transition-colors"
          >
            Aktifkan Notifikasi
          </button>
          <button
            v-else
            @click="handleTestNotif"
            class="w-full bg-vault-bg border border-vault-border text-vault-muted px-4 py-2 rounded-lg text-sm font-medium hover:text-vault-text transition-colors"
          >
            Kirim Test Notifikasi
          </button>
        </template>
      </div>

      <button
        @click="handleLogout"
        class="w-full bg-vault-card border border-red-400/20 text-red-400 rounded-xl px-4 py-3 text-sm font-medium hover:bg-red-400/5 transition-colors"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const client = useSupabaseClient()
const user = useSupabaseUser()
const { anthropicKey, saveAnthropicKey } = useSettings()
const { allCategories, hasCategories, fetchCategories, seedDefaults, createCategory, updateCategory, deleteCategory, injectAllStyles } = useCategories()
const { current: currentTheme, setTheme, themePreviewColors } = useTheme()
const { show: showToast } = useToast()
const { isSupported: notifSupported, permission: notifPermission, requestPermission, showNow } = useNotifications()

const themeList = [
  { key: 'dark' as const, label: 'Dark' },
  { key: 'white' as const, label: 'White Elegant' },
  { key: 'cream' as const, label: 'Cream Elegant' },
  { key: 'matcha' as const, label: 'Matcha' },
  { key: 'lilac' as const, label: 'Lilac' },
]

const apiKeyInput = ref(anthropicKey.value)
const showKey = ref(false)
const saved = ref(false)
const editingCat = ref<any>(null)
const seedDismissed = ref(false)

const catForm = reactive({ name: '', color: '#4ade80', icon: '📌' })

const presetColors = [
  '#d4a853', '#53a8d4', '#a8d453', '#d453a8', '#a853d4',
  '#e06c75', '#61afef', '#98c379', '#e5c07b', '#c678dd',
]

const presetEmojis = [
  '📌', '🔥', '💡', '🎯', '🚀', '💼', '📚', '🎨', '🎮', '🏠',
  '💰', '🧠', '🎵', '📱', '🛠️', '❤️', '⭐', '🌍', '🏃', '🍕',
]

watch(user, (u) => {
  if (u) fetchCategories()
}, { immediate: true })

const handleSaveKey = () => {
  saveAnthropicKey(apiKeyInput.value)
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}

const startEdit = (cat: any) => {
  editingCat.value = cat
  catForm.name = cat.name
  catForm.color = cat.color
  catForm.icon = cat.icon
}

const cancelEdit = () => {
  editingCat.value = null
  catForm.name = ''
  catForm.color = '#4ade80'
  catForm.icon = '📌'
}

const handleSeedDefaults = async () => {
  await seedDefaults()
  showToast('Kategori default ditambahkan!')
}

const handleSaveCategory = async () => {
  if (!catForm.name.trim()) return
  if (editingCat.value) {
    await updateCategory(editingCat.value.id, catForm.name, catForm.color, catForm.icon)
    injectAllStyles()
    showToast('Kategori diupdate!')
    cancelEdit()
  } else {
    const result = await createCategory(catForm.name, catForm.color, catForm.icon)
    if (result) {
      injectAllStyles()
      showToast('Kategori ditambahkan!')
      catForm.name = ''
      catForm.color = '#4ade80'
      catForm.icon = '📌'
    } else {
      showToast('Nama kategori sudah ada', 'error')
    }
  }
}

const handleDeleteCategory = async (id: string, name: string) => {
  if (!confirm(`Hapus kategori "${name}"? Semua notes dan tasks dengan kategori ini akan jadi uncategorized.`)) return
  await deleteCategory(id)
  showToast('Kategori dihapus')
}

const handleEnableNotif = async () => {
  const result = await requestPermission()
  if (result === 'granted') showToast('Notifikasi aktif!')
  else showToast('Notifikasi tidak diizinkan', 'error')
}

const handleTestNotif = async () => {
  await showNow('MindVault', 'Notifikasi berjalan dengan baik!')
  showToast('Test notifikasi dikirim')
}

const handleLogout = async () => {
  await client.auth.signOut()
  navigateTo('/login')
}
</script>
