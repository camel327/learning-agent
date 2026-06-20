<template>
  <div class="chat-input">
    <n-input
      v-model:value="inputText"
      type="textarea"
      placeholder="描述你想学的技术，例如：我想学 Vue 3"
      :rows="2"
      :disabled="disabled"
      @keydown.enter.exact.prevent="handleSend"
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

function handleSend() {
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
