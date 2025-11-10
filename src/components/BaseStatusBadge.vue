<template>
  <span class="base-status-badge" :class="statusClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined
})

const statusClass = computed(() => {
  const statusLower = props.status.toLowerCase()
  if (statusLower === 'passed' || statusLower.includes('pass') || statusLower.includes('approved')) {
    return 'base-status-badge--passed'
  }
  if (statusLower === 'failed' || statusLower.includes('fail') || statusLower.includes('rejected') || statusLower.includes('reject')) {
    return 'base-status-badge--failed'
  }
  if (statusLower === 'active' || statusLower.includes('voting')) {
    return 'base-status-badge--active'
  }
  return 'base-status-badge--unknown'
})

const label = computed(() => props.label || props.status)
</script>

<style scoped>
.base-status-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.base-status-badge--passed {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.base-status-badge--failed {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.base-status-badge--active {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.base-status-badge--unknown {
  background-color: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}
</style>

