<template>
  <div class="plans-view">
    <!-- 列表模式 -->
    <PlanList
      v-if="!plansStore.currentPlan"
      :plans="plansStore.plans"
      @select="handleSelect"
      @delete="handleDelete"
    />

    <!-- 详情模式 -->
    <PlanDetail
      v-else
      :plan="plansStore.currentPlan"
      :openNoteId="plansStore.openNoteId"
      :noteContent="plansStore.noteContent"
      :noteDirty="plansStore.noteDirty"
      :isDark="isDark"
      @back="handleBack"
      @toggleStage="handleToggleStage"
      @toggleItem="handleToggleItem"
      @openNote="handleOpenNote"
      @closeNote="plansStore.closeNote()"
      @updateNote="handleUpdateNote"
      @saveNote="handleSaveNote"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, inject } from 'vue'
import { usePlansStore } from '../stores/plans'
import PlanList from '../components/plans/PlanList.vue'
import PlanDetail from '../components/plans/PlanDetail.vue'
import type { PlanStage, PlanItem } from '../stores/plans'

const plansStore = usePlansStore()
const isDark = inject<boolean>('isDark', false)

onMounted(() => {
  plansStore.loadPlans()
})

async function handleSelect(id: string) {
  await plansStore.loadPlanDetail(id)
}

async function handleDelete(id: string) {
  if (confirm('确定删除这条路线？')) {
    try {
      await plansStore.deletePlan(id)
    } catch {
      alert('删除失败')
    }
  }
}

function handleBack() {
  plansStore.clearCurrentPlan()
  plansStore.loadPlans()
}

function handleToggleStage(stage: PlanStage) {
  plansStore.toggleStage(stage)
}

function handleToggleItem(item: PlanItem) {
  plansStore.toggleItem(item)
}

function handleOpenNote(nodeId: string, note: string) {
  plansStore.openNote(nodeId, note)
}

function handleUpdateNote(value: string) {
  plansStore.noteContent = value
  plansStore.noteDirty = true
}

async function handleSaveNote(nodeId: string, isStage: boolean) {
  try {
    await plansStore.saveNote(nodeId, isStage)
  } catch {
    alert('保存笔记失败')
  }
}
</script>

<style scoped>
.plans-view {
  flex: 1;
  overflow-y: auto;
}
</style>
