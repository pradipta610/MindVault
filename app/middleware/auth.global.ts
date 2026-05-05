export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const user = useSupabaseUser()
  const publicPaths = ['/login', '/confirm']
  const isPublic = publicPaths.includes(to.path) || to.path.startsWith('/share/')

  // Fast path: user already known
  if (user.value) {
    if (to.path === '/login') return navigateTo('/dump', { replace: true })
    return
  }

  // Slow path: user not yet hydrated — await actual session from storage
  // This prevents false redirects when the app resumes after being away
  const client = useSupabaseClient()
  const { data: { session } } = await (client as any).auth.getSession()

  if (session) {
    if (to.path === '/login') return navigateTo('/dump', { replace: true })
    return
  }

  // Truly unauthenticated
  if (!isPublic) return navigateTo('/login', { replace: true })
})
