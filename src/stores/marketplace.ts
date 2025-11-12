import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchExchangesByWallet, type ExchangeNode } from '../services/marketplaceService'
import { fetchAllNFTs, type StarAtlasNFT } from '../services/starAtlasGalaxyService'
import { fetchTokenMarketData, fetchTokenMarketChart, type CoinGeckoPriceData } from '../services/coingeckoService'

export interface StarbaseCargo {
  name: string
  symbol: string
  mint: string
  program_id: string
  starbase_name: string
  starbase_address: string
  seqId: number
  cargoMint: string
  sector: {
    x: number
    y: number
  }
  faction: string
}

export const useMarketplaceStore = defineStore('marketplace', () => {
  const exchanges = ref<ExchangeNode[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const lastFetchedWallet = ref<string>('')
  
  // Asset lookup data
  const starbaseCargos = ref<StarbaseCargo[]>([])
  const nfts = ref<StarAtlasNFT[]>([])
  const assetsLoading = ref<boolean>(false)
  
  // ATLAS price in USD (for conversions)
  const atlasPriceUSD = ref<number>(0)
  const atlasPriceLoading = ref<boolean>(false)
  
  // Historical ATLAS prices: Map of timestamp (day) -> price
  const atlasPriceHistory = ref<Map<number, number>>(new Map())
  const atlasPriceHistoryLoading = ref<boolean>(false)

  const totalCount = computed(() => exchanges.value.length)

  // Helper to decode side from wallet's perspective
  function getDecodedSide(exchange: ExchangeNode, walletAddress: string): 'BUY' | 'SELL' | 'N/A' {
    if (!walletAddress) return 'N/A'
    
    const isWalletInitializer = exchange.orderInitializer?.toLowerCase() === walletAddress.toLowerCase()
    const isWalletTaker = exchange.orderTaker?.toLowerCase() === walletAddress.toLowerCase()
    
    if (!isWalletInitializer && !isWalletTaker) return 'N/A'
    
    // Side is from initializer's perspective
    if (isWalletTaker && exchange.side) {
      // Flip the side if wallet is the taker
      return exchange.side === 'BUY' ? 'SELL' : exchange.side === 'SELL' ? 'BUY' : 'N/A'
    }
    
    // If wallet is initializer, use side as-is
    return (exchange.side as 'BUY' | 'SELL') || 'N/A'
  }

  // Get the last known historical price (oldest price in history)
  function getLastKnownHistoricalPrice(): number {
    if (atlasPriceHistory.value.size === 0) {
      return atlasPriceUSD.value // Fallback to current if no history
    }
    
    // Find the oldest (smallest) timestamp in the map
    const timestamps = Array.from(atlasPriceHistory.value.keys())
    const oldestTimestamp = Math.min(...timestamps)
    const lastKnownPrice = atlasPriceHistory.value.get(oldestTimestamp)
    
    return lastKnownPrice && lastKnownPrice > 0 ? lastKnownPrice : atlasPriceUSD.value
  }

  // Get ATLAS price for a specific date (uses historical price if available, falls back to last known historical)
  function getAtlasPriceForDate(timestamp: string): number {
    if (!timestamp) return getLastKnownHistoricalPrice()
    
    try {
      const tradeDate = new Date(timestamp)
      const tradeDay = new Date(tradeDate.getFullYear(), tradeDate.getMonth(), tradeDate.getDate())
      const tradeDayTimestamp = Math.floor(tradeDay.getTime() / 1000) // Unix timestamp in seconds
      
      // Look up historical price for this day
      const historicalPrice = atlasPriceHistory.value.get(tradeDayTimestamp)
      if (historicalPrice && historicalPrice > 0) {
        return historicalPrice
      }
      
      // Fallback to last known historical price (oldest price in history) for trades older than available data
      return getLastKnownHistoricalPrice()
    } catch (err) {
      console.warn('Error parsing timestamp for price lookup:', timestamp, err)
      return getLastKnownHistoricalPrice()
    }
  }

  // Helper to convert value to ATLAS using historical price for the transaction date
  function convertToAtlas(value: number, pairMint: string, transactionTimestamp?: string): number {
    if (!pairMint) return value
    
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    const ATLAS_MINT = 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx'
    
    // Get the appropriate ATLAS price (historical if available, otherwise current)
    const atlasPrice = transactionTimestamp 
      ? getAtlasPriceForDate(transactionTimestamp)
      : atlasPriceUSD.value
    
    if (atlasPrice === 0) return value
    
    // If pair is USDC, convert to ATLAS (divide by ATLAS price)
    if (pairMint === USDC_MINT) {
      return value / atlasPrice
    }
    
    // If pair is ATLAS, return as-is
    if (pairMint === ATLAS_MINT) {
      return value
    }
    
    // Unknown pair, return as-is
    return value
  }

  // Calculate transaction total (price + fees) in ATLAS for a single exchange
  function getTransactionTotalAtlas(exchange: ExchangeNode): number {
    const amount = parseFloat(exchange.amount || '0')
    const price = parseFloat(exchange.price || '0')
    const fee = parseFloat(exchange.fee || '0')
    const total = (amount * price) + fee
    return convertToAtlas(total, exchange.pair || '', exchange.timestamp)
  }

  // Calculate total volume in ATLAS (sum of all transaction totals: price + fees)
  const totalVolume = computed(() => {
    return exchanges.value.reduce((sum, exchange) => {
      return sum + getTransactionTotalAtlas(exchange)
    }, 0)
  })

  // Calculate total buy volume in ATLAS (from wallet's perspective, using transaction totals)
  const totalBuyVolume = computed(() => {
    const walletAddress = lastFetchedWallet.value
    if (!walletAddress) return 0
    
    return exchanges.value.reduce((sum, exchange) => {
      const decodedSide = getDecodedSide(exchange, walletAddress)
      if (decodedSide === 'BUY') {
        return sum + getTransactionTotalAtlas(exchange)
      }
      return sum
    }, 0)
  })

  // Calculate total sell volume in ATLAS (from wallet's perspective, using transaction totals)
  const totalSellVolume = computed(() => {
    const walletAddress = lastFetchedWallet.value
    if (!walletAddress) return 0
    
    return exchanges.value.reduce((sum, exchange) => {
      const decodedSide = getDecodedSide(exchange, walletAddress)
      if (decodedSide === 'SELL') {
        return sum + getTransactionTotalAtlas(exchange)
      }
      return sum
    }, 0)
  })

  // Calculate total fees paid in ATLAS (converted from USDC if needed)
  const totalFees = computed(() => {
    return exchanges.value.reduce((sum, exchange) => {
      const fee = parseFloat(exchange.fee || '0')
      return sum + convertToAtlas(fee, exchange.pair || '', exchange.timestamp)
    }, 0)
  })

  // Calculate profits in ATLAS: Sell Total - Buy Total
  // Note: Fees are already included in the transaction totals, so we don't subtract them again
  const profits = computed(() => {
    return totalSellVolume.value - totalBuyVolume.value
  })

  // USD equivalents (ATLAS value * ATLAS price)
  const totalVolumeUSD = computed(() => totalVolume.value * atlasPriceUSD.value)
  const totalBuyVolumeUSD = computed(() => totalBuyVolume.value * atlasPriceUSD.value)
  const totalSellVolumeUSD = computed(() => totalSellVolume.value * atlasPriceUSD.value)
  const totalFeesUSD = computed(() => totalFees.value * atlasPriceUSD.value)
  const profitsUSD = computed(() => profits.value * atlasPriceUSD.value)

  // Count unique assets traded (not pairs)
  const uniqueAssets = computed(() => {
    const assets = new Set<string>()
    exchanges.value.forEach(exchange => {
      if (exchange.asset) {
        assets.add(exchange.asset)
      }
    })
    return assets.size
  })

  /**
   * Look up asset name by mint address
   * Checks: ATLAS/USDC hardcoded -> NFTs -> Starbase Cargos
   * This is a function (not computed) to ensure it always uses the latest nfts/starbaseCargos values
   */
  function assetName(mint: string): string {
    if (!mint || mint.trim() === '') {
      return 'N/A'
    }

    // Normalize mint address (trim and ensure consistent case)
    const normalizedMint = mint.trim()

    let name: string | undefined = undefined

    // Check hardcoded tokens
    if (normalizedMint === 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx') {
      return 'ATLAS'
    }
    if (normalizedMint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
      return 'USDC'
    }

    // Check NFTs (case-sensitive match)
    if (nfts.value.length > 0) {
      const nft = nfts.value.find((nft) => nft.mint === normalizedMint)
      if (nft) {
        console.debug(`Found NFT for mint ${normalizedMint}: ${nft.name}`)
        return nft.name
      }
    } else {
      console.debug(`NFTs not loaded yet for mint: ${normalizedMint}`)
    }

    // Check starbase cargos (by cargoMint for starbase-specific tokens)
    if (starbaseCargos.value.length > 0) {
      const starbaseCargo = starbaseCargos.value.find(
        (cargo) => cargo.cargoMint === normalizedMint
      )
      if (starbaseCargo) {
        return starbaseCargo.name + ' [local]'
      }
    }

    // Check starbase cargos (by mint for original resource mints)
    if (starbaseCargos.value.length > 0) {
      const starbaseCargo = starbaseCargos.value.find(
        (cargo) => cargo.mint === normalizedMint
      )
      if (starbaseCargo) {
        return starbaseCargo.name
      }
    }

    // Debug: log if we couldn't find the mint (only for non-ATLAS/USDC)
    // Check if any NFT has a similar mint (first/last few chars match)
    const similarMints = nfts.value
      .filter(n => n.mint.substring(0, 8) === normalizedMint.substring(0, 8) || 
                   n.mint.substring(n.mint.length - 8) === normalizedMint.substring(normalizedMint.length - 8))
      .slice(0, 3)
      .map(n => ({ mint: n.mint, name: n.name }))
    
    console.warn(`Could not find asset name for mint: ${normalizedMint}`, {
      nftsLoaded: nfts.value.length,
      starbaseCargosLoaded: starbaseCargos.value.length,
      normalizedMintLength: normalizedMint.length,
      similarMints: similarMints.length > 0 ? similarMints : 'none found'
    })

    return '???'
  }

  async function fetchExchanges(wallet: string, startDate?: string, endDate?: string) {
    if (!wallet || wallet.trim() === '') {
      error.value = 'Wallet address is required'
      return
    }

    loading.value = true
    error.value = null

    try {
      exchanges.value = await fetchExchangesByWallet(wallet, startDate, endDate)
      lastFetchedWallet.value = wallet
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch exchanges'
      exchanges.value = []
    } finally {
      loading.value = false
    }
  }

  function clearExchanges() {
    exchanges.value = []
    error.value = null
    lastFetchedWallet.value = ''
  }

  /**
   * Load starbase cargos from JSON file
   */
  async function loadStarbaseCargos() {
    if (starbaseCargos.value.length > 0) {
      return // Already loaded
    }

    assetsLoading.value = true
    try {
      const response = await fetch('/starbase-cargos.json')
      if (!response.ok) {
        throw new Error(`Failed to load starbase cargos: ${response.statusText}`)
      }
      const data = await response.json()
      starbaseCargos.value = data as StarbaseCargo[]
    } catch (err) {
      console.error('Error loading starbase cargos:', err)
      starbaseCargos.value = []
    } finally {
      assetsLoading.value = false
    }
  }

  /**
   * Load NFTs from Star Atlas Galaxy API
   * Optional - can be called separately if needed
   */
  async function loadNFTs() {
    if (nfts.value.length > 0) {
      return // Already loaded
    }

    assetsLoading.value = true
    try {
      const fetchedNFTs = await fetchAllNFTs()
      nfts.value = fetchedNFTs
      console.log(`Loaded ${fetchedNFTs.length} NFTs from Galaxy API`)
    } catch (err) {
      console.error('Error loading NFTs:', err)
      nfts.value = []
    } finally {
      assetsLoading.value = false
    }
  }

  /**
   * Load ATLAS price from CoinGecko (current price)
   */
  async function loadAtlasPrice() {
    if (atlasPriceUSD.value > 0) {
      return // Already loaded
    }

    atlasPriceLoading.value = true
    try {
      const marketData = await fetchTokenMarketData('ATLAS')
      atlasPriceUSD.value = marketData.current_price
      console.log(`Loaded ATLAS current price: $${atlasPriceUSD.value}`)
    } catch (err) {
      console.error('Error loading ATLAS price:', err)
      atlasPriceUSD.value = 0
    } finally {
      atlasPriceLoading.value = false
    }
  }

  /**
   * Load historical ATLAS prices from CoinGecko
   * Fetches up to 365 days of historical data
   */
  async function loadAtlasPriceHistory() {
    if (atlasPriceHistory.value.size > 0) {
      return // Already loaded
    }

    atlasPriceHistoryLoading.value = true
    try {
      // Fetch 365 days of historical data (max allowed by CoinGecko)
      const priceData = await fetchTokenMarketChart('ATLAS', 'usd', 365)
      
      // Build a map of day timestamp -> price
      const priceMap = new Map<number, number>()
      
      priceData.prices.forEach(([timestamp, price]) => {
        // Convert timestamp (milliseconds) to day timestamp (seconds, midnight)
        const date = new Date(timestamp)
        const dayTimestamp = Math.floor(
          new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000
        )
        // Use the last price of the day (or overwrite with later prices if multiple per day)
        priceMap.set(dayTimestamp, price)
      })
      
      atlasPriceHistory.value = priceMap
      console.log(`Loaded ${priceMap.size} days of ATLAS price history`)
    } catch (err) {
      console.error('Error loading ATLAS price history:', err)
      atlasPriceHistory.value = new Map()
    } finally {
      atlasPriceHistoryLoading.value = false
    }
  }

  /**
   * Initialize asset lookup data
   * Loads starbase cargos (required) and optionally NFTs
   * NFTs are needed for ship and other NFT name resolution
   */
  async function initializeAssets(shouldLoadNFTs: boolean = true) {
    // Load all in parallel for better performance
    const promises = [
      loadStarbaseCargos(),
      loadAtlasPrice(), // Load current ATLAS price
      loadAtlasPriceHistory() // Load historical ATLAS prices for accurate conversions
    ]
    if (shouldLoadNFTs) {
      promises.push(loadNFTs())
    }
    await Promise.all(promises)
    console.log('Asset lookup data initialized', {
      starbaseCargos: starbaseCargos.value.length,
      nfts: nfts.value.length,
      atlasPriceUSD: atlasPriceUSD.value,
      atlasPriceHistoryDays: atlasPriceHistory.value.size
    })
  }

  return {
    exchanges,
    loading,
    error,
    lastFetchedWallet,
    totalCount,
    totalVolume,
    totalBuyVolume,
    totalSellVolume,
    totalFees,
    profits,
    totalVolumeUSD,
    totalBuyVolumeUSD,
    totalSellVolumeUSD,
    totalFeesUSD,
    profitsUSD,
    uniqueAssets,
    atlasPriceUSD,
    assetName,
    starbaseCargos,
    nfts,
    assetsLoading,
    fetchExchanges,
    clearExchanges,
    loadStarbaseCargos,
    loadNFTs,
    initializeAssets
  }
})

