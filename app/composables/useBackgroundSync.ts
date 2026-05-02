// Module-level registry for background sync callbacks.
// Pages register their refresh fn here; the visibility plugin fires them all.

const _callbacks = new Set<() => void>()

export const triggerBackgroundSync = () => {
  for (const fn of _callbacks) {
    try { fn() } catch (e) { console.warn('[bgSync] callback error', e) }
  }
}

export const useBackgroundSync = () => {
  const register = (fn: () => void) => {
    _callbacks.add(fn)
    if (getCurrentInstance()) {
      onUnmounted(() => _callbacks.delete(fn))
    }
    return () => _callbacks.delete(fn)
  }

  return { register }
}
