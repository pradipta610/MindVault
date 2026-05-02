import { triggerBackgroundSync } from '~/composables/useBackgroundSync'

export default defineNuxtPlugin(() => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerBackgroundSync()
    }
  })
})
