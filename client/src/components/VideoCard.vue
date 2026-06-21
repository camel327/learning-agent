<template>
  <div class="video-card" @click="openVideo">
    <img v-if="video.cover" :src="video.cover" class="cover" loading="lazy" />
    <div class="info">
      <div class="title">{{ video.title }}</div>
      <div class="meta">
        <span class="author">👤 {{ video.author }}</span>
        <span class="play">▶️ {{ formatCount(video.playCount) }}</span>
        <span class="danmaku">💬 {{ formatCount(video.danmakuCount) }}</span>
        <span v-if="video.duration" class="duration">⏱️ {{ video.duration }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Video {
  title: string
  url: string
  author: string
  playCount: number
  danmakuCount: number
  duration?: string
  cover?: string
}

const props = defineProps<{ video: Video }>()

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

function openVideo() {
  window.open(props.video.url, '_blank')
}
</script>

<style scoped>
.video-card {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid #eee;
  margin-bottom: 8px;
}

.video-card:hover {
  background: #f0f7f2;
}

.cover {
  width: 120px;
  height: 75px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #888;
}
</style>
