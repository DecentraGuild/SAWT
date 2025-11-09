<template>
  <div class="base-layout">
    <NavigationBar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import NavigationBar from './NavigationBar.vue'
</script>

<style scoped>
.base-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: var(--spacing-xl);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}
</style>

