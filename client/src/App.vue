<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme } from 'naive-ui'
import { ref } from 'vue'
import ChatView from './views/ChatView.vue'
import PlansView from './views/PlansView.vue'
import ApiConfig from './components/ApiConfig.vue'

const isDark = ref(false)
const showConfig = ref(false)
const chatViewRef = ref()
const currentView = ref<'chat' | 'plans'>('chat')

function toggleSidebar() {
  chatViewRef.value?.toggleSidebar()
}

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

function switchView(view: 'chat' | 'plans') {
  currentView.value = view
}
</script>

<template>
  <n-config-provider :theme="isDark ? darkTheme : undefined">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-container" :class="{ dark: isDark }">
          <header class="app-header">
            <h1>📚 学习规划 Agent</h1>
            <div class="header-actions">
              <n-button
                quaternary
                size="small"
                :type="currentView === 'chat' ? 'primary' : 'default'"
                @click="switchView('chat')"
              >
                💬 对话
              </n-button>
              <n-button
                quaternary
                size="small"
                :type="currentView === 'plans' ? 'primary' : 'default'"
                @click="switchView('plans')"
              >
                📚 路线库
              </n-button>
              <n-button v-if="currentView === 'chat'" quaternary size="small" @click="toggleSidebar">
                📋 历史
              </n-button>
              <n-button quaternary size="small" @click="toggleDark">
                {{ isDark ? '☀️' : '🌙' }}
              </n-button>
              <n-button v-if="currentView === 'chat'" quaternary size="small" @click="chatViewRef?.clearMessages()">
                ➕ 新对话
              </n-button>
              <n-button quaternary size="small" @click="showConfig = true">
                ⚙️
              </n-button>
            </div>
          </header>
          <main class="app-main">
            <ChatView v-if="currentView === 'chat'" ref="chatViewRef" />
            <PlansView v-else />
          </main>
          <ApiConfig v-model:show="showConfig" />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  color: #333;
  transition: background 0.3s, color 0.3s;
}
.app-container.dark {
  background: #1a1a1a;
  color: #e0e0e0;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  flex-shrink: 0;
  transition: background 0.3s, border-color 0.3s;
}
.dark .app-header {
  border-bottom-color: #333;
  background: #222;
}
.app-header h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.header-actions {
  display: flex;
  gap: 4px;
}
.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
