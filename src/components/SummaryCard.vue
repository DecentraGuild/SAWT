<template>
  <div class="summary-card" :class="cardClass">
    <div class="summary-card-header">
      <h3 class="summary-card-title">{{ title }}</h3>
      <span class="summary-card-label">{{ label }}</span>
    </div>
    <div class="summary-card-content">
      <div class="summary-card-value" :class="valueClass">
        {{ formatValue(value) }}
      </div>
      <div class="summary-card-usd">
        {{ formatUSD(usdValue) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatUSD } from '../utils/formatters'

interface Props {
  title: string
  label?: string
  value: number
  usdValue: number
  currency?: string
  type?: 'gain' | 'cost' | 'fee' | 'net'
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'ATLAS',
  type: 'net',
  label: 'Epoch'
})

const cardClass = computed(() => `summary-card--${props.type}`)
const valueClass = computed(() => `summary-card-value--${props.type}`)

function formatValue(val: number): string {
  return formatCurrency(val, props.currency)
}
</script>

<style scoped>
.summary-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.summary-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.summary-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.summary-card-title {
  font-size: var(--font-size-lg);
  color: var(--color-accent-teal);
  margin: 0;
  font-weight: 600;
}

.summary-card-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-card-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  line-height: 1.2;
}

.summary-card-value--gain {
  color: var(--color-gain);
}

.summary-card-value--cost {
  color: var(--color-cost);
}

.summary-card-value--fee {
  color: var(--color-fee);
}

.summary-card-value--net {
  color: var(--color-net);
}

.summary-card-usd {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}
</style>

