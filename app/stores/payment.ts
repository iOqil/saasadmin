import { defineStore } from 'pinia'

export interface TenantPayment {
  id: string
  tenant_id: string
  tenant_name: string
  owner_name: string | null
  owner_email: string | null
  plan_id: number
  plan_name: string
  amount: number
  payment_method: 'cash' | 'transfer' | 'card' | 'other'
  status: 'pending' | 'confirmed' | 'rejected'
  payment_date: string
  receipt_url: string | null
  receipt_original_name: string | null
  receipt_mime: string | null
  notes: string | null
  rejection_reason: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
}

export interface PaymentReport {
  monthly: { month: string, total: number, count: number }[]
  total_confirmed: number
  total_pending: number
  by_plan: { plan: string, total: number, count: number }[]
  by_method: { payment_method: string, total: number, count: number }[]
}

export const usePaymentStore = defineStore('payment', () => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const payments = ref<TenantPayment[]>([])
  const report = ref<PaymentReport | null>(null)
  const loading = ref(false)
  const meta = ref({ current_page: 1, last_page: 1, total: 0 })

  function headers() {
    return auth.authHeaders()
  }

  async function fetchPayments(filters: Record<string, string> = {}, page = 1) {
    loading.value = true
    try {
      const params = new URLSearchParams({ page: String(page), ...filters })
      const res = await $fetch<{ data: TenantPayment[], meta: typeof meta.value }>(
        `${config.public.apiBase}/api/v1/central/payments?${params}`,
        { headers: headers() },
      )
      payments.value = res.data
      meta.value = res.meta
    } finally {
      loading.value = false
    }
  }

  async function createPayment(formData: FormData) {
    const res = await $fetch<{ data: TenantPayment }>(
      `${config.public.apiBase}/api/v1/central/payments`,
      { method: 'POST', headers: headers(), body: formData },
    )
    payments.value.unshift(res.data)
    return res.data
  }

  async function confirmPayment(id: string) {
    const res = await $fetch<{ data: TenantPayment }>(
      `${config.public.apiBase}/api/v1/central/payments/${id}/confirm`,
      { method: 'PATCH', headers: headers() },
    )
    updateLocal(res.data)
    return res.data
  }

  async function rejectPayment(id: string, reason?: string) {
    const res = await $fetch<{ data: TenantPayment }>(
      `${config.public.apiBase}/api/v1/central/payments/${id}/reject`,
      { method: 'PATCH', headers: headers(), body: { rejection_reason: reason ?? null } },
    )
    updateLocal(res.data)
    return res.data
  }

  async function uploadReceipt(id: string, formData: FormData) {
    const res = await $fetch<{ data: TenantPayment }>(
      `${config.public.apiBase}/api/v1/central/payments/${id}/receipt`,
      { method: 'POST', headers: headers(), body: formData },
    )
    updateLocal(res.data)
    return res.data
  }

  async function deletePayment(id: string) {
    await $fetch(`${config.public.apiBase}/api/v1/central/payments/${id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    payments.value = payments.value.filter(p => p.id !== id)
  }

  async function fetchReport(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString()
    const url = query
      ? `${config.public.apiBase}/api/v1/central/payments/report?${query}`
      : `${config.public.apiBase}/api/v1/central/payments/report`
    const res = await $fetch<{ data: PaymentReport }>(url, { headers: headers() })
    report.value = res.data
    return res.data
  }

  function updateLocal(updated: TenantPayment) {
    const idx = payments.value.findIndex(p => p.id === updated.id)
    if (idx !== -1) payments.value[idx] = updated
  }

  return { payments, report, loading, meta, fetchPayments, createPayment, confirmPayment, rejectPayment, uploadReceipt, deletePayment, fetchReport }
})
