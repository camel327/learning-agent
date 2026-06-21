<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme } from 'naive-ui'
import { ref, onMounted } from 'vue'
import ChatView from './views/ChatView.vue'
import PlansView from './views/PlansView.vue'
import Sidebar from './components/Sidebar.vue'
import ApiConfig from './components/ApiConfig.vue'
import { useChat } from './composables/useChat'

const isDark = ref(false)
const showConfig = ref(false)
const showSidebar = ref(false)
const chatViewRef = ref()
const currentView = ref<'chat' | 'plans'>('chat')

const {
  conversationId,
  conversations,
  clearMessages,
  loadConversations,
  loadConversation,
  deleteConversation,
} = useChat()

onMounted(() => {
  loadConversations()
})

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

function handleNewChat() {
  clearMessages()
  showSidebar.value = false
}

function handleSwitchView(view: 'chat' | 'plans') {
  currentView.value = view
  showSidebar.value = false
}

async function handleSelectConversation(id: string) {
  await loadConversation(id)
  currentView.value = 'chat'
  showSidebar.value = false
}

function handleDeleteConversation(id: string) {
  deleteConversation(id)
}
</script>

<template>
  <n-config-provider :theme="isDark ? darkTheme : undefined">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-container" :class="{ dark: isDark }">
          <!-- 侧边栏 -->
          <Sidebar
            :show="showSidebar"
            :currentView="currentView"
            :conversations="conversations"
            :activeId="conversationId"
            @close="showSidebar = false"
            @newChat="handleNewChat"
            @switchView="handleSwitchView"
            @select="handleSelectConversation"
            @delete="handleDeleteConversation"
          />

          <!-- 顶栏 -->
          <header class="app-header">
            <div class="header-left" @click="showSidebar = true">
              <span class="menu-icon">☰</span>
              <h1>学习规划 Agent</h1>
            </div>
            <div class="header-actions">
              <n-button quaternary size="small" @click="toggleDark">
                {{ isDark ? '☀️' : '🌙' }}
              </n-button>
              <n-button quaternary size="small" @click="showConfig = true">
                ⚙️
              </n-button>
            </div>
          </header>

          <!-- 主内容 -->
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
  padding: 10px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  flex-shrink: 0;
  transition: background 0.3s, border-color 0.3s;
}

.dark .app-header {
  border-bottom-color: #333;
  background: #222;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s;
  user-select: none;
}

.header-left:hover {
  background: #f5f5f5;
}

.dark .header-left:hover {
  background: #2a2a2a;
}

.menu-icon {
  font-size: 20px;
  color: #666;
}

.dark .menu-icon {
  color: #aaa;
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
