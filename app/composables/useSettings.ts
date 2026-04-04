export const useSettings = () => {
  const anthropicKey = ref('')

  const loadSettings = () => {
    if (import.meta.client) {
      anthropicKey.value = localStorage.getItem('mindvault_anthropic_key') || ''
    }
  }

  const saveAnthropicKey = (key: string) => {
    anthropicKey.value = key
    if (import.meta.client) {
      localStorage.setItem('mindvault_anthropic_key', key)
    }
  }

  const clearSettings = () => {
    anthropicKey.value = ''
    if (import.meta.client) {
      localStorage.removeItem('mindvault_anthropic_key')
    }
  }

  loadSettings()

  return { anthropicKey, loadSettings, saveAnthropicKey, clearSettings }
}
