<template>
  <div class="note-editor">
    <div class="note-header">
      <span class="note-title">📝 {{ title }} 笔记</span>
      <div class="note-actions">
        <button class="action-btn ai-btn" @click="$emit('toggleAi')" title="AI 助手">🤖</button>
        <button class="action-btn save-btn" :disabled="!dirty" @click="$emit('save')" title="保存">💾</button>
        <button class="action-btn close-btn" @click="$emit('close')" title="收起">✕</button>
      </div>
    </div>
    <div class="editor-wrap">
      <MdEditor
        v-model="content"
        :theme="isDark ? 'dark' : 'light'"
        language="zh-CN"
        :preview="true"
        :toolbarsExclude="['github', 'htmlPreview']"
        @onSave="$emit('save')"
        @onChange="onContentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const props = defineProps<{
  title: string
  modelValue: string
  dirty: boolean
  isDark?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  save: []
  close: []
  toggleAi: []
}>()

const content = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  if (val !== content.value) {
    content.value = val
  }
})

function onContentChange(val: string) {
  emit('update:modelValue', val)
}
</script>

<style scoped>
.note-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  animation: slideDown 0.2s ease;
}

.dark .note-editor {
  border-color: #333;
  background: #1a1a1a;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 600px;
  }
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f8f8;
  border-bottom: 1px solid #e0e0e0;
}

.dark .note-header {
  background: #222;
  border-bottom-color: #333;
}

.note-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.dark .note-title {
  color: #e0e0e0;
}

.note-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.dark .action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-wrap {
  min-height: 200px;
}

:deep(.md-editor) {
  border: none !important;
}
</style>
