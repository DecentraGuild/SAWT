<template>
  <div class="navigation-bar">
    <!-- Row 1: Navigation Tabs -->
    <div class="nav-row nav-tabs">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="nav-tab"
        :class="{ active: $route.path === tab.path }"
      >
        {{ tab.name }}
      </router-link>
    </div>

    <!-- Row 2: Input Fields -->
    <div class="nav-row nav-inputs">
      <div class="input-group">
        <label for="wallet-address">Wallet Address</label>
        <div class="wallet-input-container">
          <input
            id="wallet-address"
            v-model="walletAddress"
            type="text"
            placeholder="Enter Solana wallet address"
            class="wallet-input input"
            @keyup.enter="refreshData"
          />
          <BaseCopyButton
            v-if="walletAddress.trim()"
            :text-to-copy="walletAddress.trim()"
            size="small"
            tooltip="Copy current wallet address"
          />
        </div>
      </div>
      <button 
        class="update-wallet-button" 
        @click="refreshData"
        :disabled="!walletAddress.trim()"
      >
        Refresh
      </button>
      <DateRangePicker
        :start-date="startDate"
        :end-date="endDate"
        @update:start-date="startDate = $event"
        @update:end-date="endDate = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWalletStore } from '../stores/wallet'
import DateRangePicker from './DateRangePicker.vue'
import BaseCopyButton from './BaseCopyButton.vue'

const walletStore = useWalletStore()

const tabs = [
  { name: 'Holdings', path: '/holdings' },
  { name: 'Total', path: '/total' },
  { name: 'Sage', path: '/sage' },
  { name: 'Locker', path: '/locker' },
  { name: 'Faction Claims', path: '/faction-claims' },
  { name: 'Faction Fleets', path: '/faction-fleets' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Rentals', path: '/rentals' },
  { name: 'Votes', path: '/votes' },
  { name: 'Raw Data', path: '/raw-data' }
]

const walletAddress = ref(walletStore.address)
const startDate = ref(walletStore.startDate)
const endDate = ref(walletStore.endDate)

watch([startDate, endDate], ([newStart, newEnd]) => {
  walletStore.setDateRange(newStart, newEnd)
})

function refreshData() {
  const wallet = walletAddress.value.trim()
  if (wallet) {
    walletStore.setWalletAddress(wallet)
    walletStore.setDateRange(startDate.value, endDate.value)
  }
}
</script>

<style scoped>
.navigation-bar {
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 0;
}

.nav-row {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-md);
  gap: var(--spacing-md);
}

.nav-tabs {
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.nav-tab {
  padding: var(--spacing-sm) var(--spacing-md);
  text-decoration: none;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
  font-size: var(--font-size-sm);
}

.nav-tab:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.nav-tab.active {
  background-color: var(--color-accent-teal);
  color: var(--color-text-primary);
}

.nav-inputs {
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  align-items: flex-end;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 200px;
}

.input-group label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.wallet-input-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.wallet-input {
  min-width: 300px;
  flex: 1;
}

.wallet-input-container :deep(.base-copy-button) {
  position: absolute;
  right: 8px;
}

.update-wallet-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-accent-teal);
  color: var(--color-text-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  height: fit-content;
}

.update-wallet-button:hover:not(:disabled) {
  background-color: var(--color-accent-teal-dark, #0d9488);
  transform: translateY(-1px);
}

.update-wallet-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

