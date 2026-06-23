import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 类型定义
export interface VideoInfo {
  title: string
  url: string
  up: string
  views: string
}

export interface PlanItem {
  id: string
  stage_id: string
  title: string
  sort_order: number
  completed: number
  note: string
  videos: VideoInfo[]
}

export interface PlanStage {
  id: string
  plan_id: string
  title: string
  sort_order: number
  completed: number
  note: string
  videos: VideoInfo[]
  items: PlanItem[]
}

export interface LearningPlan {
  id: string
  topic: string
  content: string
  conversation_id: string | null
  created_at: string
}

export interface PlanDetail extends LearningPlan {
  stages: PlanStage[]
}

export const usePlansStore = defineStore('plans', () => {
  // 状态
  const plans = ref<LearningPlan[]>([])
  const currentPlan = ref<PlanDetail | null>(null)
  const loading = ref(false)
  const openNoteId = ref<string | null>(null) // 当前展开的笔记节点 ID
  const noteContent = ref('') // 当前编辑中的笔记内容
  const noteDirty = ref(false) // 笔记是否有未保存修改

  // 计算属性
  const progress = computed(() => {
    if (!currentPlan.value) return { completed: 0, total: 0 }
    let completed = 0
    let total = 0
    for (const stage of currentPlan.value.stages) {
      for (const item of stage.items) {
        total++
        if (item.completed) completed++
      }
    }
    return { completed, total }
  })

  // 加载路线列表
  async function loadPlans() {
    loading.value = true
    try {
      const res = await fetch('/api/plans')
      plans.value = await res.json()
    } catch (err) {
      console.error('加载路线列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 加载路线详情
  async function loadPlanDetail(id: string) {
    loading.value = true
    try {
      const res = await fetch(`/api/plans/${id}/detail`)
      if (!res.ok) throw new Error('加载失败')
      currentPlan.value = await res.json()
    } catch (err) {
      console.error('加载路线详情失败:', err)
      currentPlan.value = null
    } finally {
      loading.value = false
    }
  }

  // 切换知识点完成状态
  async function toggleItem(item: PlanItem) {
    const newCompleted = item.completed ? 0 : 1
    try {
      await fetch(`/api/plans/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted })
      })
      item.completed = newCompleted
    } catch (err) {
      console.error('更新失败:', err)
    }
  }

  // 切换阶段完成状态（同时更新所有子知识点）
  async function toggleStage(stage: PlanStage) {
    const newCompleted = stage.completed ? 0 : 1
    try {
      await fetch(`/api/plans/stages/${stage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted })
      })
      stage.completed = newCompleted
      // 同步更新所有子知识点
      for (const item of stage.items) {
        await toggleItem({ ...item, completed: newCompleted ? 0 : 1 })
        item.completed = newCompleted
      }
    } catch (err) {
      console.error('更新失败:', err)
    }
  }

  // 保存笔记
  async function saveNote(nodeId: string, isStage: boolean) {
    try {
      const url = isStage
        ? `/api/plans/stages/${nodeId}`
        : `/api/plans/items/${nodeId}`
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteContent.value })
      })
      // 更新本地数据
      if (currentPlan.value) {
        for (const stage of currentPlan.value.stages) {
          if (isStage && stage.id === nodeId) {
            stage.note = noteContent.value
            break
          }
          for (const item of stage.items) {
            if (!isStage && item.id === nodeId) {
              item.note = noteContent.value
              break
            }
          }
        }
      }
      noteDirty.value = false
    } catch (err) {
      console.error('保存笔记失败:', err)
      throw err
    }
  }

  // 打开笔记
  function openNote(nodeId: string, note: string) {
    openNoteId.value = nodeId
    noteContent.value = note
    noteDirty.value = false
  }

  // 关闭笔记
  function closeNote() {
    openNoteId.value = null
    noteContent.value = ''
    noteDirty.value = false
  }

  // 删除路线
  async function deletePlan(id: string) {
    try {
      await fetch(`/api/plans/${id}`, { method: 'DELETE' })
      plans.value = plans.value.filter(p => p.id !== id)
      if (currentPlan.value?.id === id) {
        currentPlan.value = null
      }
    } catch (err) {
      console.error('删除失败:', err)
      throw err
    }
  }

  // 清除当前路线
  function clearCurrentPlan() {
    currentPlan.value = null
    openNoteId.value = null
    noteContent.value = ''
    noteDirty.value = false
  }

  return {
    plans, currentPlan, loading, openNoteId, noteContent, noteDirty,
    progress,
    loadPlans, loadPlanDetail, toggleItem, toggleStage,
    saveNote, openNote, closeNote, deletePlan, clearCurrentPlan
  }
})
