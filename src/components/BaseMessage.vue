<template>
  <div :class="['base-message', `base-message--${type}`]">
    <Icon v-if="icon" :icon="icon" class="base-message-icon" />
    <div class="base-message-content">
      <slot>{{ message }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  type?: 'info' | 'error' | 'loading' | 'empty'
  message?: string
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  message: '',
  icon: undefined
})

const defaultIcon = computed(() => {
  if (props.icon) return props.icon
  switch (props.type) {
    case 'error':
      return 'mdi:alert-circle'
    case 'loading':
      return 'mdi:loading'
    case 'empty':
      return 'mdi:inbox-outline'
    default:
      return 'mdi:information'
  }
})

const icon = computed(() => props.icon || defaultIcon.value)
</script>

<style scoped>
.base-message {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.base-message--info {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  text-align: center;
}

.base-message--error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.base-message--loading {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  background-color: transparent;
  border: none;
}

.base-message--empty {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  background-color: transparent;
  border: none;
}

.base-message-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.base-message-content {
  flex: 1;
}
</style>

