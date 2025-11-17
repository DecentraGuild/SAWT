import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchDACBWrapperData, fetchDAOBWrapperData, type TokenMint, type TokenBurn, type TokenTransfer } from '../services/tokenWrapperService'
import { DAC_BLOONS_MINT, DAO_BLOONS_MINT, POLIS_MINT, ATLAS_MINT } from '../queries/tokenWrapper'

// Re-export for convenience
export { DAC_BLOONS_MINT, DAO_BLOONS_MINT, POLIS_MINT, ATLAS_MINT }

// Constants
const TOKEN_DECIMALS = 8
const DECIMAL_DIVISOR = Math.pow(10, TOKEN_DECIMALS)

// Guild wallet addresses to exclude from DACB leaderboard
// TODO: Update this list with actual guild wallet addresses
const GUILD_WALLETS = new Set<string>([
  // Add guild wallet addresses here (lowercase for case-insensitive matching)
])

export interface WalletStats {
  wallet: string
  currentHoldings: number
  costBasis: number // Amount of POLIS/ATLAS paid
  currentValue: number // Current value of holdings (using wrap ratio)
  return: number // Return percentage
  returnAmount: number // Absolute return amount
  transferCount?: number // Number of transfers (for DACB)
}

export interface TransferStats {
  wallet: string
  totalTransferred: number
  transferCount: number
}

export interface WrapRatio {
  inputToken: string
  outputToken: string
  ratio: number // input amount per 1 output token
  timestamp: string
  signature?: string
}

export const useTokenWrapperStore = defineStore('tokenWrapper', () => {
  // DACB data
  const dacbMints = ref<TokenMint[]>([])
  const dacbBurns = ref<TokenBurn[]>([])
  const dacbTransfers = ref<TokenTransfer[]>([])
  const dacbAtlasTransfers = ref<TokenTransfer[]>([])
  
  // DAOB data
  const daobMints = ref<TokenMint[]>([])
  const daobBurns = ref<TokenBurn[]>([])
  const daobTransfers = ref<TokenTransfer[]>([])
  const daobPolisTransfers = ref<TokenTransfer[]>([])
  
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Date range from wallet store (for filtering transactions)
  const endDate = ref<string>('')

  // Calculate wrap ratios - returns array of all ratios
  const daobWrapRatios = computed(() => {
    return calculateAllWrapRatios(daobMints.value, daobPolisTransfers.value, POLIS_MINT, DAO_BLOONS_MINT)
  })

  const dacbWrapRatios = computed(() => {
    return calculateAllWrapRatios(dacbMints.value, dacbAtlasTransfers.value, ATLAS_MINT, DAC_BLOONS_MINT)
  })

  // Latest wrap ratios for display
  const daobWrapRatio = computed(() => {
    const ratios = daobWrapRatios.value
    return ratios.length > 0 ? ratios[ratios.length - 1] : null
  })

  const dacbWrapRatio = computed(() => {
    const ratios = dacbWrapRatios.value
    return ratios.length > 0 ? ratios[ratios.length - 1] : null
  })

  // Calculate stats for DACBloons - transfers-only leaderboard (excluding guild wallets)
  const dacBloonsStats = computed(() => {
    return calculateDACBTransferStats(dacbTransfers.value)
  })

  // Calculate stats for DAOBloons - use wrap ratios for cost basis
  const daobloonsStats = computed(() => {
    return calculateDAOBStats(
      daobMints.value,
      daobBurns.value,
      daobTransfers.value,
      daobPolisTransfers.value,
      daobWrapRatios.value
    )
  })

  // Calculate all wrap ratios from all mints (not just latest)
  function calculateAllWrapRatios(
    outputMints: TokenMint[],
    inputTransfers: TokenTransfer[],
    inputMint: string,
    outputMint: string
  ): WrapRatio[] {
    if (inputTransfers.length === 0 || outputMints.length === 0) {
      return []
    }

    // Create a map of mints by signature for fast lookup
    const mintsBySignature = new Map<string, TokenMint>()
    const mintsByKey = new Map<string, TokenMint[]>()
    
    outputMints.forEach(mint => {
      if (mint.signature) {
        mintsBySignature.set(mint.signature, mint)
      }
      // Also index by instruction+instructionIdx+timestamp for fallback
      const key = `${mint.instruction || mint.byInstruction}_${mint.instructionIdx || ''}_${mint.timestamp}`
      if (!mintsByKey.has(key)) {
        mintsByKey.set(key, [])
      }
      mintsByKey.get(key)!.push(mint)
    })
    
    // Find all matching wrap transactions
    const wrapTransactions: Array<{ transfer: TokenTransfer; mint: TokenMint; timestamp: number }> = []
    
    for (const transfer of inputTransfers) {
      let matchingMint: TokenMint | undefined
      
      // Try signature match first (fastest)
      if (transfer.signature) {
        matchingMint = mintsBySignature.get(transfer.signature)
      }
      
      // Fallback to instruction+instructionIdx+timestamp match
      if (!matchingMint) {
        const key = `${transfer.instruction || transfer.byInstruction}_${transfer.instructionIdx || ''}_${transfer.timestamp}`
        const matchingMints = mintsByKey.get(key)
        if (matchingMints && matchingMints.length > 0) {
          matchingMint = matchingMints.find(m => 
            (m.instruction || m.byInstruction) === (transfer.instruction || transfer.byInstruction) &&
            (m.instructionIdx || 0) === (transfer.instructionIdx || 0) &&
            m.timestamp === transfer.timestamp
          )
        }
      }
      
      if (matchingMint) {
        const txTimestamp = new Date(transfer.timestamp).getTime()
        wrapTransactions.push({ transfer, mint: matchingMint, timestamp: txTimestamp })
      }
    }
    
    // Sort by timestamp and calculate ratios
    wrapTransactions.sort((a, b) => a.timestamp - b.timestamp)
    
    const ratios: WrapRatio[] = []
    
    for (const { transfer, mint } of wrapTransactions) {
      const inputAmount = parseFloat(transfer.amountRaw || '0') / DECIMAL_DIVISOR
      const outputAmount = parseFloat(mint.amountRaw || '0') / DECIMAL_DIVISOR
      
      if (outputAmount === 0) {
        continue
      }
      
      const ratio = inputAmount / outputAmount
      
      const wrapRatio: WrapRatio = {
        inputToken: inputMint === POLIS_MINT ? 'POLIS' : 'ATLAS',
        outputToken: outputMint === DAO_BLOONS_MINT ? 'DAOB' : 'DACB',
        ratio,
        timestamp: transfer.timestamp
      }
      
      if (transfer.signature) {
        wrapRatio.signature = transfer.signature
      }
      
      ratios.push(wrapRatio)
    }
    
    return ratios
  }

  // Calculate DACB transfer-based leaderboard (excluding guild wallets)
  function calculateDACBTransferStats(tokenTransfers: TokenTransfer[]) {
    // Parse endDate for filtering
    const endDateTimestamp = endDate.value && endDate.value.trim() 
      ? new Date(endDate.value.trim()).getTime() 
      : null
    
    // Filter transfers by date range
    const filteredTransfers = tokenTransfers.filter(t => {
      if (endDateTimestamp && t.timestamp) {
        const txDate = new Date(t.timestamp).getTime()
        return txDate <= endDateTimestamp
      }
      return true
    })

    // Calculate per-wallet transfer stats
    const walletTransferMap = new Map<string, { totalTransferred: number; transferCount: number }>()

    filteredTransfers.forEach(transfer => {
      const amount = parseFloat(transfer.amountRaw || '0') / DECIMAL_DIVISOR
      
      // Track transfers TO wallets (receiving DACB)
      const toOwner = transfer.solanaAccountByToAccount?.owner || transfer.toAccount
      if (toOwner && !GUILD_WALLETS.has(toOwner.toLowerCase())) {
        const existing = walletTransferMap.get(toOwner) || { totalTransferred: 0, transferCount: 0 }
        walletTransferMap.set(toOwner, {
          totalTransferred: existing.totalTransferred + amount,
          transferCount: existing.transferCount + 1
        })
      }
    })

    // Convert to array and sort by total transferred
    const transferStats: TransferStats[] = Array.from(walletTransferMap.entries())
      .map(([wallet, stats]) => ({
        wallet,
        totalTransferred: stats.totalTransferred,
        transferCount: stats.transferCount
      }))
      .sort((a, b) => b.totalTransferred - a.totalTransferred)

    // Calculate total holdings (sum of all transfers)
    const totalHoldings = transferStats.reduce((sum, stat) => sum + stat.totalTransferred, 0)

    return {
      totalHoldings,
      walletStats: transferStats.map((stat) => ({
        wallet: stat.wallet,
        currentHoldings: stat.totalTransferred,
        costBasis: 0, // Not calculated for DACB
        currentValue: 0, // Not calculated for DACB
        return: 0, // Not calculated for DACB
        returnAmount: 0, // Not calculated for DACB
        transferCount: stat.transferCount
      }))
    }
  }

  // Calculate DAOB stats using wrap ratios for accurate cost basis
  function calculateDAOBStats(
    tokenMints: TokenMint[],
    tokenBurns: TokenBurn[],
    tokenTransfers: TokenTransfer[],
    _inputTokenTransfers: TokenTransfer[],
    wrapRatios: WrapRatio[]
  ) {
    // Parse endDate for filtering
    const endDateTimestamp = endDate.value && endDate.value.trim() 
      ? new Date(endDate.value.trim()).getTime() 
      : null
    
    // Filter transactions by date range
    const filteredMints = tokenMints.filter(m => {
      if (endDateTimestamp && m.timestamp) {
        const txDate = new Date(m.timestamp).getTime()
        return txDate <= endDateTimestamp
      }
      return true
    })
    
    const filteredBurns = tokenBurns.filter(b => {
      if (endDateTimestamp && b.timestamp) {
        const txDate = new Date(b.timestamp).getTime()
        return txDate <= endDateTimestamp
      }
      return true
    })
    
    const filteredTransfers = tokenTransfers.filter(t => {
      if (endDateTimestamp && t.timestamp) {
        const txDate = new Date(t.timestamp).getTime()
        return txDate <= endDateTimestamp
      }
      return true
    })

    // Calculate per-wallet holdings and cost basis
    const walletHoldingsMap = new Map<string, number>()
    const walletCostBasisMap = new Map<string, number>() // Track POLIS paid

    // Process mints - calculate cost basis using wrap ratio at time of mint
    filteredMints.forEach(mint => {
      const owner = mint.solanaAccountByAccount?.owner
      if (owner) {
        const mintAmount = parseFloat(mint.amountRaw || '0') / DECIMAL_DIVISOR
        const existing = walletHoldingsMap.get(owner) || 0
        walletHoldingsMap.set(owner, existing + mintAmount)
        
        // Find the wrap ratio that was active at the time of this mint
        const mintTimestamp = new Date(mint.timestamp).getTime()
        // Find the most recent ratio before or at the mint time
        let activeRatio: WrapRatio | null = null
        for (const ratio of wrapRatios) {
          const ratioTimestamp = new Date(ratio.timestamp).getTime()
          if (ratioTimestamp <= mintTimestamp) {
            if (!activeRatio || ratioTimestamp > new Date(activeRatio.timestamp).getTime()) {
              activeRatio = ratio
            }
          }
        }
        
        // If we found a ratio, calculate cost basis (POLIS paid = DAOB minted * ratio)
        if (activeRatio && activeRatio.ratio > 0) {
          const polisPaid = mintAmount * activeRatio.ratio
          const existingCost = walletCostBasisMap.get(owner) || 0
          walletCostBasisMap.set(owner, existingCost + polisPaid)
        }
      }
    })

    // Process transfers
    filteredTransfers.forEach(transfer => {
      const amount = parseFloat(transfer.amountRaw || '0') / DECIMAL_DIVISOR
      
      // Add to recipient (transfer in)
      const toOwner = transfer.solanaAccountByToAccount?.owner || transfer.toAccount
      if (toOwner) {
        const existing = walletHoldingsMap.get(toOwner) || 0
        walletHoldingsMap.set(toOwner, existing + amount)
      }
      
      // Subtract from sender (transfer out)
      const fromOwner = transfer.solanaAccountByFromAccount?.owner || transfer.fromAccount
      if (fromOwner) {
        const existing = walletHoldingsMap.get(fromOwner) || 0
        walletHoldingsMap.set(fromOwner, existing - amount)
      }
    })

    // Process burns
    filteredBurns.forEach(burn => {
      const owner = burn.solanaAccountByAccount?.owner
      if (owner) {
        const amount = parseFloat(burn.amountRaw || '0') / DECIMAL_DIVISOR
        const existing = walletHoldingsMap.get(owner) || 0
        walletHoldingsMap.set(owner, existing - amount)
      }
    })

    // Get latest wrap ratio for current value calculation
    const latestWrapRatio = wrapRatios.length > 0 ? wrapRatios[wrapRatios.length - 1] : null

    // Convert to array and calculate returns
    const walletStats: WalletStats[] = Array.from(walletHoldingsMap.entries())
      .map(([wallet, holdings]) => {
        const costBasis = walletCostBasisMap.get(wallet) || 0
        
        // Calculate current value using latest wrap ratio
        let currentValue = 0
        if (latestWrapRatio && latestWrapRatio.ratio > 0) {
          // Current value = holdings * latest wrap ratio (how much POLIS the holdings are worth)
          currentValue = holdings * latestWrapRatio.ratio
        }
        
        // Calculate return
        const returnAmount = currentValue - costBasis
        const returnPercent = costBasis > 0 ? (returnAmount / costBasis) * 100 : 0
        
        return {
          wallet,
          currentHoldings: holdings,
          costBasis,
          currentValue,
          return: returnPercent,
          returnAmount
        }
      })
      .filter(stat => stat.currentHoldings > 0) // Only show wallets with positive holdings

    // Sort by holdings descending
    walletStats.sort((a, b) => b.currentHoldings - a.currentHoldings)

    // Calculate total holdings
    const totalHoldings = walletStats.reduce((sum, stat) => sum + stat.currentHoldings, 0)

    return {
      totalHoldings,
      walletStats
    }
  }

  function setDateRange(end: string) {
    endDate.value = end
  }

  async function fetchData() {
    loading.value = true
    error.value = null

    try {
      // Fetch DACB and DAOB data in parallel for better performance
      const [dacbResponse, daobResponse] = await Promise.all([
        fetchDACBWrapperData(),
        fetchDAOBWrapperData()
      ])
      
      // Process DACB data
      dacbMints.value = dacbResponse.allSolanaTokenMints.nodes
      dacbBurns.value = dacbResponse.allSolanaTokenBurns.nodes
      dacbTransfers.value = dacbResponse.allSolanaTokenTransfers.nodes
      dacbAtlasTransfers.value = dacbResponse.atlasTransfers?.nodes || []
      
      // Process DAOB data
      daobMints.value = daobResponse.allSolanaTokenMints.nodes
      daobBurns.value = daobResponse.allSolanaTokenBurns.nodes
      daobTransfers.value = daobResponse.allSolanaTokenTransfers.nodes
      daobPolisTransfers.value = daobResponse.polisTransfers?.nodes || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch token wrapper data'
      // Reset all data on error
      dacbMints.value = []
      dacbBurns.value = []
      dacbTransfers.value = []
      dacbAtlasTransfers.value = []
      daobMints.value = []
      daobBurns.value = []
      daobTransfers.value = []
      daobPolisTransfers.value = []
    } finally {
      loading.value = false
    }
  }

  // Get all transactions (combined for display)
  const allMints = computed(() => [...dacbMints.value, ...daobMints.value])
  const allBurns = computed(() => [...dacbBurns.value, ...daobBurns.value])
  const allTransfers = computed(() => [...dacbTransfers.value, ...daobTransfers.value])

  return {
    // Individual token data
    dacbMints,
    dacbBurns,
    dacbTransfers,
    daobMints,
    daobBurns,
    daobTransfers,
    // Combined for display
    allMints,
    allBurns,
    allTransfers,
    loading,
    error,
    dacBloonsStats,
    daobloonsStats,
    // Wrap ratios (latest for display)
    daobWrapRatio,
    dacbWrapRatio,
    // All wrap ratios (for wallet API calculations)
    daobWrapRatios,
    dacbWrapRatios,
    endDate,
    fetchData,
    setDateRange
  }
})

