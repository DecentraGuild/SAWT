<template>
  <button
    class="base-copy-button"
    :class="{ 'small': size === 'small', 'medium': size === 'medium' }"
    @click.stop="handleCopy"
    :title="tooltip || 'Copy to clipboard'"
  >
    <Icon icon="mdi:content-copy" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  textToCopy: string
  size?: 'small' | 'medium' | 'large'
  tooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  tooltip: 'Copy to clipboard'
})

async function handleCopy() {
  if (!props.textToCopy) return

  try {
    await navigator.clipboard.writeText(props.textToCopy)
    // Optional: You could emit an event or show a toast notification here
  } catch (err) {
    console.error('Failed to copy text:', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = props.textToCopy
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr)
    }
    document.body.removeChild(textArea)
  }
}
</script>

<style scoped>
.base-copy-button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
  opacity: 0.6;
  flex-shrink: 0;
}

.base-copy-button:hover {
  opacity: 1;
  color: var(--color-accent-teal);
  background-color: var(--color-bg-primary);
}

.base-copy-button:active {
  transform: scale(0.95);
}

.base-copy-button.small {
  padding: 2px;
}

.base-copy-button.small :deep(svg) {
  width: 14px;
  height: 14px;
}

.base-copy-button.medium :deep(svg) {
  width: 16px;
  height: 16px;
}

.base-copy-button.large {
  padding: 6px;
}

.base-copy-button.large :deep(svg) {
  width: 18px;
  height: 18px;
}
</style>

