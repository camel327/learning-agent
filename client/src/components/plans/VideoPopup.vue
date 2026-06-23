<template>
  <div
    class="video-popup-trigger"
    ref="triggerRef"
    @mouseenter="onHover(true)"
    @mouseleave="onHover(false)"
  >
    <!-- 蓝点标记 -->
    <span class="video-dot" @click.stop="toggleFixed">●</span>

    <!-- 浮窗 -->
    <Teleport to="body">
      <div
        v-if="showPopup"
        ref="popupRef"
        class="video-popup"
        :style="popupStyle"
        @mouseenter="isHovering = true"
        @mouseleave="onHover(false)"
      >
        <div class="popup-header">
          <span>🎬 相关视频</span>
          <button class="popup-close" @click.stop="closeFixed">✕</button>
        </div>
        <div class="popup-list">
          <a
            v-for="(video, i) in videos"
            :key="i"
            :href="video.url"
            target="_blank"
            rel="noopener"
            class="video-link"
          >
            <div class="video-title">{{ video.title }}</div>
            <div class="video-meta">
              <span v-if="video.up">UP: {{ video.up }}</span>
              <span v-if="video.views">▶️ {{ video.views }}</span>
            </div>
          </a>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, watch } from 'vue'

interface VideoInfo {
  title: string
  url: string
  up: string
  views: string
}

const props = defineProps<{
  videos: VideoInfo[]
}>()

const showPopup = ref(false)
const isHovering = ref(false)
const isFixed = ref(false)
const triggerRef = ref<HTMLElement>()
const popupRef = ref<HTMLElement>()
const popupStyle = ref<Record<string, string>>({})

let hoverTimeout: ReturnType<typeof setTimeout> | null = null

function onHover(state: boolean) {
  isHovering.value = state
  if (state) {
    hoverTimeout = setTimeout(() => {
      if (!isFixed.value) {
        showPopup.value = true
        nextTick(updatePosition)
      }
    }, 300)
  } else {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    if (!isFixed.value) {
      hoverTimeout = setTimeout(() => {
        if (!isHovering.value && !isFixed.value) {
          showPopup.value = false
        }
      }, 200)
    }
  }
}

function toggleFixed() {
  if (isFixed.value) {
    closeFixed()
  } else {
    isFixed.value = true
    showPopup.value = true
    nextTick(updatePosition)
  }
}

function closeFixed() {
  isFixed.value = false
  showPopup.value = false
}

function updatePosition() {
  if (!triggerRef.value) return

  // 找到最近的行容器（stage-header 或 item-row）
  const row = triggerRef.value.closest('.stage-header, .item-row')
  const rect = row
    ? row.getBoundingClientRect()
    : triggerRef.value.getBoundingClientRect()

  const popupWidth = 320
  const gap = 6

  // 浮窗在元素正上方
  let left = rect.left + rect.width / 2 - popupWidth / 2
  let top = rect.top - gap // 先用 top，后面根据浮窗高度调整

  // 边界检测（水平）
  if (left < 8) left = 8
  if (left + popupWidth > window.innerWidth - 8) left = window.innerWidth - popupWidth - 8

  popupStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: '9999',
    transform: 'translateY(-100%)' // 向上偏移整个浮窗高度
  }
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  if (isFixed.value && popupRef.value && !popupRef.value.contains(e.target as Node) && triggerRef.value && !triggerRef.value.contains(e.target as Node)) {
    closeFixed()
  }
}

watch(showPopup, (val) => {
  if (val) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (hoverTimeout) clearTimeout(hoverTimeout)
})
</script>

<style scoped>
.video-popup-trigger {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.video-dot {
  font-size: 8px;
  color: #4da6ff;
  cursor: pointer;
  padding: 0 2px;
  transition: color 0.15s;
  user-select: none;
  line-height: 1;
}

.video-dot:hover {
  color: #2b8eff;
}

.video-popup {
  width: 320px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  animation: fadeIn 0.15s ease;
}

.dark .video-popup {
  background: #222;
  border-color: #444;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f0f7ff;
  border-bottom: 1px solid #e0e0e0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.dark .popup-header {
  background: #1a2a3a;
  border-bottom-color: #444;
  color: #e0e0e0;
}

.popup-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  color: #999;
  line-height: 1;
}

.popup-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #333;
}

.dark .popup-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.popup-list {
  max-height: 240px;
  overflow-y: auto;
}

.video-link {
  display: block;
  padding: 10px 12px;
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}

.dark .video-link {
  border-bottom-color: #333;
}

.video-link:last-child {
  border-bottom: none;
}

.video-link:hover {
  background: #f8f8f8;
}

.dark .video-link:hover {
  background: #2a2a2a;
}

.video-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4px;
}

.dark .video-title {
  color: #e0e0e0;
}

.video-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}
</style>
