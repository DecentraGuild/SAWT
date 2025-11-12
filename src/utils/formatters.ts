/**
 * Shared formatting utilities for the application
 */

export function formatVoteResult(result: string): string {
  if (!result) return 'N/A'
  
  const lowerResult = result.toLowerCase()
  if (lowerResult === 'yes' || lowerResult === 'no') {
    return result.charAt(0).toUpperCase() + result.slice(1)
  }
  
  if (result.includes(',')) {
    const items = result.split(',').map(item => item.trim())
    if (items.length <= 3) {
      return items.join(', ')
    }
    return `${items.slice(0, 3).join(', ')} +${items.length - 3} more`
  }
  
  return result
}

/**
 * Format vote result without truncation - shows full vote for detailed views
 */
export function formatVoteResultFull(result: string): string {
  if (!result) return 'N/A'
  
  const lowerResult = result.toLowerCase()
  if (lowerResult === 'yes' || lowerResult === 'no') {
    return result.charAt(0).toUpperCase() + result.slice(1)
  }
  
  if (result.includes(',')) {
    const items = result.split(',').map(item => item.trim())
    return items.join(', ')
  }
  
  return result
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatWallet(wallet: string): string {
  if (!wallet) return 'Unknown'
  if (wallet.length > 12) {
    return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`
  }
  return wallet
}

/**
 * Format a number with optimized decimal places based on value range:
 * - 0-0.9999 = 4 digits
 * - 1-10 = 3 digits
 * - 10-100 = 2 digits
 * - 100-1000 = 1 digit
 * - 1000+ = no digits
 */
export function formatNumberOptimized(value: number): string {
  const absValue = Math.abs(value)
  
  let decimals: number
  if (absValue < 1) {
    decimals = 4
  } else if (absValue < 10) {
    decimals = 3
  } else if (absValue < 100) {
    decimals = 2
  } else if (absValue < 1000) {
    decimals = 1
  } else {
    decimals = 0
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * Format a number with specified decimal places
 * @deprecated Use formatNumberOptimized for better display formatting
 */
export function formatNumber(value: number, minDecimals: number = 0, maxDecimals: number = 2): string {
  return formatNumberOptimized(value)
}

/**
 * Format a number with currency symbol
 */
export function formatCurrency(value: number, currency: string = 'ATLAS'): string {
  return `${formatNumberOptimized(value)} ${currency}`
}

/**
 * Format a number as USD currency
 */
export function formatUSD(value: number, decimals?: number): string {
  // If decimals is explicitly provided, use it; otherwise use optimized formatting
  if (decimals !== undefined) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }
  
  // Use optimized formatting for USD
  const formatted = formatNumberOptimized(value)
  return `$${formatted}`
}

export function formatVotingPower(power: number): string {
  return formatNumberOptimized(power)
}

