import { defineStore } from 'pinia'

export interface TenantRegistration {
  id: string
  name: string
  subdomain: string
  owner_name: string
  owner_email: string
  owner_phone: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  tenant_id: string | null
  created_at: string
}

interface Pagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export const useRegistrationStore = defineStore('registration', () => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const registrations = ref<TenantRegistration[]>([])
  const pagination = ref<Pagination | null>(null)
  const loading = ref(false)

  async function fetchRegistrations(status = 'pending', page = 1) {
    loading.value = true
    try {
      const query = new URLSearchParams({ status, page: String(page) }).toString()
      const res = await $fetch<{ data: TenantRegistration[], meta: Pagination }>(
        `${config.public.apiBase}/api/v1/central/registrations?${query}`,
        { headers: auth.authHeaders() }
      )
      registrations.value = res.data
      pagination.value = res.meta
    } finally {
      loading.value = false
    }
  }

  async function approve(id: string, planId: number) {
    await $fetch(`${config.public.apiBase}/api/v1/central/registrations/${id}/approve`, {
      method: 'PATCH',
      headers: auth.authHeaders(),
      body: { plan_id: planId },
    })
    registrations.value = registrations.value.filter(r => r.id !== id)
  }

  async function reject(id: string, reason?: string) {
    await $fetch(`${config.public.apiBase}/api/v1/central/registrations/${id}/reject`, {
      method: 'PATCH',
      headers: auth.authHeaders(),
      body: { reason },
    })
    registrations.value = registrations.value.filter(r => r.id !== id)
  }

  const pendingCount = computed(() => registrations.value.filter(r => r.status === 'pending').length)

  return { registrations, pagination, loading, pendingCount, fetchRegistrations, approve, reject }
})
