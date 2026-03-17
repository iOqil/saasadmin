export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (to.path === '/login') return

  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }

  if (!auth.user) {
    await auth.fetchMe()
    if (!auth.user) {
      return navigateTo('/login')
    }
  }
})
