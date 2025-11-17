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
      <DateRangePicker
        :start-date="startDate"
        :end-date="endDate"
        @update:start-date="startDate = $event"
        @update:end-date="endDate = $event"
      />
      <button 
        class="update-wallet-button" 
        @click="refreshData"
        :disabled="!walletAddress.trim()"
      >
        Refresh
      </button>
    </div>

    <!-- Row 3: Profile Info -->
    <div v-if="walletStore.address.trim() && profile" class="nav-row nav-profile">
      <div class="profile-info" :class="factionClass">
        <div class="profile-item">
          <span class="profile-label">Username:</span>
          <span class="profile-value">{{ profile.username || 'N/A' }}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Faction:</span>
          <div v-if="profile.faction" class="faction-badge-container">
            <img
              v-if="factionLogo"
              :src="factionLogo"
              :alt="profile.faction"
              class="faction-logo-profile"
            />
            <span class="faction-badge">{{ profile.faction }}</span>
          </div>
          <span v-else class="profile-value">N/A</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Last Active:</span>
          <span class="profile-value">{{ formattedLastActive }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useWalletStore } from '../stores/wallet'
import { usePlayerProfilesStore } from '../stores/playerProfiles'
import DateRangePicker from './DateRangePicker.vue'
import BaseCopyButton from './BaseCopyButton.vue'
import { formatDate } from '../utils/formatters'

const walletStore = useWalletStore()
const playerProfilesStore = usePlayerProfilesStore()

const allTabs = [
  { name: 'Holdings', path: '/holdings' },
  { name: 'Total', path: '/total' },
  { name: 'Sage', path: '/sage' },
  { name: 'Locker', path: '/locker' },
  { name: 'Faction Claims', path: '/faction-claims' },
  { name: 'Faction Fleets', path: '/faction-fleets' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Rentals', path: '/rentals' },
  { name: 'Votes', path: '/votes' },
  { name: 'S&B', path: '/sb' },
  { name: 'Raw Data', path: '/raw-data' }
]

// Filter out S&B from displayed tabs (but keep it accessible via direct navigation)
const tabs = computed(() => allTabs.filter(tab => tab.path !== '/sb'))

const walletAddress = ref(walletStore.address)
const startDate = ref(walletStore.startDate)
const endDate = ref(walletStore.endDate)

// Sync walletAddress with walletStore.address
watch(() => walletStore.address, (newAddress) => {
  walletAddress.value = newAddress
}, { immediate: true })

// Fetch profiles on mount
onMounted(async () => {
  if (playerProfilesStore.profiles.length === 0 && !playerProfilesStore.loading) {
    await playerProfilesStore.fetchProfiles()
  }
})

// Get profile for current wallet - use walletStore.address directly to ensure reactivity
const profile = computed(() => {
  const address = walletStore.address.trim()
  if (!address) return null
  return playerProfilesStore.getProfileByWallet(address)
})

// Get faction class for styling
const factionClass = computed(() => {
  if (!profile.value?.faction) return ''
  const faction = profile.value.faction.toUpperCase()
  if (faction === 'MUD') return 'faction-mud'
  if (faction === 'USTUR') return 'faction-ustur'
  if (faction === 'ONI') return 'faction-oni'
  return ''
})

// Get faction logo path - using raw GitHub URLs for reliable GitHub Pages deployment
const factionLogo = computed(() => {
  if (!profile.value?.faction) return undefined
  const faction = profile.value.faction.toUpperCase()
  const baseUrl = 'https://raw.githubusercontent.com/DecentraGuild/SAWT/main/public'
  if (faction === 'MUD') return `${baseUrl}/MUD.svg`
  if (faction === 'USTUR') return `${baseUrl}/Ustur.svg`
  if (faction === 'ONI') return `${baseUrl}/ONI.svg`
  return undefined
})

// Format last active date
const formattedLastActive = computed(() => {
  if (!profile.value?.lastActive) return 'N/A'
  return formatDate(profile.value.lastActive)
})

watch([startDate, endDate], ([newStart, newEnd]) => {
  walletStore.setDateRange(newStart, newEnd)
})

function refreshData() {
  const wallet = walletAddress.value.trim()
  if (wallet) {
    walletStore.setWalletAddress(wallet)
    walletStore.setDateRange(startDate.value, endDate.value)
    // Trigger refresh to force refetch even if wallet address hasn't changed
    walletStore.triggerRefresh()
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

.nav-profile {
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-sm) var(--spacing-md);
}

.profile-info {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
  flex-wrap: wrap;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-tertiary);
}

.profile-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.profile-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.profile-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: 600;
}

.faction-badge-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.faction-logo-profile {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.faction-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: 700;
}

.profile-info.faction-mud {
  background-color: var(--color-faction-mud-bg);
  border-left: 4px solid var(--color-faction-mud-bright);
}

.profile-info.faction-mud .faction-badge {
  background-color: var(--color-faction-mud-dark);
  color: var(--color-faction-mud-bright);
}

.profile-info.faction-ustur {
  background-color: var(--color-faction-ustur-bg);
  border-left: 4px solid var(--color-faction-ustur-bright);
}

.profile-info.faction-ustur .faction-badge {
  background-color: var(--color-faction-ustur-dark);
  color: var(--color-faction-ustur-bright);
}

.profile-info.faction-oni {
  background-color: var(--color-faction-oni-bg);
  border-left: 4px solid var(--color-faction-oni-bright);
}

.profile-info.faction-oni .faction-badge {
  background-color: var(--color-faction-oni-dark);
  color: var(--color-faction-oni-bright);
}
</style>
