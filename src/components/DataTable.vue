<template>
  <div class="data-table-container">
    <div v-if="title" class="data-table-header">
      <h2 class="data-table-title">{{ title }}</h2>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" :class="column.class">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="(row, index) in data" 
          :key="index"
          :class="['data-table-row', props.getRowClass ? props.getRowClass(row, index) : '']"
          @click="$emit('row-click', row)"
        >
          <td v-for="column in columns" :key="column.key" :class="column.class">
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
              {{ formatCellValue(row[column.key], column.format) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showSummary" class="data-table-summary">
      <div class="summary-row" v-for="summary in summaries" :key="summary.label">
        <span class="summary-label">{{ summary.label }}:</span>
        <span class="summary-value" :class="summary.valueClass">
          {{ formatValue(summary.value, summary.currency) }}
        </span>
        <span v-if="summary.usdValue !== undefined" class="summary-usd">
          ({{ formatUSD(summary.usdValue) }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface TableColumn {
  key: string
  label: string
  format?: 'number' | 'currency' | 'currency-usd' | 'range' | 'text'
  class?: string
}

export interface TableSummary {
  label: string
  value: number
  usdValue?: number
  currency?: string
  valueClass?: string
}

interface Props {
  title?: string
  columns: TableColumn[]
  data: Record<string, any>[]
  summaries?: TableSummary[]
  showSummary?: boolean
  getRowClass?: (row: Record<string, any>, index: number) => string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  showSummary: true
})

defineEmits<{
  'row-click': [row: Record<string, any>]
}>()

function formatCellValue(value: any, format?: string): string {
  if (value === null || value === undefined) return '-'
  
  switch (format) {
    case 'number':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(Number(value))
    
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(value))
    
    case 'currency-usd':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      }).format(Number(value))
    
    case 'range':
      if (Array.isArray(value) && value.length === 2) {
        return `${formatNumber(value[0])} - ${formatNumber(value[1])}`
      }
      return String(value)
    
    default:
      return String(value)
  }
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  }).format(val)
}

function formatValue(val: number, currency: string = 'ATLAS'): string {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(val)} ${currency}`
}

function formatUSD(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(val)
}
</script>

<style scoped>
.data-table-container {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.data-table-header {
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.data-table-title {
  font-size: var(--font-size-2xl);
  color: var(--color-accent-teal);
  margin: 0;
  font-weight: 600;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: var(--spacing-md);
}

.data-table th {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 2px solid var(--color-border);
}

.data-table td {
  color: var(--color-text-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-base);
}

.data-table tbody tr.data-table-row {
  cursor: pointer;
  transition: background-color var(--transition-base);
  position: relative;
}

.data-table tbody tr.data-table-row:hover {
  background-color: var(--color-bg-tertiary);
}

/* Wallet voted row highlighting - can be overridden by parent */
.data-table tbody tr.wallet-voted-row {
  box-shadow: inset 3px 0 0 #ffd700;
}

.data-table tbody tr.wallet-voted-row:hover {
  box-shadow: inset 3px 0 0 #ffd700, 0 0 12px rgba(255, 215, 0, 0.2);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table-summary {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-base);
}

.summary-label {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.summary-value {
  color: var(--color-text-primary);
  font-weight: 600;
}

.summary-value.text-gain {
  color: var(--color-gain);
}

.summary-value.text-cost {
  color: var(--color-cost);
}

.summary-value.text-fee {
  color: var(--color-fee);
}

.summary-value.text-net {
  color: var(--color-net);
}

.summary-usd {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}
</style>

