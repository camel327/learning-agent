<template>
  <div class="stage-item">
    <div class="stage-header" @click="expanded = !expanded">
      <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
      <label class="checkbox-label" @click.stop>
        <input
          type="checkbox"
          :checked="stage.completed === 1"
          @change="$emit('toggleStage', stage)"
        />
        <span :class="{ done: stage.completed === 1 }">{{ stage.title }}</span>
      </label>
      <div class="stage-actions">
        <VideoPopup v-if="stage.videos && stage.videos.length > 0" :videos="stage.videos" />
        <button
          class="note-btn"
          :class="{ active: isNoteOpen, hasNote: stage.note }"
          @click.stop="$emit('toggleNote', stage.id)"
          title="阶段笔记"
        >
          📝
        </button>
      </div>
    </div>

    <div v-show="expanded" class="stage-items">
      <KnowledgeItem
        v-for="item in stage.items"
        :key="item.id"
        :item="item"
        :isNoteOpen="openNoteId === item.id"
        @toggle="$emit('toggleItem', $event)"
        @toggleNote="$emit('toggleNote', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import KnowledgeItem from './KnowledgeItem.vue'
import VideoPopup from './VideoPopup.vue'
import type { PlanStage, PlanItem } from '../../stores/plans'

const props = defineProps<{
  stage: PlanStage
  openNoteId: string | null
}>()

defineEmits<{
  toggleStage: [stage: PlanStage]
  toggleItem: [item: PlanItem]
  toggleNote: [id: string]
}>()

const expanded = ref(true)
const isNoteOpen = computed(() => props.openNoteId === props.stage.id)
</script>

<style scoped>
.stage-item {
  margin-bottom: 4px;
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-weight: 600;
  font-size: 14px;
}

.stage-header:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dark .stage-header:hover {
  background: rgba(255, 255, 255, 0.06);
}

.expand-icon {
  font-size: 10px;
  color: #999;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #18a058;
  cursor: pointer;
  flex-shrink: 0;
}

.done {
  text-decoration: line-through;
  color: #999;
}

.stage-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.note-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 4px;
}

.stage-header:hover .note-btn,
.note-btn.active,
.note-btn.hasNote {
  opacity: 0.6;
}

.note-btn:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.06);
}

.dark .note-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.note-btn.active {
  opacity: 1;
  background: rgba(24, 160, 88, 0.1);
}

.stage-items {
  padding-left: 32px;
}
</style>
