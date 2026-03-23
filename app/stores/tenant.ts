import { defineStore } from 'pinia'

export interface TenantPlan {
  id: number
  name: string
  price: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  primary_domain: string | null
  status: 'active' | 'suspended' | 'trial' | 'expired'
  plan: TenantPlan | null
  trial_ends_at: string | null
  settings: Record<string, any> | null
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null
  contact_url?: string | null
  main_site_url?: string | null
  students_count?: number
  teachers_count?: number
  created_at: string
}

export interface TenantStats {
  total: number
  active: number
  trial: number
  suspended: number
  expired: number
  new_this_month: number
  total_students: number
  total_teachers: number
  monthly_revenue: number
  by_plan?: { plan: string, count: number }[]
}

interface Pagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export const useTenantStore = defineStore('tenant', () => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const tenants = ref<Tenant[]>([])
  const pagination = ref<Pagination | null>(null)
  const stats = ref<TenantStats | null>(null)
  const current = ref<Tenant | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTenants(params: Record<string, any> = {}, page = 1) {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams({ page: String(page), ...params }).toString()
      const res = await $fetch<{ data: Tenant[], meta: Pagination }>(
        `${config.public.apiBase}/api/v1/central/tenants?${query}`,
        { headers: auth.authHeaders() }
      )
      tenants.value = res.data
      pagination.value = res.meta
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Xatolik'
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    try {
      const res = await $fetch<{ data: TenantStats }>(
        `${config.public.apiBase}/api/v1/central/stats`,
        { headers: auth.authHeaders() }
      )
      stats.value = res.data
    } catch {}
  }

  async function fetchTenant(id: string) {
    loading.value = true
    try {
      const res = await $fetch<{ data: Tenant }>(
        `${config.public.apiBase}/api/v1/central/tenants/${id}`,
        { headers: auth.authHeaders() }
      )
      current.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function createTenant(data: Partial<Tenant>) {
    const res = await $fetch<{ data: Tenant }>(
      `${config.public.apiBase}/api/v1/central/tenants`,
      { method: 'POST', headers: auth.authHeaders(), body: data }
    )
    tenants.value.unshift(res.data)
    return res.data
  }

  async function updateTenant(id: string, data: Partial<Tenant>) {
    const res = await $fetch<{ data: Tenant }>(
      `${config.public.apiBase}/api/v1/central/tenants/${id}`,
      { method: 'PATCH', headers: auth.authHeaders(), body: data }
    )
    const idx = tenants.value.findIndex(t => t.id === id)
    if (idx !== -1) tenants.value[idx] = res.data
    if (current.value?.id === id) current.value = res.data
    return res.data
  }

  async function deleteTenant(id: string) {
    await $fetch(`${config.public.apiBase}/api/v1/central/tenants/${id}`, {
      method: 'DELETE',
      headers: auth.authHeaders(),
    })
    tenants.value = tenants.value.filter(t => t.id !== id)
  }

  async function suspendTenant(id: string) {
    const res = await $fetch<{ data: Tenant }>(
      `${config.public.apiBase}/api/v1/central/tenants/${id}/suspend`,
      { method: 'PATCH', headers: auth.authHeaders() }
    )
    const idx = tenants.value.findIndex(t => t.id === id)
    if (idx !== -1) tenants.value[idx] = res.data
    if (current.value?.id === id) current.value = res.data
    return res.data
  }

  async function activateTenant(id: string) {
    const res = await $fetch<{ data: Tenant }>(
      `${config.public.apiBase}/api/v1/central/tenants/${id}/activate`,
      { method: 'PATCH', headers: auth.authHeaders() }
    )
    const idx = tenants.value.findIndex(t => t.id === id)
    if (idx !== -1) tenants.value[idx] = res.data
    if (current.value?.id === id) current.value = res.data
    return res.data
  }

  return {
    tenants, pagination, stats, current, loading, error,
    fetchTenants, fetchStats, fetchTenant, createTenant, updateTenant, deleteTenant,
    suspendTenant, activateTenant,
  }
})
