<template>
  <div class="chat-message" :class="[message.role]">
    <div class="avatar" :class="[message.role]">
      {{ message.role === 'user' ? '👤' : '🤖' }}
    </div>
    <div class="bubble" :class="[message.role]">
      <div class="content markdown-body" v-html="renderedContent" />
      <div v-if="showSaveButton && !isSaved" class="actions">
        <n-button size="tiny" quaternary :loading="saving" @click="handleSave">
          💾 保存路线
        </n-button>
      </div>
      <div v-if="isSaved" class="saved-badge">✅ 已保存</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, useMessage } from 'naive-ui'
import MarkdownIt from 'markdown-it'
import type { Message } from '../composables/useChat'
import { usePlans } from '../composables/usePlans'

const props = defineProps<{
  message: Message
  conversationId?: string | null
  isStreaming?: boolean
  alreadySaved?: boolean
}>()

const emit = defineEmits<{
  saved: []
}>()

const message = useMessage()
const { savePlan } = usePlans()
const saving = ref(false)
const saved = ref(false)

// 合并：外部传入的已保存状态 + 本地保存后的状态
const isSaved = computed(() => props.alreadySaved || saved.value)

const md = new MarkdownIt({
  linkify: true,
  breaks: true,
})

const renderedContent = computed(() => {
  return md.render(props.message.content || '')
})

// 判断是否是学习路线（生成完成后才显示）
const showSaveButton = computed(() => {
  if (props.message.role !== 'assistant') return false
  if (props.isStreaming) return false
  const content = props.message.content || ''
  return (
    content.includes('学习路线') ||
    content.includes('学习规划') ||
    (content.includes('阶段') && content.includes('知识点')) ||
    (content.includes('推荐视频') && content.includes('阶段'))
  )
})

async function handleSave() {
  if (saved.value) return

  const content = props.message.content || ''
  const topicMatch = content.match(/[#📚]+\s*(.+?)[\n\r]/)
  const topic = topicMatch
    ? topicMatch[1].trim()
    : content.slice(0, 30).replace(/[#*\n]/g, '').trim()

  saving.value = true
  try {
    await savePlan(topic, content, props.conversationId || undefined)
    saved.value = true
    message.success('路线已保存')
    emit('saved')
  } catch (err: any) {
    message.error('保存失败：' + err.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.chat-message.user {
  flex-direction: row-reverse;
}

/* 头像 */
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.avatar.user {
  background: #18a058;
  color: white;
}

.avatar.assistant {
  background: #e8e8e8;
}

.dark .avatar.assistant {
  background: #444;
}

/* 气泡 */
.bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.7;
  font-size: 14px;
  overflow-wrap: break-word;
}

.bubble.user {
  background: #18a058;
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble.assistant {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}

.dark .bubble.assistant {
  background: #2a2a2a;
  color: #e0e0e0;
}

/* 保存按钮 */
.actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.bubble.user .actions {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.saved-badge {
  margin-top: 6px;
  font-size: 12px;
  color: #18a058;
}

/* Markdown 样式 */
.content :deep(h2) {
  font-size: 16px;
  margin: 12px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.content :deep(h3) {
  font-size: 15px;
  margin: 10px 0 6px;
}

.content :deep(ul),
.content :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.content :deep(li) {
  margin: 4px 0;
}

.content :deep(a) {
  color: #18a058;
  text-decoration: none;
}

.content :deep(a:hover) {
  text-decoration: underline;
}

.content :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.content :deep(pre) {
  background: rgba(0, 0, 0, 0.06);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.content :deep(pre code) {
  background: none;
  padding: 0;
}

.content :deep(blockquote) {
  border-left: 3px solid #18a058;
  padding-left: 12px;
  margin: 8px 0;
  color: #666;
}

.content :deep(hr) {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin: 12px 0;
}

.content :deep(strong) {
  font-weight: 600;
}

/* 用户气泡内的 Markdown */
.bubble.user .content :deep(a) {
  color: #a0e8c0;
}

.bubble.user .content :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.bubble.user .content :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.8);
}

.bubble.user .content :deep(h2) {
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

.bubble.user .content :deep(hr) {
  border-top-color: rgba(255, 255, 255, 0.2);
}
</style>
