<template>
  <div class="page-container">
    <h1>Marketplace</h1>

    <!-- Wallet-specific exchanges section -->
    <div v-if="walletStore.address" class="wallet-exchanges-section">
      <div class="wallet-exchanges-header">
        <h2>Your Trades</h2>
        <button 
          v-if="!loading && exchanges.length > 0"
          class="toggle-button"
          @click="showWalletExchanges = !showWalletExchanges"
          :aria-expanded="showWalletExchanges"
        >
          <Icon :icon="showWalletExchanges ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
          <span>{{ showWalletExchanges ? 'Hide' : 'Show' }} Full Trade History</span>
        </button>
      </div>
      
      <BaseMessage v-if="error" type="error">
        {{ error }}
      </BaseMessage>

      <BaseMessage v-if="loading" type="loading">
        Fetching trades...
      </BaseMessage>

      <div v-if="!loading && exchanges.length > 0" class="exchanges-content">
        <div class="exchanges-summary">
          <!-- First row: Counts -->
          <div class="summary-row">
            <div class="summary-item">
              <span class="summary-label">Total Trades:</span>
              <span class="summary-value">{{ totalCount }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Unique Assets:</span>
              <span class="summary-value">{{ uniqueAssets }}</span>
            </div>
          </div>
          
          <!-- Second row: Financial metrics -->
          <div class="summary-row">
            <div class="summary-item">
              <span class="summary-label">Total Volume:</span>
              <div class="summary-value-container">
                <span class="summary-value">{{ formatCurrency(totalVolume, 'ATLAS') }}</span>
                <span class="summary-value-subtext">{{ formatUSD(totalVolumeUSD) }}</span>
              </div>
            </div>
            <div class="summary-item">
              <span class="summary-label">Buy Volume:</span>
              <div class="summary-value-container">
                <span class="summary-value">{{ formatCurrency(totalBuyVolume, 'ATLAS') }}</span>
                <span class="summary-value-subtext">{{ formatUSD(totalBuyVolumeUSD) }}</span>
              </div>
            </div>
            <div class="summary-item">
              <span class="summary-label">Sell Volume:</span>
              <div class="summary-value-container">
                <span class="summary-value">{{ formatCurrency(totalSellVolume, 'ATLAS') }}</span>
                <span class="summary-value-subtext">{{ formatUSD(totalSellVolumeUSD) }}</span>
              </div>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Fees:</span>
              <div class="summary-value-container">
                <span class="summary-value">{{ formatCurrency(totalFees, 'ATLAS') }}</span>
                <span class="summary-value-subtext">{{ formatUSD(totalFeesUSD) }}</span>
              </div>
            </div>
            <div class="summary-item">
              <span class="summary-label">Profits:</span>
              <div class="summary-value-container">
                <span class="summary-value" :class="{ 'profit-positive': profits > 0, 'profit-negative': profits < 0 }">
                  {{ formatCurrency(profits, 'ATLAS') }}
                </span>
                <span class="summary-value-subtext" :class="{ 'profit-positive': profits > 0, 'profit-negative': profits < 0 }">
                  {{ formatUSD(profitsUSD) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-show="showWalletExchanges">
          <DataTable
            title="Trade History"
            :columns="tableColumns"
            :data="tableData"
            :show-summary="false"
          />
        </div>
      </div>

      <BaseMessage v-if="!loading && exchanges.length === 0 && walletStore.address && lastFetchedWallet" type="empty">
        No trades found for this wallet address.
      </BaseMessage>
    </div>

    <BaseMessage v-if="!walletStore.address" type="info">
      Enter a wallet address in the top navigation bar to view your marketplace trade history.
    </BaseMessage>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useMarketplaceStore } from '../stores/marketplace'
import { useWalletStore } from '../stores/wallet'
import DataTable, { type TableColumn } from '../components/DataTable.vue'
import BaseMessage from '../components/BaseMessage.vue'
import { formatDate, formatCurrency, formatWallet, formatUSD } from '../utils/formatters'

const marketplaceStore = useMarketplaceStore()
const walletStore = useWalletStore()

const exchanges = computed(() => marketplaceStore.exchanges)
const loading = computed(() => marketplaceStore.loading)
const error = computed(() => marketplaceStore.error)
const totalCount = computed(() => marketplaceStore.totalCount)
const totalVolume = computed(() => marketplaceStore.totalVolume)
const totalBuyVolume = computed(() => marketplaceStore.totalBuyVolume)
const totalSellVolume = computed(() => marketplaceStore.totalSellVolume)
const totalFees = computed(() => marketplaceStore.totalFees)
const profits = computed(() => marketplaceStore.profits)
const totalVolumeUSD = computed(() => marketplaceStore.totalVolumeUSD)
const totalBuyVolumeUSD = computed(() => marketplaceStore.totalBuyVolumeUSD)
const totalSellVolumeUSD = computed(() => marketplaceStore.totalSellVolumeUSD)
const totalFeesUSD = computed(() => marketplaceStore.totalFeesUSD)
const profitsUSD = computed(() => marketplaceStore.profitsUSD)
const uniqueAssets = computed(() => marketplaceStore.uniqueAssets)
const lastFetchedWallet = computed(() => marketplaceStore.lastFetchedWallet)
const assetName = marketplaceStore.assetName
const atlasPriceUSD = computed(() => marketplaceStore.atlasPriceUSD)
const atlasPriceHistory = computed(() => marketplaceStore.atlasPriceHistory)

const showWalletExchanges = ref(false)

// Initialize asset lookup data on mount (load NFTs for ship and NFT lookups)
onMounted(async () => {
  await marketplaceStore.initializeAssets(true) // Load NFTs for ship/NFT name resolution
})

// Watch for wallet changes and automatically fetch exchanges (only on initial load or wallet change)
watch(() => walletStore.address, async (newAddress) => {
  if (newAddress && newAddress.trim()) {
    await marketplaceStore.fetchExchanges(
      newAddress.trim(),
      walletStore.startDate || undefined,
      walletStore.endDate || undefined
    )
  } else {
    marketplaceStore.clearExchanges()
  }
}, { immediate: true })

// Watch for explicit refresh trigger (when refresh button is clicked)
watch(() => walletStore.refreshTrigger, async () => {
  if (walletStore.address && walletStore.address.trim()) {
    await marketplaceStore.fetchExchanges(
      walletStore.address.trim(),
      walletStore.startDate || undefined,
      walletStore.endDate || undefined
    )
  }
})

const tableColumns: TableColumn[] = [
  { key: 'timestamp', label: 'Date', format: 'text' },
  { key: 'side', label: 'Side', format: 'text' },
  { key: 'pair', label: 'Pair', format: 'text' },
  { key: 'asset', label: 'Asset', format: 'text' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'price', label: 'Price', format: 'number' },
  { key: 'fee', label: 'Fee', format: 'number' },
  { key: 'totalAtlas', label: 'Total (ATLAS)', format: 'currency' },
  { key: 'totalUSD', label: 'Total (USD)', format: 'currency-usd' },
  { key: 'buyer', label: 'Buyer', format: 'text', class: 'hash-cell' },
  { key: 'seller', label: 'Seller', format: 'text', class: 'hash-cell' },
  { key: 'instructionIndex', label: 'Instruction', format: 'number' }
]

const tableData = computed(() => {
  const walletAddress = walletStore.address?.toLowerCase() || ''
  
  // Explicitly depend on nfts and starbaseCargos to ensure reactivity
  const nftsCount = marketplaceStore.nfts.length
  const starbaseCargosCount = marketplaceStore.starbaseCargos.length
  
  return exchanges.value.map(exchange => {
    // Look up asset name using the mint address
    const assetMint = exchange.asset || ''
    const assetDisplayName = assetMint ? assetName(assetMint.trim()) : 'N/A'
    
    // Pair is the quote currency (ATLAS/USDC) - just show the token name
    const pairMint = exchange.pair || ''
    const pairDisplay = pairMint ? assetName(pairMint.trim()) : 'N/A'
    
    // Decode side based on wallet position
    // Side is from initializer's perspective
    const isWalletInitializer = walletAddress && exchange.orderInitializer?.toLowerCase() === walletAddress
    const isWalletTaker = walletAddress && exchange.orderTaker?.toLowerCase() === walletAddress
    
    let decodedSide = exchange.side || 'N/A'
    if (isWalletTaker && exchange.side) {
      // Flip the side if wallet is the taker
      decodedSide = exchange.side === 'BUY' ? 'SELL' : exchange.side === 'SELL' ? 'BUY' : exchange.side
    }
    // If wallet is initializer, use side as-is (it's already from their perspective)
    
    // Determine buyer and seller based on the decoded side (from wallet's perspective)
    let buyer = ''
    let seller = ''
    if (decodedSide === 'BUY') {
      // Wallet is buying (decoded side is from wallet's perspective)
      buyer = formatWallet(isWalletInitializer ? exchange.orderInitializer : exchange.orderTaker)
      seller = formatWallet(isWalletInitializer ? exchange.orderTaker : exchange.orderInitializer)
    } else if (decodedSide === 'SELL') {
      // Wallet is selling (decoded side is from wallet's perspective)
      seller = formatWallet(isWalletInitializer ? exchange.orderInitializer : exchange.orderTaker)
      buyer = formatWallet(isWalletInitializer ? exchange.orderTaker : exchange.orderInitializer)
    } else {
      // Fallback: determine from original side (initializer's perspective)
      if (exchange.side === 'BUY') {
        buyer = formatWallet(exchange.orderInitializer)
        seller = formatWallet(exchange.orderTaker)
      } else if (exchange.side === 'SELL') {
        seller = formatWallet(exchange.orderInitializer)
        buyer = formatWallet(exchange.orderTaker)
      } else {
        buyer = formatWallet(exchange.orderTaker)
        seller = formatWallet(exchange.orderInitializer)
      }
    }
    
    // Calculate transaction total (price + fees) in ATLAS
    const amount = parseFloat(exchange.amount || '0')
    const price = parseFloat(exchange.price || '0')
    const fee = parseFloat(exchange.fee || '0')
    const totalInQuoteCurrency = (amount * price) + fee
    
    // Convert to ATLAS using historical price for this transaction date
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    const ATLAS_MINT = 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx'
    
    // Get historical ATLAS price for this transaction date
    let atlasPriceForDate = atlasPriceUSD.value
    if (exchange.timestamp) {
      try {
        const tradeDate = new Date(exchange.timestamp)
        const tradeDay = new Date(tradeDate.getFullYear(), tradeDate.getMonth(), tradeDate.getDate())
        const tradeDayTimestamp = Math.floor(tradeDay.getTime() / 1000)
        const historicalPrice = marketplaceStore.atlasPriceHistory.get(tradeDayTimestamp)
        if (historicalPrice && historicalPrice > 0) {
          atlasPriceForDate = historicalPrice
        }
      } catch (err) {
        // Fallback to current price
      }
    }
    
    let totalAtlas = totalInQuoteCurrency
    if (pairMint === USDC_MINT && atlasPriceForDate > 0) {
      totalAtlas = totalInQuoteCurrency / atlasPriceForDate
    } else if (pairMint !== ATLAS_MINT) {
      // Unknown pair, assume ATLAS
      totalAtlas = totalInQuoteCurrency
    }
    
    // Convert to USD using the same historical price
    const totalUSD = totalAtlas * atlasPriceForDate
    
    return {
      timestamp: formatDate(exchange.timestamp),
      side: decodedSide,
      pair: pairDisplay,
      asset: assetDisplayName,
      amount,
      price,
      fee,
      totalAtlas,
      totalUSD,
      buyer,
      seller,
      instructionIndex: exchange.instructionIndex || 0
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

.exchanges-content {
  margin-top: var(--spacing-lg);
}

.exchanges-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.summary-row {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  justify-content: space-between;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 150px;
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.summary-value-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-value {
  font-size: var(--font-size-xl);
  color: var(--color-accent-teal);
  font-weight: 600;
}

.summary-value-subtext {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.summary-value.profit-positive,
.summary-value-subtext.profit-positive {
  color: #10b981; /* green for positive profits */
}

.summary-value.profit-negative,
.summary-value-subtext.profit-negative {
  color: #ef4444; /* red for negative profits */
}

.hash-cell {
  font-family: monospace;
  font-size: var(--font-size-sm);
}

.wallet-exchanges-section {
  margin-top: var(--spacing-xl);
}

.wallet-exchanges-header {
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
</style>

