<template>
  <div class="date-range-picker">
    <div class="date-input-group">
      <label :for="props.startId" class="date-label">{{ startLabel }}</label>
      <input
        :id="props.startId"
        type="date"
        :value="startDate"
        @input="handleStartDateChange"
        class="date-input"
        :max="endDate || undefined"
      />
    </div>
    <div class="date-input-group">
      <label :for="props.endId" class="date-label">{{ endLabel }}</label>
      <input
        :id="props.endId"
        type="date"
        :value="endDate"
        @input="handleEndDateChange"
        class="date-input"
        :min="startDate || undefined"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

interface Props {
  startDate: string
  endDate: string
  startLabel?: string
  endLabel?: string
  startId?: string
  endId?: string
}

const props = withDefaults(defineProps<Props>(), {
  startLabel: 'Start Date',
  endLabel: 'End Date',
  startId: 'start-date',
  endId: 'end-date'
})

const emit = defineEmits<{
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  'change': [start: string, end: string]
}>()

function handleStartDateChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  emit('update:startDate', value)
  emit('change', value, props.endDate)
}

function handleEndDateChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  emit('update:endDate', value)
  emit('change', props.startDate, value)
}
</script>

<style scoped>
.date-range-picker {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
  flex-wrap: wrap;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 180px;
}

.date-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.date-input {
  padding: var(--spacing-sm);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-base);
  font-family: inherit;
}

.date-input:focus {
  outline: none;
  border-color: var(--color-accent-teal);
}

.date-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.date-input::-moz-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
</style>

