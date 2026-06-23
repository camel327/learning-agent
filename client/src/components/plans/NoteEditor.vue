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
    <div ref="editorRef" class="editor-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

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

const editorRef = ref<HTMLElement>()
let vditorInstance: Vditor | null = null

onMounted(() => {
  if (!editorRef.value) return

  vditorInstance = new Vditor(editorRef.value, {
    mode: 'ir',
    value: props.modelValue,
    theme: props.isDark ? 'dark' : 'classic',
    toolbar: [
      'emoji', 'bold', 'italic', 'strike', '|',
      'line', 'quote', 'list', 'ordered-list', '|',
      'code', 'inline-code', 'table', '|',
      'undo', 'redo', '|',
      'fullscreen', 'edit-mode'
    ],
    toolbarConfig: { hide: false },
    outline: { enable: false, position: 'right' },
    cache: { enable: false },
    height: 280,
    minHeight: 200,
    input: (value: string) => {
      emit('update:modelValue', value)
    }
  })
})

watch(() => props.modelValue, (val) => {
  if (vditorInstance && val !== vditorInstance.getValue()) {
    vditorInstance.setValue(val)
  }
})

watch(() => props.isDark, (dark) => {
  if (vditorInstance) {
    vditorInstance.setTheme(dark ? 'dark' : 'classic')
  }
})

onBeforeUnmount(() => {
  if (vditorInstance) {
    vditorInstance.destroy()
    vditorInstance = null
  }
})
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
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
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
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
  white-space: nowrap;
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

.editor-container {
  min-height: 200px;
}

/* vditor 暗色适配 */
.dark :deep(.vditor) {
  border: none !important;
  background: #1a1a1a !important;
}

.dark :deep(.vditor-toolbar) {
  background: #222 !important;
  border-bottom-color: #333 !important;
}

.dark :deep(.vditor-toolbar__item) {
  color: #ccc !important;
}

.dark :deep(.vditor-ir) {
  background: #1a1a1a !important;
  color: #e0e0e0 !important;
}

.dark :deep(.vditor-ir pre.vditor-ir__marker--pre) {
  background: #2a2a2a !important;
}

.dark :deep(.vditor-ir code) {
  background: #2a2a2a !important;
  color: #e0e0e0 !important;
}
</style>
