<template>
  <div class="chat-input">
    <n-input
      v-model:value="inputText"
      type="textarea"
      placeholder="描述你想学的技术，例如：我想学 Vue 3（Shift+Enter 换行）"
      :rows="2"
      :disabled="disabled"
      @keydown.enter.exact.prevent="handleSend"
      @compositionstart="isComposing = true"
      @compositionend="isComposing = false"
    />
    <n-button
      type="primary"
      :disabled="!inputText.trim() || disabled"
      :loading="disabled"
      @click="handleSend"
    >
      发送
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const inputText = ref('')
const isComposing = ref(false)

function handleSend() {
  // IME 拼音组合中不触发发送
  if (isComposing.value) return
  const text = inputText.value.trim()
  if (!text || props.disabled) return
  emit('send', text)
  inputText.value = ''
}
</script>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #eee;
}

.chat-input .n-input {
  flex: 1;
}
</style>
