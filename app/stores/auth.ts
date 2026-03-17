import { defineStore } from 'pinia'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('admin_token', { maxAge: 60 * 60 * 24 * 30 })
  const user = ref<AdminUser | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await $fetch<{ data: { token: string, user: AdminUser } }>(
        `${config.public.apiBase}/api/v1/central/auth/login`,
        { method: 'POST', body: { email, password } }
      )
      token.value = res.data.token
      user.value = res.data.user
    }
    finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const res = await $fetch<{ data: AdminUser }>(
        `${config.public.apiBase}/api/v1/central/auth/me`,
        { headers: { Authorization: `Bearer ${token.value}` } }
      )
      user.value = res.data
    }
    catch {
      token.value = null
      user.value = null
    }
  }

  async function updateProfile(data: { name: string; email: string }) {
    const res = await $fetch<{ data: AdminUser }>(
      `${config.public.apiBase}/api/v1/central/auth/profile`,
      { method: 'PATCH', headers: authHeaders(), body: data }
    )
    user.value = res.data
    return res.data
  }

  async function changePassword(data: { current_password: string; password: string; password_confirmation: string }) {
    await $fetch(
      `${config.public.apiBase}/api/v1/central/auth/change-password`,
      { method: 'POST', headers: authHeaders(), body: data }
    )
  }

  async function logout() {
    try {
      await $fetch(`${config.public.apiBase}/api/v1/central/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
      })
    }
    catch {}
    token.value = null
    user.value = null
    await navigateTo('/login')
  }

  function authHeaders() {
    return { Authorization: `Bearer ${token.value}` }
  }

  return { token, user, loading, isAuthenticated, login, fetchMe, logout, authHeaders, updateProfile, changePassword }
})
