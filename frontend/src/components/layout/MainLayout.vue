<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import TopBar from './TopBar.vue'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="layout">
    <Sidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />

    <div class="layout-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <TopBar @toggle-sidebar="toggleSidebar" />

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}

.layout-content {
  margin-left: var(--sidebar-width);
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.layout-content.sidebar-collapsed {
  margin-left: var(--sidebar-collapsed-width);
}

.page-content {
  flex: 1;
  padding: 2.5rem 2rem; /* Increased padding for SaaS feel */
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  background-color: var(--surface-bg);
}

@media (max-width: 768px) {
  .layout-content {
    margin-left: 0 !important;
  }
  .page-content {
    padding: 1rem;
  }
}
</style>
