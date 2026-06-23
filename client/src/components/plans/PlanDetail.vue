<template>
  <div class="plan-detail">
    <div class="detail-header">
      <button class="back-btn" @click="$emit('back')">← 返回列表</button>
      <h2 class="plan-topic">{{ plan.topic }}</h2>
      <div class="plan-progress">
        进度 {{ progress.completed }}/{{ progress.total }}
      </div>
    </div>

    <div class="stages-tree">
      <div v-for="stage in plan.stages" :key="stage.id" class="stage-wrap">
        <StageItem
          :stage="stage"
          :openNoteId="openNoteId"
          @toggleStage="$emit('toggleStage', $event)"
          @toggleItem="$emit('toggleItem', $event)"
          @toggleNote="handleToggleNote"
        />
        <!-- 阶段笔记展开区 -->
        <div v-if="openNoteId === stage.id" class="note-area">
          <NoteEditor
            :title="stage.title"
            :modelValue="noteContent"
            :dirty="noteDirty"
            :isDark="isDark"
            @update:modelValue="$emit('updateNote', $event)"
            @save="$emit('saveNote', stage.id, true)"
            @close="handleClose"
            @toggleAi="toggleAiChat()"
          />
          <NoteAiChat
            v-if="showAiChat"
            :topic="plan.topic"
            :stageTitle="stage.title"
            :currentNote="noteContent"
            :planId="plan.id"
            :stageId="stage.id"
            @close="showAiChat = false"
            @apply="handleApply"
          />
        </div>
        <!-- 知识点笔记展开区 -->
        <div v-for="item in stage.items" :key="'note-' + item.id">
          <div v-if="openNoteId === item.id" class="note-area item-note">
            <NoteEditor
              :title="item.title"
              :modelValue="noteContent"
              :dirty="noteDirty"
              :isDark="isDark"
              @update:modelValue="$emit('updateNote', $event)"
              @save="$emit('saveNote', item.id, false)"
              @close="handleClose"
              @toggleAi="toggleAiChat()"
            />
            <NoteAiChat
              v-if="showAiChat"
              :topic="plan.topic"
              :stageTitle="stage.title"
              :itemTitle="item.title"
              :currentNote="noteContent"
              :planId="plan.id"
              :stageId="stage.id"
              :itemId="item.id"
              @close="showAiChat = false"
              @apply="handleApply"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 原始路线折叠 -->
    <details class="raw-content">
      <summary>▶ 查看原始路线内容</summary>
      <div class="raw-body" v-html="renderedContent"></div>
    </details>

    <!-- 未保存提醒弹窗 -->
    <div v-if="showSaveDialog" class="save-dialog-mask">
      <div class="save-dialog">
        <p>⚠️ 笔记尚未保存，是否保存？</p>
        <div class="dialog-actions">
          <button class="btn-save" @click="confirmSave">保存并退出</button>
          <button class="btn-discard" @click="confirmDiscard">不保存退出</button>
          <button class="btn-cancel" @click="showSaveDialog = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import StageItem from './StageItem.vue'
import NoteEditor from './NoteEditor.vue'
import NoteAiChat from './NoteAiChat.vue'
import type { PlanDetail as PlanDetailType, PlanStage, PlanItem } from '../../stores/plans'

const props = defineProps<{
  plan: PlanDetailType
  openNoteId: string | null
  noteContent: string
  noteDirty: boolean
  isDark?: boolean
}>()

const emit = defineEmits<{
  back: []
  toggleStage: [stage: PlanStage]
  toggleItem: [item: PlanItem]
  openNote: [nodeId: string, note: string]
  closeNote: []
  updateNote: [value: string]
  saveNote: [nodeId: string, isStage: boolean]
}>()

const md = new MarkdownIt({ linkify: true, breaks: true })
const renderedContent = computed(() => md.render(props.plan.content || ''))

const progress = computed(() => {
  let completed = 0
  let total = 0
  for (const stage of props.plan.stages) {
    for (const item of stage.items) {
      total++
      if (item.completed) completed++
    }
  }
  return { completed, total }
})

const showAiChat = ref(false)
const showSaveDialog = ref(false)
const pendingClose = ref<(() => void) | null>(null)

function handleToggleNote(nodeId: string) {
  if (props.openNoteId === nodeId) {
    // 点击已展开的笔记 → 收起
    handleClose()
  } else {
    // 打开新笔记
    if (props.noteDirty) {
      // 有未保存修改，弹窗
      pendingClose.value = () => doOpenNote(nodeId)
      showSaveDialog.value = true
    } else {
      doOpenNote(nodeId)
    }
  }
}

function doOpenNote(nodeId: string) {
  // 找到对应节点的笔记
  let note = ''
  for (const stage of props.plan.stages) {
    if (stage.id === nodeId) {
      note = stage.note
      break
    }
    for (const item of stage.items) {
      if (item.id === nodeId) {
        note = item.note
        break
      }
    }
  }
  emit('openNote', nodeId, note)
  showAiChat.value = false
}

function handleClose() {
  if (props.noteDirty) {
    pendingClose.value = () => emit('closeNote')
    showSaveDialog.value = true
  } else {
    emit('closeNote')
    showAiChat.value = false
  }
}

function confirmSave() {
  // 保存后关闭
  if (props.openNoteId) {
    let isStage = false
    for (const stage of props.plan.stages) {
      if (stage.id === props.openNoteId) {
        isStage = true
        break
      }
    }
    emit('saveNote', props.openNoteId, isStage)
  }
  showSaveDialog.value = false
  if (pendingClose.value) {
    pendingClose.value()
    pendingClose.value = null
  }
  showAiChat.value = false
}

function confirmDiscard() {
  showSaveDialog.value = false
  if (pendingClose.value) {
    pendingClose.value()
    pendingClose.value = null
  }
  showAiChat.value = false
}

function toggleAiChat() {
  showAiChat.value = !showAiChat.value
}

function handleApply(content: string) {
  emit('updateNote', content)
  showAiChat.value = false
}
</script>

<style scoped>
.plan-detail {
  padding: 24px;
  max-width: 860px;
  margin: 0 auto;
}

.detail-header {
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: #18a058;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  margin-bottom: 12px;
}

.back-btn:hover {
  text-decoration: underline;
}

.plan-topic {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
}

.plan-progress {
  font-size: 13px;
  color: #666;
}

.dark .plan-progress {
  color: #999;
}

.stages-tree {
  margin-bottom: 24px;
}

.stage-wrap {
  margin-bottom: 8px;
}

.note-area {
  padding: 8px 0 8px 32px;
  animation: slideDown 0.2s ease;
}

.item-note {
  padding-left: 64px;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.raw-content {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 16px;
}

.dark .raw-content {
  border-color: #333;
}

.raw-content summary {
  cursor: pointer;
  font-size: 13px;
  color: #666;
}

.dark .raw-content summary {
  color: #999;
}

.raw-body {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.7;
  max-height: 400px;
  overflow-y: auto;
}

/* 未保存弹窗 */
.save-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.save-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.dark .save-dialog {
  background: #222;
}

.save-dialog p {
  margin: 0 0 20px;
  font-size: 15px;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.dialog-actions button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.dialog-actions button:hover {
  opacity: 0.85;
}

.btn-save {
  background: #18a058;
  color: #fff;
}

.btn-discard {
  background: #e0e0e0;
  color: #333;
}

.dark .btn-discard {
  background: #444;
  color: #e0e0e0;
}

.btn-cancel {
  background: none;
  border: 1px solid #ddd !important;
  color: #666;
}

.dark .btn-cancel {
  border-color: #444 !important;
  color: #999;
}
</style>
