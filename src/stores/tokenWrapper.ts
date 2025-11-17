import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchDACBWrapperData, fetchDAOBWrapperData, fetchWrapperData, fetchDACBMultisigData, type TokenMint, type TokenBurn, type TokenTransfer, type WrapperMint, type WrapperTransfer } from '../services/tokenWrapperService'
import { DAC_BLOONS_MINT, DAO_BLOONS_MINT, POLIS_MINT, ATLAS_MINT } from '../queries/tokenWrapper'
import { DECIMAL_DIVISOR } from '../utils/constants'
import { filterByEndDate } from '../utils/dateFilters'

// Re-export for convenience
export { DAC_BLOONS_MINT, DAO_BLOONS_MINT, POLIS_MINT, ATLAS_MINT }

// Guild wallet addresses to exclude from DACB and DAOB leaderboards
// Note: Addresses are stored as-is for readability, but comparison is case-insensitive
// Map structure: [walletAddress, displayName]
const GUILD_WALLETS_MAP = new Map<string, string>([
  ['HmAwHhCw3aPEYmx2dgfoQUWJ2y1LFqTdyMQPYebo9TeE', 'Dockyard'],
  ['756pfnvP3HHRx1BPwBPQwe1xBMfMWef5N9oN61Ews7np', 'Guild Wallet'],
  ['UHXr4VPBEejmKNfkTH9k4Z33GJPXGWgXWv14S8LHKKM', 'DAOB Wallet'],
  ['4vXSxn9QFUDYKKy9EcDn6B57e8ajM9dqpYoL7z4gNRqq', 'DACB Wallet'],
  ['GMtvP4jfaVXXAY1mAm1vTiXMWexqmbVmWKB55xFtWqTw', 'CUT Wallet'],
  ['DHUn3QfqvKZAHfsEMxmHiYxNheYaU4NKKyZXcdGQ5EgD', 'S&B Treasury']
])

// Helper function to check if a wallet is a guild wallet (case-insensitive)
function isGuildWallet(wallet: string | null | undefined): boolean {
  if (!wallet) return false
  const normalizedWallet = wallet.trim().toLowerCase()
  // Check against all wallets in the map (convert each to lowercase for comparison)
  return Array.from(GUILD_WALLETS_MAP.keys()).some(guildWallet => 
    guildWallet.toLowerCase() === normalizedWallet
  )
}

// Helper function to get the display name for a guild wallet (case-insensitive)
function getGuildWalletName(wallet: string | null | undefined): string | null {
  if (!wallet) return null
  const normalizedWallet = wallet.trim().toLowerCase()
  for (const [guildWallet, name] of GUILD_WALLETS_MAP.entries()) {
    if (guildWallet.toLowerCase() === normalizedWallet) {
      return name
    }
  }
  return null
}

// Token mint addresses to display names mapping
// Map structure: [tokenMintAddress, displayName]
const TOKEN_NAMES_MAP = new Map<string, string>([
  [DAC_BLOONS_MINT, 'DACB'],
  [DAO_BLOONS_MINT, 'DAOB'],
  [POLIS_MINT, 'POLIS'],
  [ATLAS_MINT, 'ATLAS'],
  ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC'] // USDC mint address
])

// Helper function to get the display name for a token (case-insensitive)
function getTokenName(tokenMint: string | null | undefined): string | null {
  if (!tokenMint) return null
  const normalizedMint = tokenMint.trim().toLowerCase()
  for (const [mint, name] of TOKEN_NAMES_MAP.entries()) {
    if (mint.toLowerCase() === normalizedMint) {
      return name
    }
  }
  return null
}

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
  
  // DAOB data
  const daobMints = ref<TokenMint[]>([])
  const daobBurns = ref<TokenBurn[]>([])
  const daobTransfers = ref<TokenTransfer[]>([])
  
  // Wrapper deposits (POLIS and ATLAS deposits by wrapper program)
  const wrapperMints = ref<WrapperMint[]>([])
  const wrapperTransfers = ref<WrapperTransfer[]>([])
  
  // DACB multisig deposits (ATLAS deposits by multisig program for DACB mints)
  const dacbMultisigTransfers = ref<WrapperTransfer[]>([])
  
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Date range from wallet store (for filtering transactions)
  const endDate = ref<string>('')

  // Calculate wrap ratios - returns array of all ratios
  // For DAOB: use wrapper POLIS deposits mapped by signature
  // For DACB: use fixed ratio (1 DACB = 100 ATLAS) or wrapper ATLAS deposits
  // Memoized: Only recalculate when source data changes
  const daobWrapRatios = computed(() => {
    // Early return if no data
    if (daobMints.value.length === 0 || wrapperTransfers.value.length === 0) {
      return []
    }
    return calculateDAOBWrapRatios(daobMints.value, wrapperTransfers.value)
  })

  const dacbWrapRatios = computed(() => {
    // Early return if no data
    if (dacbMints.value.length === 0 || wrapperTransfers.value.length === 0) {
      return []
    }
    // DACB ratio is fixed: 1 DACB = 100 ATLAS
    // But we can still calculate ratios from wrapper deposits for historical tracking
    return calculateDACBWrapRatios(dacbMints.value, wrapperTransfers.value)
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
  // Memoized: Only recalculate when transfers or date range changes
  const dacBloonsStats = computed(() => {
    if (dacbTransfers.value.length === 0) {
      return { totalHoldings: 0, walletStats: [] }
    }
    return calculateDACBTransferStats(dacbTransfers.value)
  })

  // Calculate stats for DAOBloons - use wrap ratios for cost basis
  // Memoized: Only recalculate when source data or date range changes
  const daobloonsStats = computed(() => {
    if (daobMints.value.length === 0 && daobBurns.value.length === 0 && daobTransfers.value.length === 0) {
      return { totalHoldings: 0, walletStats: [] }
    }
    return calculateDAOBStats(
      daobMints.value,
      daobBurns.value,
      daobTransfers.value,
      daobWrapRatios.value
    )
  })

  // Calculate DAOB wrap ratios using wrapper POLIS deposits mapped by signature
  function calculateDAOBWrapRatios(
    daobMints: TokenMint[],
    wrapperTransfers: WrapperTransfer[]
  ): WrapRatio[] {
    if (daobMints.length === 0 || wrapperTransfers.length === 0) {
      return []
    }

    // Filter wrapper transfers to get POLIS deposits
    const polisDeposits = wrapperTransfers.filter(
      transfer => transfer.mint.toLowerCase() === POLIS_MINT.toLowerCase()
    )

    if (polisDeposits.length === 0) {
      return []
    }

    // Create a map of DAOB mints by signature for fast lookup
    const mintsBySignature = new Map<string, TokenMint>()
    daobMints.forEach(mint => {
      if (mint.signature) {
        mintsBySignature.set(mint.signature, mint)
      }
    })

    // Find all matching wrap transactions by signature
    const wrapTransactions: Array<{ deposit: WrapperTransfer; mint: TokenMint; timestamp: number }> = []

    for (const deposit of polisDeposits) {
      if (!deposit.signature) continue

      const matchingMint = mintsBySignature.get(deposit.signature)
      if (matchingMint) {
        const txTimestamp = new Date(deposit.timestamp).getTime()
        wrapTransactions.push({ deposit, mint: matchingMint, timestamp: txTimestamp })
      }
    }

    // Sort by timestamp and calculate ratios
    wrapTransactions.sort((a, b) => a.timestamp - b.timestamp)

    const ratios: WrapRatio[] = []

    for (const { deposit, mint } of wrapTransactions) {
      const inputAmount = parseFloat(deposit.amountRaw || '0') / DECIMAL_DIVISOR
      const outputAmount = parseFloat(mint.amountRaw || '0') / DECIMAL_DIVISOR

      if (outputAmount === 0) {
        continue
      }

      const ratio = inputAmount / outputAmount

      const wrapRatio: WrapRatio = {
        inputToken: 'POLIS',
        outputToken: 'DAOB',
        ratio,
        timestamp: deposit.timestamp
      }

      if (deposit.signature) {
        wrapRatio.signature = deposit.signature
      }

      ratios.push(wrapRatio)
    }

    return ratios
  }

  // Calculate DACB wrap ratios using wrapper ATLAS deposits mapped by signature
  // Note: DACB ratio is fixed at 1 DACB = 100 ATLAS, but we calculate from deposits for historical tracking
  function calculateDACBWrapRatios(
    dacbMints: TokenMint[],
    wrapperTransfers: WrapperTransfer[]
  ): WrapRatio[] {
    if (dacbMints.length === 0 || wrapperTransfers.length === 0) {
      return []
    }

    // Filter wrapper transfers to get ATLAS deposits
    const atlasDeposits = wrapperTransfers.filter(
      transfer => transfer.mint.toLowerCase() === ATLAS_MINT.toLowerCase()
    )

    if (atlasDeposits.length === 0) {
      return []
    }

    // Create a map of DACB mints by signature for fast lookup
    const mintsBySignature = new Map<string, TokenMint>()
    dacbMints.forEach(mint => {
      if (mint.signature) {
        mintsBySignature.set(mint.signature, mint)
      }
    })

    // Find all matching wrap transactions by signature
    const wrapTransactions: Array<{ deposit: WrapperTransfer; mint: TokenMint; timestamp: number }> = []

    for (const deposit of atlasDeposits) {
      if (!deposit.signature) continue

      const matchingMint = mintsBySignature.get(deposit.signature)
      if (matchingMint) {
        const txTimestamp = new Date(deposit.timestamp).getTime()
        wrapTransactions.push({ deposit, mint: matchingMint, timestamp: txTimestamp })
      }
    }

    // Sort by timestamp and calculate ratios
    wrapTransactions.sort((a, b) => a.timestamp - b.timestamp)

    const ratios: WrapRatio[] = []

    for (const { deposit, mint } of wrapTransactions) {
      const inputAmount = parseFloat(deposit.amountRaw || '0') / DECIMAL_DIVISOR
      const outputAmount = parseFloat(mint.amountRaw || '0') / DECIMAL_DIVISOR

      if (outputAmount === 0) {
        continue
      }

      // Calculate ratio (should be around 100 for DACB, but we calculate from actual data)
      const ratio = inputAmount / outputAmount

      const wrapRatio: WrapRatio = {
        inputToken: 'ATLAS',
        outputToken: 'DACB',
        ratio,
        timestamp: deposit.timestamp
      }

      if (deposit.signature) {
        wrapRatio.signature = deposit.signature
      }

      ratios.push(wrapRatio)
    }

    return ratios
  }

  // Calculate DACB transfer-based leaderboard (excluding guild wallets)
  function calculateDACBTransferStats(tokenTransfers: TokenTransfer[]) {
    // Filter transfers by date range
    const filteredTransfers = filterByEndDate(tokenTransfers, endDate.value)

    // Calculate per-wallet transfer stats
    const walletTransferMap = new Map<string, { totalTransferred: number; transferCount: number }>()

    filteredTransfers.forEach(transfer => {
      const amount = parseFloat(transfer.amountRaw || '0') / DECIMAL_DIVISOR
      
      // Track transfers TO wallets (receiving DACB) - exclude guild wallets
      const toOwner = transfer.solanaAccountByToAccount?.owner || transfer.toAccount
      if (toOwner && !isGuildWallet(toOwner)) {
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

    // Filter out guild wallets before calculating totals and creating stats
    const filteredStats = transferStats.filter((stat) => !isGuildWallet(stat.wallet))

    // Calculate total holdings (sum of all transfers, excluding guild wallets)
    const totalHoldings = filteredStats.reduce((sum, stat) => sum + stat.totalTransferred, 0)

    return {
      totalHoldings,
      walletStats: filteredStats.map((stat) => ({
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

  // Calculate DAOB stats using wrapper deposits mapped by signature for accurate cost basis
  function calculateDAOBStats(
    tokenMints: TokenMint[],
    tokenBurns: TokenBurn[],
    tokenTransfers: TokenTransfer[],
    wrapRatios: WrapRatio[]
  ) {
    // Create a map of POLIS deposits by signature from wrapper transfers
    const polisDepositsBySignature = new Map<string, WrapperTransfer>()
    const polisDeposits = wrapperTransfers.value.filter(
      transfer => transfer.mint.toLowerCase() === POLIS_MINT.toLowerCase()
    )
    polisDeposits.forEach(deposit => {
      if (deposit.signature) {
        polisDepositsBySignature.set(deposit.signature, deposit)
      }
    })
    // Filter transactions by date range
    const filteredMints = filterByEndDate(tokenMints, endDate.value)
    const filteredBurns = filterByEndDate(tokenBurns, endDate.value)
    const filteredTransfers = filterByEndDate(tokenTransfers, endDate.value)

    // Calculate per-wallet holdings and cost basis
    const walletHoldingsMap = new Map<string, number>()
    const walletCostBasisMap = new Map<string, number>() // Track POLIS paid

    // Process mints - calculate cost basis using wrapper POLIS deposits mapped by signature
    filteredMints.forEach(mint => {
      const owner = mint.solanaAccountByAccount?.owner
      if (owner && !isGuildWallet(owner)) {
        const mintAmount = parseFloat(mint.amountRaw || '0') / DECIMAL_DIVISOR
        const existing = walletHoldingsMap.get(owner) || 0
        walletHoldingsMap.set(owner, existing + mintAmount)
        
        // Try to find the actual POLIS deposit for this mint by signature
        let polisPaid = 0
        if (mint.signature) {
          const polisDeposit = polisDepositsBySignature.get(mint.signature)
          if (polisDeposit) {
            // Use the actual POLIS deposit amount
            polisPaid = parseFloat(polisDeposit.amountRaw || '0') / DECIMAL_DIVISOR
          }
        }
        
        // Fallback to wrap ratio if we couldn't find the deposit by signature
        if (polisPaid === 0) {
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
            polisPaid = mintAmount * activeRatio.ratio
          }
        }
        
        if (polisPaid > 0) {
          const existingCost = walletCostBasisMap.get(owner) || 0
          walletCostBasisMap.set(owner, existingCost + polisPaid)
        }
      }
    })

    // Process transfers
    filteredTransfers.forEach(transfer => {
      const amount = parseFloat(transfer.amountRaw || '0') / DECIMAL_DIVISOR
      
      // Add to recipient (transfer in) - exclude guild wallets
      const toOwner = transfer.solanaAccountByToAccount?.owner || transfer.toAccount
      if (toOwner && !isGuildWallet(toOwner)) {
        const existing = walletHoldingsMap.get(toOwner) || 0
        walletHoldingsMap.set(toOwner, existing + amount)
      }
      
      // Subtract from sender (transfer out) - exclude guild wallets
      const fromOwner = transfer.solanaAccountByFromAccount?.owner || transfer.fromAccount
      if (fromOwner && !isGuildWallet(fromOwner)) {
        const existing = walletHoldingsMap.get(fromOwner) || 0
        walletHoldingsMap.set(fromOwner, existing - amount)
      }
    })

    // Process burns - exclude guild wallets
    filteredBurns.forEach(burn => {
      const owner = burn.solanaAccountByAccount?.owner
      if (owner && !isGuildWallet(owner)) {
        const amount = parseFloat(burn.amountRaw || '0') / DECIMAL_DIVISOR
        const existing = walletHoldingsMap.get(owner) || 0
        walletHoldingsMap.set(owner, existing - amount)
      }
    })

    // Get latest wrap ratio for current value calculation
    const latestWrapRatio = wrapRatios.length > 0 ? wrapRatios[wrapRatios.length - 1] : null

    // Convert to array and calculate returns - filter out guild wallets
    const walletStats: WalletStats[] = Array.from(walletHoldingsMap.entries())
      .filter(([wallet]) => !isGuildWallet(wallet))
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
    console.log('[SB Fetch] ========================================')
    console.log('[SB Fetch] Starting SB data fetch...')
    console.time('[SB Fetch] Total fetch time')
    
    loading.value = true
    error.value = null

    try {
      // Fetch all queries in parallel - this is faster than batching
      // The server can handle parallel requests, and this reduces total wait time
      console.log('[SB Fetch] Fetching all queries in parallel...')
      console.time('[SB Fetch] All queries parallel')
      
      const [dacbResponse, daobResponse, wrapperResponse, dacbMultisigResponse] = await Promise.all([
        fetchDACBWrapperData(),
        fetchDAOBWrapperData(),
        fetchWrapperData(),
        fetchDACBMultisigData()
      ])
      
      console.timeEnd('[SB Fetch] All queries parallel')
      
      // Process all data after all queries complete
      console.log('[SB Fetch] Processing all data...')
      console.time('[SB Fetch] Process all data')
      
      // Process DACB data
      dacbMints.value = dacbResponse.allSolanaTokenMints.nodes
      dacbBurns.value = dacbResponse.allSolanaTokenBurns.nodes
      dacbTransfers.value = dacbResponse.allSolanaTokenTransfers.nodes
      
      // Process DAOB data
      daobMints.value = daobResponse.allSolanaTokenMints.nodes
      daobBurns.value = daobResponse.allSolanaTokenBurns.nodes
      daobTransfers.value = daobResponse.allSolanaTokenTransfers.nodes
      
      // Process wrapper data (POLIS and ATLAS deposits)
      wrapperMints.value = wrapperResponse.allSolanaTokenMints.nodes
      wrapperTransfers.value = wrapperResponse.allSolanaTokenTransfers.nodes
      
      // Process DACB multisig data (ATLAS deposits for DACB mints)
      dacbMultisigTransfers.value = dacbMultisigResponse.allSolanaTokenTransfers.nodes
      
      console.timeEnd('[SB Fetch] Process all data')
      
      console.timeEnd('[SB Fetch] Total fetch time')
      console.log('[SB Fetch] ========================================')
      console.log('[SB Fetch] Fetch completed successfully!')
    } catch (err) {
      console.error('[SB Fetch] Error occurred:', err)
      console.timeEnd('[SB Fetch] Total fetch time')
      error.value = err instanceof Error ? err.message : 'Failed to fetch token wrapper data'
      // Reset all data on error
      dacbMints.value = []
      dacbBurns.value = []
      dacbTransfers.value = []
      daobMints.value = []
      daobBurns.value = []
      daobTransfers.value = []
      wrapperMints.value = []
      wrapperTransfers.value = []
      dacbMultisigTransfers.value = []
    } finally {
      loading.value = false
    }
  }

  // Get all transactions (combined for display)
  const allMints = computed(() => [...dacbMints.value, ...daobMints.value])
  const allBurns = computed(() => [...dacbBurns.value, ...daobBurns.value])
  const allTransfers = computed(() => [...dacbTransfers.value, ...daobTransfers.value])

  // Combined all transactions sorted by timestamp desc, grouped by signature
  const allTransactions = computed(() => {
    console.log('[SB Fetch] Computing allTransactions...')
    console.time('[SB Fetch] allTransactions computation')
    
    // Create maps for fast lookup by signature
    const mintsBySignature = new Map<string, TokenMint>()
    const burnsBySignature = new Map<string, TokenBurn>()
    const transfersBySignature = new Map<string, TokenTransfer>()
    const depositsBySignature = new Map<string, WrapperTransfer>()

    // Index mints by signature - batch process for efficiency
    for (const mint of allMints.value) {
      if (mint.signature) {
        mintsBySignature.set(mint.signature.toLowerCase(), mint)
      }
    }

    // Index burns by signature (burns have signature in query results, even if not in type)
    for (const burn of allBurns.value) {
      const sig = (burn as any).signature
      if (sig) {
        burnsBySignature.set(sig.toLowerCase(), burn)
      }
    }

    // Index transfers by signature
    for (const transfer of allTransfers.value) {
      if (transfer.signature) {
        transfersBySignature.set(transfer.signature.toLowerCase(), transfer)
      }
    }

    // Index wrapper transfers (deposits) by signature
    for (const deposit of wrapperTransfers.value) {
      if (deposit.signature) {
        depositsBySignature.set(deposit.signature.toLowerCase(), deposit)
      }
    }

    // Match DACB mints with multisig deposits by timestamp proximity and amount ratio (1 DACB = 100 ATLAS)
    // Optimized: Pre-process deposits and use sorted arrays for faster matching
    const matchedDacbMints = new Set<string>() // Track which mints have been matched
    const matchedDacbDeposits = new Set<string>() // Track which deposits have been matched
    
    // First, try to match by signature (if they happen to share one) - O(n)
    dacbMultisigTransfers.value.forEach(deposit => {
      if (deposit.signature) {
        const sig = deposit.signature.toLowerCase()
        const mint = mintsBySignature.get(sig)
        if (mint && mint.mint.toLowerCase() === DAC_BLOONS_MINT.toLowerCase()) {
          depositsBySignature.set(sig, deposit)
          matchedDacbMints.add(sig)
          matchedDacbDeposits.add(sig)
        }
      }
    })

    // Pre-process and sort DACB mints and multisig deposits for efficient matching
    const dacbMintsToMatch: Array<{ sig: string; timestamp: number; amount: number; expectedDeposit: number }> = []
    allMints.value.forEach(mint => {
      if (mint.mint.toLowerCase() !== DAC_BLOONS_MINT.toLowerCase()) return
      if (!mint.signature) return
      
      const sig = mint.signature.toLowerCase()
      if (matchedDacbMints.has(sig)) return // Already matched
      
      const mintAmount = parseFloat(mint.amountRaw || '0') / DECIMAL_DIVISOR
      dacbMintsToMatch.push({
        sig,
        timestamp: new Date(mint.timestamp).getTime(),
        amount: mintAmount,
        expectedDeposit: mintAmount * 100 // 1 DACB = 100 ATLAS
      })
    })

    // Pre-process multisig deposits - only if we have mints to match
    const depositsToMatch: Array<{ sig: string; timestamp: number; amount: number; deposit: WrapperTransfer }> = []
    if (dacbMintsToMatch.length > 0) {
      dacbMultisigTransfers.value.forEach(deposit => {
        const sig = deposit.signature?.toLowerCase() || ''
        if (matchedDacbDeposits.has(sig)) return // Already matched
        
        depositsToMatch.push({
          sig,
          timestamp: new Date(deposit.timestamp).getTime(),
          amount: parseFloat(deposit.amountRaw || '0') / DECIMAL_DIVISOR,
          deposit
        })
      })

      // Sort deposits by timestamp for efficient matching
      depositsToMatch.sort((a, b) => a.timestamp - b.timestamp)
    }

    // Match mints with deposits using sorted arrays - optimized with binary search
    // Only process if we have deposits to match
    if (depositsToMatch.length > 0 && dacbMintsToMatch.length > 0) {
      // Helper function for binary search
      const findFirstIndex = (arr: typeof depositsToMatch, target: number): number => {
        let left = 0
        let right = arr.length
        while (left < right) {
          const mid = Math.floor((left + right) / 2)
          if (arr[mid].timestamp < target) {
            left = mid + 1
          } else {
            right = mid
          }
        }
        return left
      }

      dacbMintsToMatch.forEach(mint => {
        const mintSig = mint.sig
        const timeWindow = 10000 // 10 seconds
        const minTime = mint.timestamp - timeWindow
        const maxTime = mint.timestamp + timeWindow
        
        // Use binary search to find time window bounds
        const startIdx = findFirstIndex(depositsToMatch, minTime)
        const endIdx = findFirstIndex(depositsToMatch, maxTime + 1) // +1 to include deposits at maxTime
        
        // Check deposits in time window
        for (let i = startIdx; i < endIdx && i < depositsToMatch.length; i++) {
          const deposit = depositsToMatch[i]
          if (matchedDacbDeposits.has(deposit.sig)) continue
          
          // Check amount ratio (within 5% tolerance)
          const ratio = deposit.amount / mint.expectedDeposit
          if (ratio >= 0.95 && ratio <= 1.05) {
            depositsBySignature.set(mintSig, deposit.deposit)
            matchedDacbMints.add(mintSig)
            matchedDacbDeposits.add(deposit.sig)
            break
          }
        }
      })
    }

    // Collect all unique signatures - use Set union for efficiency
    const allSignatures = new Set<string>([
      ...mintsBySignature.keys(),
      ...burnsBySignature.keys(),
      ...transfersBySignature.keys(),
      ...depositsBySignature.keys()
    ])

    // Build combined transactions
    const combinedTransactions: Array<{
      type: 'mint' | 'burn' | 'transfer' | 'mint-with-deposit' | 'burn-with-release'
      timestamp: string
      signature?: string
      mint?: TokenMint
      burn?: TokenBurn
      transfer?: TokenTransfer
      deposit?: WrapperTransfer
      release?: WrapperTransfer
    }> = []

    // Track processed signatures to avoid duplicates
    const processedSignatures = new Set<string>()

    // Process transactions with signatures (can be combined)
    allSignatures.forEach(sig => {
      const mint = mintsBySignature.get(sig)
      const burn = burnsBySignature.get(sig)
      const transfer = transfersBySignature.get(sig)
      const deposit = depositsBySignature.get(sig)

      // Mint with matching deposit (wrap transaction)
      if (mint && deposit) {
        combinedTransactions.push({
          type: 'mint-with-deposit',
          timestamp: mint.timestamp,
          signature: sig,
          mint,
          deposit
        })
        processedSignatures.add(sig)
        return
      }

      // Burn with matching release (unwrap transaction)
      if (burn && deposit) {
        combinedTransactions.push({
          type: 'burn-with-release',
          timestamp: burn.timestamp,
          signature: sig,
          burn,
          release: deposit
        })
        processedSignatures.add(sig)
        return
      }

      // Standalone transactions
      if (mint) {
        combinedTransactions.push({
          type: 'mint',
          timestamp: mint.timestamp,
          signature: sig,
          mint
        })
        processedSignatures.add(sig)
      } else if (burn) {
        combinedTransactions.push({
          type: 'burn',
          timestamp: burn.timestamp,
          signature: sig,
          burn
        })
        processedSignatures.add(sig)
      } else if (transfer) {
        combinedTransactions.push({
          type: 'transfer',
          timestamp: transfer.timestamp,
          signature: sig,
          transfer
        })
        processedSignatures.add(sig)
      } else if (deposit) {
        // Standalone deposit (shouldn't happen often, but handle it)
        combinedTransactions.push({
          type: 'transfer', // Treat as transfer for display
          timestamp: deposit.timestamp,
          signature: sig,
          transfer: undefined,
          deposit
        })
        processedSignatures.add(sig)
      }
    })

    // Add transactions without signatures (can't be grouped) - batch process for efficiency
    // Process mints without signatures
    for (const mint of allMints.value) {
      if (!mint.signature) {
        combinedTransactions.push({
          type: 'mint',
          timestamp: mint.timestamp,
          mint
        })
      }
    }

    // Add burns without signatures or that weren't matched
    for (const burn of allBurns.value) {
      const sig = (burn as any).signature
      if (!sig || !processedSignatures.has(sig.toLowerCase())) {
        combinedTransactions.push({
          type: 'burn',
          timestamp: burn.timestamp,
          burn
        })
      }
    }

    // Add transfers without signatures
    for (const transfer of allTransfers.value) {
      if (!transfer.signature) {
        combinedTransactions.push({
          type: 'transfer',
          timestamp: transfer.timestamp,
          transfer
        })
      }
    }

    // Add wrapper transfers (deposits) without signatures or that weren't matched
    for (const deposit of wrapperTransfers.value) {
      const sig = deposit.signature
      if (!sig || !processedSignatures.has(sig.toLowerCase())) {
        combinedTransactions.push({
          type: 'transfer',
          timestamp: deposit.timestamp,
          deposit
        })
      }
    }

    // Sort by timestamp desc
    const sorted = combinedTransactions.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      return timeB - timeA
    })
    
    console.timeEnd('[SB Fetch] allTransactions computation')
    console.log('[SB Fetch] allTransactions computed:', {
      totalTransactions: sorted.length,
      mints: mintsBySignature.size,
      burns: burnsBySignature.size,
      transfers: transfersBySignature.size,
      deposits: depositsBySignature.size
    })
    
    return sorted
  })

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
    allTransactions,
    wrapperTransfers,
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
    setDateRange,
    getGuildWalletName,
    getTokenName
  }
})

