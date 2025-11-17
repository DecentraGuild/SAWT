<template>
  <div class="page-container">
    <h1>S&B</h1>

    <!-- Loading state -->
    <BaseMessage v-if="loading" type="loading">
      Loading token wrapper data...
    </BaseMessage>

    <!-- Error state -->
    <BaseMessage v-if="error" type="error">
      {{ error }}
    </BaseMessage>

    <!-- Stats and Leaderboards Section -->
    <div v-if="!loading && !error" class="stats-section">
      <!-- DACBloons Stats -->
      <div class="token-stats-card">
        <h2>DACBloons</h2>
        <div class="stats-summary">
          <div class="summary-item">
            <span class="summary-label">Total Holdings:</span>
            <span class="summary-value">{{ formatNumber(dacBloonsStats.totalHoldings) }}</span>
          </div>
          <div v-if="dacbWrapRatio" class="summary-item">
            <span class="summary-label">Current Wrap Ratio:</span>
            <span class="summary-value">{{ formatNumber(dacbWrapRatio.ratio) }} {{ dacbWrapRatio.inputToken }} per 1 {{ dacbWrapRatio.outputToken }}</span>
          </div>
        </div>
        <div class="leaderboard-section">
          <h3>Leaderboard</h3>
          <DataTable
            title=""
            :columns="dacbLeaderboardColumns"
            :data="dacBloonsLeaderboardData"
            :show-summary="false"
            :get-row-class="getLeaderboardRowClass"
          >
            <template #cell-rank="{ value, row }">
              <div class="rank-cell number-cell-content">
                <span>{{ value }}</span>
                <div class="faction-logo-container">
                  <img
                    v-if="getFactionLogo(row.walletAddress)"
                    :src="getFactionLogo(row.walletAddress)"
                    :alt="getFaction(row.walletAddress) || ''"
                    class="faction-logo-small"
                  />
                </div>
              </div>
            </template>
            <template #cell-wallet="{ value, row }">
              <div class="wallet-cell">
                <span :class="getFactionClass(row.walletAddress)">
                  {{ getWalletDisplayName(row.walletAddress) }}
                </span>
                <BaseCopyButton
                  :text-to-copy="row.walletAddress"
                  size="small"
                  tooltip="Copy wallet address"
                />
              </div>
            </template>
            <template #cell-currentHoldings="{ value }">
              <span>{{ formatNumber(value) }} DACB</span>
            </template>
            <template #cell-transferCount="{ value }">
              <span>{{ value }}</span>
            </template>
          </DataTable>
        </div>
      </div>

      <!-- DAOBloons Stats -->
      <div class="token-stats-card">
        <h2>DAOBloons</h2>
        <div class="stats-summary">
          <div class="summary-item">
            <span class="summary-label">Total Holdings:</span>
            <span class="summary-value">{{ formatNumber(daobloonsStats.totalHoldings) }}</span>
          </div>
          <div v-if="daobWrapRatio" class="summary-item">
            <span class="summary-label">Current Wrap Ratio:</span>
            <span class="summary-value">{{ formatNumber(daobWrapRatio.ratio) }} {{ daobWrapRatio.inputToken }} per 1 {{ daobWrapRatio.outputToken }}</span>
          </div>
        </div>
        <div class="leaderboard-section">
          <h3>Leaderboard</h3>
          <DataTable
            title=""
            :columns="daobLeaderboardColumns"
            :data="daobloonsLeaderboardData"
            :show-summary="false"
            :get-row-class="getLeaderboardRowClass"
          >
            <template #cell-rank="{ value, row }">
              <div class="rank-cell number-cell-content">
                <span>{{ value }}</span>
                <div class="faction-logo-container">
                  <img
                    v-if="getFactionLogo(row.walletAddress)"
                    :src="getFactionLogo(row.walletAddress)"
                    :alt="getFaction(row.walletAddress) || ''"
                    class="faction-logo-small"
                  />
                </div>
              </div>
            </template>
            <template #cell-wallet="{ value, row }">
              <div class="wallet-cell">
                <span :class="getFactionClass(row.walletAddress)">
                  {{ getWalletDisplayName(row.walletAddress) }}
                </span>
                <BaseCopyButton
                  :text-to-copy="row.walletAddress"
                  size="small"
                  tooltip="Copy wallet address"
                />
              </div>
            </template>
            <template #cell-costBasis="{ value, row }">
              <span>{{ formatNumber(value) }} POLIS</span>
            </template>
            <template #cell-currentValue="{ value, row }">
              <span>{{ formatNumber(value) }} POLIS</span>
            </template>
            <template #cell-return="{ value, row }">
              <span :class="{ 'return-positive': value > 0, 'return-negative': value < 0 }">
                {{ formatNumber(value) }}%
              </span>
            </template>
            <template #cell-returnAmount="{ value, row }">
              <span :class="{ 'return-positive': value > 0, 'return-negative': value < 0 }">
                {{ formatNumber(value) }} POLIS
              </span>
            </template>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- All transactions section -->
    <div class="transactions-section">
      <div class="transactions-header">
        <h2>Transaction History</h2>
        <button 
          v-if="!loading && (allMints.length > 0 || allBurns.length > 0 || allTransfers.length > 0)"
          class="toggle-button"
          @click="showTransactions = !showTransactions"
          :aria-expanded="showTransactions"
        >
          <Icon :icon="showTransactions ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
          <span>{{ showTransactions ? 'Hide' : 'Show' }} Full Transaction History</span>
        </button>
      </div>

      <BaseMessage v-if="loading" type="loading">
        Fetching transactions...
      </BaseMessage>

      <div v-if="!loading && (allMints.length > 0 || allBurns.length > 0 || allTransfers.length > 0)" class="transactions-content">
        <div class="transactions-summary">
          <div class="summary-item">
            <span class="summary-label">Total Mints:</span>
            <span class="summary-value">{{ allMints.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Burns:</span>
            <span class="summary-value">{{ allBurns.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Transfers:</span>
            <span class="summary-value">{{ allTransfers.length }}</span>
          </div>
        </div>

        <div v-show="showTransactions">
          <!-- Mints Table -->
          <div v-if="allMints.length > 0" class="transaction-table-section">
            <h3>Mints</h3>
            <DataTable
              title=""
              :columns="mintsColumns"
              :data="mintsTableData"
              :show-summary="false"
              :get-row-class="getTransactionRowClass"
            >
              <template #cell-ownerDisplay="{ value, row }">
                <span :class="row.ownerDisplayClass">{{ value }}</span>
              </template>
            </DataTable>
          </div>

          <!-- Burns Table -->
          <div v-if="allBurns.length > 0" class="transaction-table-section">
            <h3>Burns</h3>
            <DataTable
              title=""
              :columns="burnsColumns"
              :data="burnsTableData"
              :show-summary="false"
              :get-row-class="getTransactionRowClass"
            >
              <template #cell-ownerDisplay="{ value, row }">
                <span :class="row.ownerDisplayClass">{{ value }}</span>
              </template>
            </DataTable>
          </div>

          <!-- Transfers Table -->
          <div v-if="allTransfers.length > 0" class="transaction-table-section">
            <h3>Transfers</h3>
            <DataTable
              title=""
              :columns="transfersColumns"
              :data="transfersTableData"
              :show-summary="false"
              :get-row-class="getTransactionRowClass"
            >
              <template #cell-fromAccountDisplay="{ value, row }">
                <span :class="row.fromAccountDisplayClass">{{ value }}</span>
              </template>
              <template #cell-toAccountDisplay="{ value, row }">
                <span :class="row.toAccountDisplayClass">{{ value }}</span>
              </template>
            </DataTable>
          </div>
        </div>
      </div>

      <BaseMessage v-if="!loading && allMints.length === 0 && allBurns.length === 0 && allTransfers.length === 0" type="empty">
        No transactions found.
      </BaseMessage>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useTokenWrapperStore } from '../stores/tokenWrapper'
import { useWalletStore } from '../stores/wallet'
import { usePlayerProfilesStore } from '../stores/playerProfiles'
import DataTable, { type TableColumn } from '../components/DataTable.vue'
import BaseMessage from '../components/BaseMessage.vue'
import { formatDate, formatWallet, formatNumberOptimized } from '../utils/formatters'
import BaseCopyButton from '../components/BaseCopyButton.vue'

const tokenWrapperStore = useTokenWrapperStore()
const walletStore = useWalletStore()
const playerProfilesStore = usePlayerProfilesStore()

const loading = computed(() => tokenWrapperStore.loading)
const error = computed(() => tokenWrapperStore.error)
const dacBloonsStats = computed(() => tokenWrapperStore.dacBloonsStats)
const daobloonsStats = computed(() => tokenWrapperStore.daobloonsStats)
const daobWrapRatio = computed(() => tokenWrapperStore.daobWrapRatio)
const dacbWrapRatio = computed(() => tokenWrapperStore.dacbWrapRatio)
const allMints = computed(() => tokenWrapperStore.allMints)
const allBurns = computed(() => tokenWrapperStore.allBurns)
const allTransfers = computed(() => tokenWrapperStore.allTransfers)

const showTransactions = ref(false)

// Fetch data on mount
onMounted(async () => {
  if (tokenWrapperStore.allMints.length === 0 && !loading.value) {
    await tokenWrapperStore.fetchData()
  }
  // Fetch player profiles
  if (playerProfilesStore.profiles.length === 0 && !playerProfilesStore.loading) {
    await playerProfilesStore.fetchProfiles()
  }
})

// Get username for a wallet
function getUsername(wallet: string): string | null {
  if (!wallet) return null
  return playerProfilesStore.getUsername(wallet)
}

// Get wallet display name - checks guild wallet name, username, or formatted wallet
function getWalletDisplayName(wallet: string): string {
  if (!wallet) return 'Unknown'
  // Check for guild wallet name first
  const guildName = tokenWrapperStore.getGuildWalletName(wallet)
  if (guildName) return guildName
  // Check for username
  const username = getUsername(wallet)
  if (username) return username
  // Fall back to formatted wallet address
  return formatWallet(wallet)
}

// Get token display name - checks token name mapping or formatted mint address
function getTokenDisplayName(tokenMint: string): string {
  if (!tokenMint) return 'Unknown'
  // Check for token name first
  const tokenName = tokenWrapperStore.getTokenName(tokenMint)
  if (tokenName) return tokenName
  // Fall back to formatted mint address
  return formatWallet(tokenMint)
}

// Get faction for a wallet
function getFaction(wallet: string): string | null {
  if (!wallet) return null
  return playerProfilesStore.getFaction(wallet)
}

// Get faction class for styling
function getFactionClass(wallet: string): string {
  if (!wallet) return ''
  const faction = getFaction(wallet)
  if (!faction) return ''
  if (faction === 'MUD') return 'faction-mud'
  if (faction === 'USTUR') return 'faction-ustur'
  if (faction === 'ONI') return 'faction-oni'
  return ''
}

// Get faction logo path - using raw GitHub URLs for reliable GitHub Pages deployment
function getFactionLogo(wallet: string): string | undefined {
  if (!wallet) return undefined
  const faction = getFaction(wallet)
  if (!faction) return undefined
  const baseUrl = 'https://raw.githubusercontent.com/DecentraGuild/SAWT/main/public'
  if (faction === 'MUD') return `${baseUrl}/MUD.svg`
  if (faction === 'USTUR') return `${baseUrl}/Ustur.svg`
  if (faction === 'ONI') return `${baseUrl}/ONI.svg`
  return undefined
}

// Watch for endDate changes and update store
watch(() => walletStore.endDate, (newEndDate) => {
  tokenWrapperStore.setDateRange(newEndDate || '')
}, { immediate: true })

// Format number helper
function formatNumber(value: number): string {
  return formatNumberOptimized(value)
}

// Leaderboard columns for DACB (transfers-only)
const dacbLeaderboardColumns: TableColumn[] = [
  { key: 'rank', label: 'Rank', format: 'number', class: 'number-cell' },
  { key: 'wallet', label: 'Wallet', format: 'text', class: 'hash-cell' },
  { key: 'currentHoldings', label: 'Total Transferred', format: 'number', class: 'number-cell' },
  { key: 'transferCount', label: 'Transfer Count', format: 'number', class: 'number-cell' }
]

// Leaderboard columns for DAOB (with cost basis and returns)
const daobLeaderboardColumns: TableColumn[] = [
  { key: 'rank', label: 'Rank', format: 'number', class: 'number-cell' },
  { key: 'wallet', label: 'Wallet', format: 'text', class: 'hash-cell' },
  { key: 'currentHoldings', label: 'Current Holdings', format: 'number', class: 'number-cell' },
  { key: 'costBasis', label: 'Cost Basis', format: 'number', class: 'number-cell' },
  { key: 'currentValue', label: 'Current Value', format: 'number', class: 'number-cell' },
  { key: 'return', label: 'Return %', format: 'number', class: 'number-cell' },
  { key: 'returnAmount', label: 'Return Amount', format: 'number', class: 'number-cell' }
]

// Leaderboard data for DACBloons (transfers-only)
const dacBloonsLeaderboardData = computed(() => {
  return dacBloonsStats.value.walletStats.map((stat, index) => ({
    rank: index + 1,
    wallet: stat.wallet,
    currentHoldings: stat.currentHoldings,
    transferCount: (stat as any).transferCount || 0,
    walletAddress: stat.wallet // Store full address for highlighting
  }))
})

// Leaderboard data for DAOBloons
const daobloonsLeaderboardData = computed(() => {
  return daobloonsStats.value.walletStats.map((stat, index) => ({
    rank: index + 1,
    wallet: stat.wallet,
    currentHoldings: stat.currentHoldings,
    costBasis: stat.costBasis,
    currentValue: stat.currentValue,
    return: stat.return,
    returnAmount: stat.returnAmount,
    walletAddress: stat.wallet // Store full address for highlighting
  }))
})

// Get row class for leaderboard highlighting (with faction colors)
function getLeaderboardRowClass(row: any): string {
  if (!walletStore.address || !row.walletAddress) return ''
  
  const walletLower = walletStore.address.toLowerCase()
  const rowWalletLower = row.walletAddress.toLowerCase()
  
  if (walletLower === rowWalletLower) {
    const faction = getFaction(row.walletAddress)
    if (faction === 'MUD') return 'wallet-highlight-faction-mud'
    if (faction === 'USTUR') return 'wallet-highlight-faction-ustur'
    if (faction === 'ONI') return 'wallet-highlight-faction-oni'
    return 'wallet-highlight-default'
  }
  return ''
}

// Mints columns
const mintsColumns: TableColumn[] = [
  { key: 'timestamp', label: 'Date', format: 'text' },
  { key: 'mint', label: 'Mint', format: 'text', class: 'hash-cell' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'account', label: 'Account', format: 'text', class: 'hash-cell' },
  { key: 'ownerDisplay', label: 'Owner', format: 'text', class: 'hash-cell' },
  { key: 'instruction', label: 'Instruction', format: 'text', class: 'hash-cell' }
]

// Burns columns
const burnsColumns: TableColumn[] = [
  { key: 'timestamp', label: 'Date', format: 'text' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'account', label: 'Account', format: 'text', class: 'hash-cell' },
  { key: 'ownerDisplay', label: 'Owner', format: 'text', class: 'hash-cell' },
  { key: 'instruction', label: 'Instruction', format: 'text', class: 'hash-cell' }
]

// Transfers columns
const transfersColumns: TableColumn[] = [
  { key: 'timestamp', label: 'Date', format: 'text' },
  { key: 'mint', label: 'Mint', format: 'text', class: 'hash-cell' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'fromAccountDisplay', label: 'From', format: 'text', class: 'hash-cell' },
  { key: 'toAccountDisplay', label: 'To', format: 'text', class: 'hash-cell' },
  { key: 'instruction', label: 'Instruction', format: 'text', class: 'hash-cell' }
]

// Constants for decimal conversion
const TOKEN_DECIMALS = 8
const DECIMAL_DIVISOR = Math.pow(10, TOKEN_DECIMALS)

// Get row class for transaction highlighting (if wallet matches, with faction colors)
function getTransactionRowClass(row: any): string {
  if (!walletStore.address) return ''
  
  const walletLower = walletStore.address.toLowerCase()
  let matchingWallet: string | null = null
  
  // Check if row involves the wallet
  if (row.owner && row.owner.toLowerCase() === walletLower) {
    matchingWallet = row.owner
  } else if (row.fromAccount && row.fromAccount.toLowerCase() === walletLower) {
    matchingWallet = row.fromAccount
  } else if (row.toAccount && row.toAccount.toLowerCase() === walletLower) {
    matchingWallet = row.toAccount
  }
  
  if (matchingWallet) {
    const faction = getFaction(matchingWallet)
    if (faction === 'MUD') return 'wallet-highlight-faction-mud'
    if (faction === 'USTUR') return 'wallet-highlight-faction-ustur'
    if (faction === 'ONI') return 'wallet-highlight-faction-oni'
    return 'wallet-highlight-default'
  }
  
  return ''
}

// Mints table data
const mintsTableData = computed(() => {
  return allMints.value.map(mint => {
    // Use owner if available, otherwise fall back to account address
    const owner = mint.solanaAccountByAccount?.owner || mint.account || 'N/A'
    
    return {
      timestamp: formatDate(mint.timestamp),
      mint: getTokenDisplayName(mint.mint),
      amount: parseFloat(mint.amountRaw || '0') / DECIMAL_DIVISOR,
      account: formatWallet(mint.account),
      owner: owner, // Store full address for highlighting
      ownerDisplay: getWalletDisplayName(owner),
      ownerDisplayClass: getFactionClass(owner),
      instruction: formatWallet(mint.byInstruction)
    }
  })
})

// Burns table data
const burnsTableData = computed(() => {
  return allBurns.value.map(burn => {
    // Use owner if available, otherwise fall back to account address
    const owner = burn.solanaAccountByAccount?.owner || burn.account || 'N/A'
    
    return {
      timestamp: formatDate(burn.timestamp),
      amount: parseFloat(burn.amountRaw || '0') / DECIMAL_DIVISOR,
      account: formatWallet(burn.account),
      owner: owner, // Store full address for highlighting
      ownerDisplay: getWalletDisplayName(owner),
      ownerDisplayClass: getFactionClass(owner),
      instruction: formatWallet(burn.byInstruction)
    }
  })
})

// Transfers table data
const transfersTableData = computed(() => {
  return allTransfers.value.map(transfer => {
    // Use owner if available, otherwise fall back to account address
    const fromOwner = transfer.solanaAccountByFromAccount?.owner || transfer.fromAccount || 'N/A'
    const toOwner = transfer.solanaAccountByToAccount?.owner || transfer.toAccount || 'N/A'
    
    return {
      timestamp: formatDate(transfer.timestamp),
      mint: getTokenDisplayName(transfer.mint),
      amount: parseFloat(transfer.amountRaw || '0') / DECIMAL_DIVISOR,
      fromAccount: fromOwner, // Store full address for highlighting
      fromAccountDisplay: getWalletDisplayName(fromOwner),
      fromAccountDisplayClass: getFactionClass(fromOwner),
      toAccount: toOwner, // Store full address for highlighting
      toAccountDisplay: getWalletDisplayName(toOwner),
      toAccountDisplayClass: getFactionClass(toOwner),
      instruction: formatWallet(transfer.byInstruction)
    }
  })
})
</script>

<style scoped>
.page-container {
  padding: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.token-stats-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.token-stats-card h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  color: var(--color-accent-teal);
  font-size: var(--font-size-xl);
}

.stats-summary {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 120px;
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.summary-value {
  font-size: var(--font-size-xl);
  color: var(--color-accent-teal);
  font-weight: 600;
}

.summary-value.net-positive {
  color: #10b981;
}

.summary-value.net-negative {
  color: #ef4444;
}

.leaderboard-section {
  margin-top: var(--spacing-lg);
}

.leaderboard-section h3 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.hash-cell {
  font-family: monospace;
  font-size: var(--font-size-sm);
}

.transactions-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 2px solid var(--color-border);
}

.transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
}

.toggle-button:hover {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-color: var(--color-accent-teal);
}

.toggle-button :deep(svg) {
  width: 18px;
  height: 18px;
}

.transactions-content {
  margin-top: var(--spacing-lg);
}

.transactions-summary {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

.transaction-table-section {
  margin-bottom: var(--spacing-lg);
}

.transaction-table-section h3 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

/* Faction-specific wallet highlight rows */
:deep(.wallet-highlight-faction-mud) {
  box-shadow: inset 3px 0 0 var(--color-faction-mud-bright);
  background-color: var(--color-faction-mud-bg);
}

:deep(.wallet-highlight-faction-mud:hover) {
  box-shadow: inset 3px 0 0 var(--color-faction-mud-bright), 0 0 12px rgba(255, 68, 68, 0.3);
  background-color: rgba(255, 68, 68, 0.2);
}

:deep(.wallet-highlight-faction-ustur) {
  box-shadow: inset 3px 0 0 var(--color-faction-ustur-bright);
  background-color: var(--color-faction-ustur-bg);
}

:deep(.wallet-highlight-faction-ustur:hover) {
  box-shadow: inset 3px 0 0 var(--color-faction-ustur-bright), 0 0 12px rgba(255, 215, 0, 0.2);
  background-color: rgba(255, 215, 0, 0.2);
}

:deep(.wallet-highlight-faction-oni) {
  box-shadow: inset 3px 0 0 var(--color-faction-oni-bright);
  background-color: var(--color-faction-oni-bg);
}

:deep(.wallet-highlight-faction-oni:hover) {
  box-shadow: inset 3px 0 0 var(--color-faction-oni-bright), 0 0 12px rgba(68, 68, 255, 0.2);
  background-color: rgba(68, 68, 255, 0.2);
}

:deep(.wallet-highlight-default) {
  box-shadow: inset 3px 0 0 var(--color-highlight-default);
  background-color: var(--color-highlight-default-bg);
}

:deep(.wallet-highlight-default:hover) {
  box-shadow: inset 3px 0 0 var(--color-highlight-default), 0 0 12px rgba(168, 85, 247, 0.2);
  background-color: rgba(168, 85, 247, 0.2);
}

.wallet-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.return-positive {
  color: #10b981;
  font-weight: 600;
}

.return-negative {
  color: #ef4444;
  font-weight: 600;
}

/* Faction color classes for wallet text */
.faction-mud {
  color: var(--color-faction-mud-bright);
  font-weight: 700;
}

.faction-ustur {
  color: var(--color-faction-ustur-bright);
  font-weight: 700;
}

.faction-oni {
  color: var(--color-faction-oni-bright);
  font-weight: 700;
}

.rank-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.rank-cell.number-cell-content {
  justify-content: center;
}

.faction-logo-container {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.faction-logo-small {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
</style>

