<template>
  <div ref="containerRef" class="note-editor" :class="{ fullscreen: isFullscreen }">
    <div class="note-header">
      <span class="note-title">📝 {{ title }} 笔记</span>
      <div class="note-actions">
        <button
          v-if="!editing"
          class="action-btn edit-btn"
          @click="startEdit"
          title="编辑"
        >
          ✏️ 编辑
        </button>
        <button class="action-btn ai-btn" @click="$emit('toggleAi')" title="AI 助手">🤖</button>
        <button v-if="editing" class="action-btn save-btn" :disabled="!dirty" @click="$emit('save')" title="保存">💾</button>
        <button class="action-btn fs-btn" @click.stop="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
          {{ isFullscreen ? '✕全屏' : '⬜全屏' }}
        </button>
        <button class="action-btn close-btn" @click="handleClose" title="收起">✕</button>
      </div>
    </div>

    <!-- 预览模式 -->
    <div v-if="!editing" class="preview-body markdown-body" @click="startEdit" v-html="renderedContent" />

    <!-- 编辑模式 -->
    <div v-else ref="editorRef" class="editor-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const props = defineProps<{
  title: string
  modelValue: string
  dirty: boolean
  isDark?: boolean
  hasExistingNote?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  save: []
  close: []
  toggleAi: []
}>()

const md = new MarkdownIt({ linkify: true, breaks: true })
const renderedContent = computed(() => md.render(props.modelValue || ''))

const editing = ref(!props.hasExistingNote)
const isFullscreen = ref(false)
const containerRef = ref<HTMLElement>()
const editorRef = ref<HTMLElement>()
let vditorInstance: Vditor | null = null

function toggleFullscreen() {
  console.log('[NoteEditor] toggleFullscreen called, containerRef:', containerRef.value)
  if (!containerRef.value) return
  if (!document.fullscreenElement) {
    console.log('[NoteEditor] requesting fullscreen...')
    containerRef.value.requestFullscreen().then(() => {
      console.log('[NoteEditor] fullscreen success')
    }).catch(err => {
      console.error('[NoteEditor] 全屏失败:', err)
    })
  } else {
    console.log('[NoteEditor] exiting fullscreen...')
    document.exitFullscreen()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  if (editing.value) {
    initVditor()
  }
})

function startEdit() {
  editing.value = true
  nextTick(() => initVditor())
}

function initVditor() {
  if (!editorRef.value || vditorInstance) return

  vditorInstance = new Vditor(editorRef.value, {
    mode: 'ir',
    value: props.modelValue,
    theme: props.isDark ? 'dark' : 'classic',
    toolbar: [
      'emoji', 'bold', 'italic', 'strike', '|',
      'line', 'quote', 'list', 'ordered-list', '|',
      'code', 'inline-code', 'table', '|',
      'undo', 'redo', '|',
      'edit-mode'
    ],
    toolbarConfig: { hide: false },
    outline: { enable: false, position: 'right' },
    cache: { enable: false },
    resize: { enable: true, position: 'bottom' },
    height: 280,
    minHeight: 200,
    input: (value: string) => {
      emit('update:modelValue', value)
    }
  })
}

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

function handleClose() {
  if (isFullscreen.value && document.fullscreenElement) {
    document.exitFullscreen()
  }
  emit('close')
}

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
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

/* 全屏样式 */
.note-editor:fullscreen,
.note-editor.fullscreen {
  border-radius: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
}

.note-editor:fullscreen .preview-body,
.note-editor.fullscreen .preview-body {
  flex: 1;
  max-height: none;
  overflow-y: auto;
}

.note-editor:fullscreen .editor-container,
.note-editor.fullscreen .editor-container {
  flex: 1;
  min-height: 0;
}

.note-editor:fullscreen :deep(.vditor),
.note-editor.fullscreen :deep(.vditor) {
  height: 100% !important;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.note-editor:fullscreen :deep(.vditor-content),
.note-editor.fullscreen :deep(.vditor-content) {
  flex: 1;
  min-height: 0;
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
  flex-shrink: 0;
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

.edit-btn {
  color: #18a058;
  font-weight: 500;
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fs-btn {
  font-size: 15px;
}

/* 预览区域 */
.preview-body {
  padding: 16px;
  line-height: 1.7;
  font-size: 14px;
  cursor: text;
  min-height: 60px;
  max-height: 400px;
  overflow-y: auto;
}

.preview-body:hover {
  background: rgba(24, 160, 88, 0.02);
}

.preview-body :deep(h1),
.preview-body :deep(h2),
.preview-body :deep(h3) {
  margin: 12px 0 6px;
  font-weight: 600;
}

.preview-body :deep(h2) {
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dark .preview-body :deep(h2) {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.preview-body :deep(ul),
.preview-body :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.preview-body :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.dark .preview-body :deep(code) {
  background: rgba(255, 255, 255, 0.1);
}

.preview-body :deep(pre) {
  background: rgba(0, 0, 0, 0.06);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.dark .preview-body :deep(pre) {
  background: rgba(255, 255, 255, 0.08);
}

.preview-body :deep(pre code) {
  background: none;
  padding: 0;
}

.preview-body :deep(a) {
  color: #18a058;
  text-decoration: none;
}

.preview-body :deep(blockquote) {
  border-left: 3px solid #18a058;
  padding-left: 12px;
  margin: 8px 0;
  color: #666;
}

.dark .preview-body :deep(blockquote) {
  color: #999;
}

/* 编辑器容器 */
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
