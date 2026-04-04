export type ThemeName = 'dark' | 'white' | 'cream' | 'matcha' | 'lilac'

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
  positive: string
  negative: string
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
    positive: '#4ade80',
    negative: '#f87171',
  },
  white: {
    bg: '#ffffff',
    bg2: '#f8f8f6',
    card: '#f8f8f6',
    border: 'rgba(0,0,0,0.10)',
    text: '#1a1a1a',
    text2: '#3a3a3a',
    muted: '#555555',
    accent: '#1a1a1a',
    accentDim: '#333333',
    accentGlow: 'rgba(0, 0, 0, 0.06)',
    scrollTrack: '#f0f0ee',
    scrollThumb: '#d4d4d0',
    scrollThumbHover: '#b8b8b4',
    selectBg: '#f8f8f6',
    positive: '#16a34a',
    negative: '#dc2626',
  },
  cream: {
    bg: '#faf7f2',
    bg2: '#f3ede3',
    card: '#f3ede3',
    border: 'rgba(139,105,20,0.15)',
    text: '#2c2416',
    text2: '#4a3a28',
    muted: '#6a5538',
    accent: '#8b6914',
    accentDim: '#74580f',
    accentGlow: 'rgba(139, 105, 20, 0.12)',
    scrollTrack: '#f3ede3',
    scrollThumb: '#d9cdb8',
    scrollThumbHover: '#c4b59c',
    selectBg: '#f3ede3',
    positive: '#15803d',
    negative: '#b91c1c',
  },
  matcha: {
    bg: '#f2f5f0',
    bg2: '#e8ede4',
    card: '#e8ede4',
    border: 'rgba(74,124,89,0.15)',
    text: '#1e2d22',
    text2: '#354d3a',
    muted: '#4a6b52',
    accent: '#4a7c59',
    accentDim: '#3d6b4a',
    accentGlow: 'rgba(74, 124, 89, 0.15)',
    scrollTrack: '#e8ede4',
    scrollThumb: '#c5d4c9',
    scrollThumbHover: '#a8bfae',
    selectBg: '#e8ede4',
    positive: '#166534',
    negative: '#b91c1c',
  },
  lilac: {
    bg: '#f5f3f8',
    bg2: '#ede9f4',
    card: '#ede9f4',
    border: 'rgba(124,92,191,0.15)',
    text: '#1e1a2d',
    text2: '#3d3258',
    muted: '#6b50a0',
    accent: '#7c5cbf',
    accentDim: '#6b4dab',
    accentGlow: 'rgba(124, 92, 191, 0.15)',
    scrollTrack: '#ede9f4',
    scrollThumb: '#d0c7e3',
    scrollThumbHover: '#b8abd4',
    selectBg: '#ede9f4',
    positive: '#15803d',
    negative: '#b91c1c',
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
    root.style.setProperty('--v-positive', t.positive)
    root.style.setProperty('--v-negative', t.negative)
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
    matcha: '#4a7c59',
    lilac: '#7c5cbf',
  }

  return { current, setTheme, initTheme, themePreviewColors, themes }
}
