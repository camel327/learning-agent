import { ref } from 'vue'

export interface LearningPlan {
  id: string
  topic: string
  content: string
  conversation_id: string | null
  created_at: string
}

export function usePlans() {
  const plans = ref<LearningPlan[]>([])
  const currentPlan = ref<LearningPlan | null>(null)
  const loading = ref(false)

  async function loadPlans() {
    loading.value = true
    try {
      const res = await fetch('/api/plans')
      plans.value = await res.json()
    } catch {
      // 忽略
    } finally {
      loading.value = false
    }
  }

  async function loadPlan(id: string) {
    loading.value = true
    try {
      const res = await fetch(`/api/plans/${id}`)
      currentPlan.value = await res.json()
    } catch {
      // 忽略
    } finally {
      loading.value = false
    }
  }

  async function savePlan(topic: string, content: string, conversationId?: string) {
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, content, conversationId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '保存失败')
    await loadPlans()
    return data
  }

  async function deletePlan(id: string) {
    await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    plans.value = plans.value.filter(p => p.id !== id)
    if (currentPlan.value?.id === id) {
      currentPlan.value = null
    }
  }

  function clearCurrentPlan() {
    currentPlan.value = null
  }

  return {
    plans,
    currentPlan,
    loading,
    loadPlans,
    loadPlan,
    savePlan,
    deletePlan,
    clearCurrentPlan,
  }
}
