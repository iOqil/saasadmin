import { defineStore } from 'pinia'

export interface PlanFeatures {
  max_students: number
  max_teachers: number
  max_groups: number
  lms_enabled: boolean
  chat_enabled: boolean
  storage_limit: string
}

export interface Plan {
  id: number
  name: string
  price: number
  features: PlanFeatures
  is_active: boolean
  tenants_count?: number
  created_at?: string
}

export const usePlanStore = defineStore('plan', () => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const plans = ref<Plan[]>([])
  const loading = ref(false)

  function headers() {
    return auth.authHeaders()
  }

  async function fetchPlans() {
    loading.value = true
    try {
      const res = await $fetch<{ data: Plan[] }>(
        `${config.public.apiBase}/api/v1/central/plans`,
        { headers: headers() },
      )
      plans.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function createPlan(data: { name: string, price: number, features: PlanFeatures, is_active: boolean }) {
    const res = await $fetch<{ data: Plan }>(
      `${config.public.apiBase}/api/v1/central/plans`,
      { method: 'POST', headers: headers(), body: data },
    )
    plans.value.push(res.data)
    return res.data
  }

  async function updatePlan(id: number, data: Partial<{ name: string, price: number, features: PlanFeatures, is_active: boolean }>) {
    const res = await $fetch<{ data: Plan }>(
      `${config.public.apiBase}/api/v1/central/plans/${id}`,
      { method: 'PATCH', headers: headers(), body: data },
    )
    const idx = plans.value.findIndex(p => p.id === id)
    if (idx !== -1) plans.value[idx] = res.data
    return res.data
  }

  async function deletePlan(id: number) {
    await $fetch(`${config.public.apiBase}/api/v1/central/plans/${id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    plans.value = plans.value.filter(p => p.id !== id)
  }

  return { plans, loading, fetchPlans, createPlan, updatePlan, deletePlan }
})
