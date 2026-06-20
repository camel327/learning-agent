import { ref } from 'vue'

export interface ConfigState {
  provider: string | null
  apiKey: string | null
  hasApiKey: boolean
  baseUrl: string | null
  model: string | null
  providers: Array<{ label: string; value: string }>
  defaults: { baseUrl: string; model: string } | null
}

export function useConfig() {
  const config = ref<ConfigState | null>(null)
  const loading = ref(false)

  async function fetchConfig() {
    loading.value = true
    try {
      const res = await fetch('/api/config')
      config.value = await res.json()
    } finally {
      loading.value = false
    }
  }

  async function saveConfig(data: {
    provider: string
    apiKey?: string
    baseUrl?: string
    model?: string
  }) {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || '保存失败')
    await fetchConfig()
    return result
  }

  async function testConnection(data: {
    provider: string
    apiKey: string
    baseUrl?: string
    model?: string
  }) {
    const res = await fetch('/api/config/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  return { config, loading, fetchConfig, saveConfig, testConnection }
}
