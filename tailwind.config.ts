import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: 'var(--v-bg)',
          bg2: 'var(--v-bg2)',
          card: 'var(--v-card)',
          border: 'var(--v-border)',
          text: 'var(--v-text)',
          text2: 'var(--v-text2)',
          muted: 'var(--v-muted)',
          accent: 'var(--v-accent)',
          'accent-dim': 'var(--v-accent-dim)',
          'accent-glow': 'var(--v-accent-glow)',
          positive: 'var(--v-positive)',
          negative: 'var(--v-negative)',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
      }
    }
  }
}
