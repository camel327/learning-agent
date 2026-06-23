<template>
  <div class="knowledge-item">
    <div class="item-row">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="item.completed === 1"
          @change="$emit('toggle', item)"
        />
        <span :class="{ done: item.completed === 1 }">{{ item.title }}</span>
      </label>
      <button
        class="note-btn"
        :class="{ active: isNoteOpen, hasNote: item.note }"
        @click="$emit('toggleNote', item.id)"
        title="笔记"
      >
        📝
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlanItem } from '../../stores/plans'

defineProps<{
  item: PlanItem
  isNoteOpen: boolean
}>()

defineEmits<{
  toggle: [item: PlanItem]
  toggleNote: [id: string]
}>()
</script>

<style scoped>
.knowledge-item {
  padding: 4px 0;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px 6px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.item-row:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dark .item-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
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

.item-row:hover .note-btn,
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
</style>
