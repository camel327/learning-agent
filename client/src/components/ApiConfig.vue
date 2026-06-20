<template>
  <n-modal
    :show="show"
    preset="card"
    title="模型配置"
    style="width: 480px"
    @update:show="$emit('update:show', $event)"
  >
    <n-form label-placement="left" label-width="80">
      <n-form-item label="模型提供商">
        <n-select
          v-model:value="form.provider"
          :options="providers"
          placeholder="选择提供商"
        />
      </n-form-item>

      <n-form-item label="API Key">
        <n-input
          v-model:value="form.apiKey"
          type="password"
          show-password-on="click"
          placeholder="sk-..."
        />
      </n-form-item>

      <n-form-item label="Base URL">
        <n-input
          v-model:value="form.baseUrl"
          :placeholder="defaultBaseUrl"
        />
        <n-text depth="3" style="font-size: 12px; margin-left: 8px">
          留空使用默认
        </n-text>
      </n-form-item>

      <n-form-item label="模型">
        <n-input
          v-model:value="form.model"
          :placeholder="defaultModel"
        />
      </n-form-item>
    </n-form>

    <template #action>
      <n-space justify="end">
        <n-button :loading="testing" @click="handleTest">
          测试连接
        </n-button>
        <n-button type="primary" :loading="saving" @click="handleSave">
          保存
        </n-button>
      </n-space>
    </template>

    <n-alert v-if="testResult" :type="testResult.success ? 'success' : 'error'" style="margin-top: 12px">
      {{ testResult.message }}
    </n-alert>
  </n-modal>
</template>

<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useConfig } from '../composables/useConfig'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

const message = useMessage()
const { config, fetchConfig, saveConfig: save, testConnection } = useConfig()

const providers = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI', value: 'openai' },
  { label: '通义千问', value: 'qwen' },
  { label: '自定义', value: 'custom' },
]

const form = reactive({
  provider: 'deepseek',
  apiKey: '',
  baseUrl: '',
  model: '',
})

const testing = ref(false)
const saving = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

const defaultBaseUrl = computed(() => {
  const map: Record<string, string> = {
    deepseek: 'https://api.deepseek.com',
    openai: 'https://api.openai.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    custom: '',
  }
  return map[form.provider] || ''
})

const defaultModel = computed(() => {
  const map: Record<string, string> = {
    deepseek: 'deepseek-chat',
    openai: 'gpt-4o-mini',
    qwen: 'qwen-plus',
    custom: '',
  }
  return map[form.provider] || ''
})

// 打开时加载已有配置
watch(() => props.show, async (val) => {
  if (val) {
    await fetchConfig()
    if (config.value) {
      form.provider = config.value.provider || 'deepseek'
      form.baseUrl = config.value.baseUrl || ''
      form.model = config.value.model || ''
      form.apiKey = ''  // 不回显 key
    }
    testResult.value = null
  }
})

async function handleTest() {
  if (!form.apiKey) {
    message.warning('请先填写 API Key')
    return
  }
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await testConnection({
      provider: form.provider,
      apiKey: form.apiKey,
      baseUrl: form.baseUrl,
      model: form.model,
    })
  } catch (err: any) {
    testResult.value = { success: false, message: err.message }
  } finally {
    testing.value = false
  }
}

async function handleSave() {
  if (!form.provider) {
    message.warning('请选择提供商')
    return
  }
  saving.value = true
  try {
    await save({
      provider: form.provider,
      apiKey: form.apiKey || undefined,
      baseUrl: form.baseUrl,
      model: form.model,
    })
    message.success('保存成功')
    emit('update:show', false)
  } catch (err: any) {
    message.error(err.message)
  } finally {
    saving.value = false
  }
}
</script>
