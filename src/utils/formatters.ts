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

export function formatVotingPower(power: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(power)
}

export function formatWallet(wallet: string): string {
  if (!wallet) return 'Unknown'
  if (wallet.length > 12) {
    return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`
  }
  return wallet
}

/**
 * Format a number with currency symbol
 */
export function formatCurrency(value: number, currency: string = 'ATLAS'): string {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)} ${currency}`
}

/**
 * Format a number as USD currency
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(value)
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(value: number, minDecimals: number = 0, maxDecimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  }).format(value)
}

