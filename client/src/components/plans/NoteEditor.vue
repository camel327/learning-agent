<template>
  <div class="note-editor">
    <div class="note-header">
      <span class="note-title">📝 {{ title }} 笔记</span>
      <div class="note-actions">
        <button
          class="action-btn mode-btn"
          :class="{ active: editMode }"
          @click="editMode = !editMode"
          :title="editMode ? '切换预览' : '切换编辑'"
        >
          {{ editMode ? '👁 预览' : '✏️ 编辑' }}
        </button>
        <button class="action-btn ai-btn" @click="$emit('toggleAi')" title="AI 助手">🤖</button>
        <button class="action-btn save-btn" :disabled="!dirty" @click="$emit('save')" title="保存">💾</button>
        <button class="action-btn close-btn" @click="$emit('close')" title="收起">✕</button>
      </div>
    </div>
    <div class="editor-body">
      <!-- 编辑模式：textarea -->
      <textarea
        v-if="editMode"
        ref="textareaRef"
        class="md-textarea"
        :value="modelValue"
        @input="onInput"
        @keydown.tab.prevent="insertTab"
        placeholder="输入 Markdown 内容..."
      />
      <!-- 预览模式：渲染后的 HTML -->
      <div
        v-else
        class="md-preview markdown-body"
        v-html="renderedContent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'

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

const md = new MarkdownIt({ linkify: true, breaks: true })
const editMode = ref(true)
const textareaRef = ref<HTMLTextAreaElement>()

const renderedContent = computed(() => md.render(props.modelValue || ''))

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function insertTab(_e: KeyboardEvent) {
  const textarea = textareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const newValue = value.substring(0, start) + '  ' + value.substring(end)
  emit('update:modelValue', newValue)
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 2
  })
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

.mode-btn.active {
  background: rgba(24, 160, 88, 0.15);
  color: #18a058;
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-body {
  min-height: 200px;
  max-height: 400px;
}

.md-textarea {
  width: 100%;
  min-height: 200px;
  max-height: 400px;
  padding: 16px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.7;
  background: #fff;
  color: #333;
  box-sizing: border-box;
}

.dark .md-textarea {
  background: #1a1a1a;
  color: #e0e0e0;
}

.md-preview {
  padding: 16px;
  overflow-y: auto;
  max-height: 400px;
  line-height: 1.7;
  font-size: 14px;
}

/* Markdown 渲染样式 */
.md-preview :deep(h1),
.md-preview :deep(h2),
.md-preview :deep(h3) {
  margin: 16px 0 8px;
  font-weight: 600;
}

.md-preview :deep(h2) {
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dark .md-preview :deep(h2) {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.md-preview :deep(ul),
.md-preview :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.md-preview :deep(li) {
  margin: 4px 0;
}

.md-preview :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.dark .md-preview :deep(code) {
  background: rgba(255, 255, 255, 0.1);
}

.md-preview :deep(pre) {
  background: rgba(0, 0, 0, 0.06);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.dark .md-preview :deep(pre) {
  background: rgba(255, 255, 255, 0.08);
}

.md-preview :deep(pre code) {
  background: none;
  padding: 0;
}

.md-preview :deep(a) {
  color: #18a058;
  text-decoration: none;
}

.md-preview :deep(a:hover) {
  text-decoration: underline;
}

.md-preview :deep(blockquote) {
  border-left: 3px solid #18a058;
  padding-left: 12px;
  margin: 8px 0;
  color: #666;
}

.dark .md-preview :deep(blockquote) {
  color: #999;
}

.md-preview :deep(strong) {
  font-weight: 600;
}
</style>
