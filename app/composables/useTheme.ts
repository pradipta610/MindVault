export type ThemeName = 'dark' | 'white' | 'cream'

interface ThemeColors {
  bg: string
  bg2: string
  card: string
  border: string
  text: string
  text2: string
  muted: string
  accent: string
  accentDim: string
  accentGlow: string
  scrollTrack: string
  scrollThumb: string
  scrollThumbHover: string
  selectBg: string
}

const themes: Record<ThemeName, ThemeColors> = {
  dark: {
    bg: '#0f0f0d',
    bg2: '#141411',
    card: '#1a1a17',
    border: '#2a2a24',
    text: '#e8e5dd',
    text2: '#c5c2b8',
    muted: '#8a8778',
    accent: '#d4a853',
    accentDim: '#b8923f',
    accentGlow: 'rgba(212, 168, 83, 0.15)',
    scrollTrack: '#1a1a17',
    scrollThumb: '#2a2a24',
    scrollThumbHover: '#3a3a34',
    selectBg: '#1a1a17',
  },
  white: {
    bg: '#ffffff',
    bg2: '#f8f8f6',
    card: '#f8f8f6',
    border: 'rgba(0,0,0,0.08)',
    text: '#1a1a1a',
    text2: '#4a4a4a',
    muted: '#6b6b6b',
    accent: '#1a1a1a',
    accentDim: '#333333',
    accentGlow: 'rgba(0, 0, 0, 0.05)',
    scrollTrack: '#f0f0ee',
    scrollThumb: '#d4d4d0',
    scrollThumbHover: '#b8b8b4',
    selectBg: '#f8f8f6',
  },
  cream: {
    bg: '#faf7f2',
    bg2: '#f3ede3',
    card: '#f3ede3',
    border: 'rgba(139,105,20,0.12)',
    text: '#2c2416',
    text2: '#5c4d38',
    muted: '#8b7355',
    accent: '#8b6914',
    accentDim: '#74580f',
    accentGlow: 'rgba(139, 105, 20, 0.1)',
    scrollTrack: '#f3ede3',
    scrollThumb: '#d9cdb8',
    scrollThumbHover: '#c4b59c',
    selectBg: '#f3ede3',
  },
}

const THEME_KEY = 'mindvault-theme'

export const useTheme = () => {
  const current = useState<ThemeName>('theme', () => 'dark')

  const applyTheme = (name: ThemeName) => {
    const t = themes[name]
    const root = document.documentElement
    root.style.setProperty('--v-bg', t.bg)
    root.style.setProperty('--v-bg2', t.bg2)
    root.style.setProperty('--v-card', t.card)
    root.style.setProperty('--v-border', t.border)
    root.style.setProperty('--v-text', t.text)
    root.style.setProperty('--v-text2', t.text2)
    root.style.setProperty('--v-muted', t.muted)
    root.style.setProperty('--v-accent', t.accent)
    root.style.setProperty('--v-accent-dim', t.accentDim)
    root.style.setProperty('--v-accent-glow', t.accentGlow)
    root.style.setProperty('--v-scroll-track', t.scrollTrack)
    root.style.setProperty('--v-scroll-thumb', t.scrollThumb)
    root.style.setProperty('--v-scroll-thumb-hover', t.scrollThumbHover)
    root.style.setProperty('--v-select-bg', t.selectBg)
    root.setAttribute('data-theme', name)
  }

  const setTheme = (name: ThemeName) => {
    current.value = name
    applyTheme(name)
    if (import.meta.client) {
      localStorage.setItem(THEME_KEY, name)
    }
  }

  const initTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem(THEME_KEY) as ThemeName | null
      if (saved && themes[saved]) {
        current.value = saved
      }
      applyTheme(current.value)
    }
  }

  const themePreviewColors: Record<ThemeName, string> = {
    dark: '#0f0f0d',
    white: '#ffffff',
    cream: '#faf7f2',
  }

  return { current, setTheme, initTheme, themePreviewColors, themes }
}
