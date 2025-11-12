import { graphqlClient } from './graphqlClient'
import { 
  EXCHANGES_BY_INITIALIZER_QUERY, 
  EXCHANGES_BY_TAKER_QUERY
} from '../queries/marketplace'

export interface ExchangeNode {
  asset: string
  amount: string
  pair: string
  price: string
  side: string
  fee: string
  timestamp: string
  orderInitializer: string
  orderTaker: string
  instructionIndex: number
}

export interface ExchangesResponse {
  allStarAtlasExchanges: {
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
    nodes: ExchangeNode[]
  }
}

/**
 * Fetch all exchanges for a wallet (both as initializer and taker)
 * 
 * @param wallet - Wallet address to fetch exchanges for
 * @param startDate - Optional start date (ISO string). If provided, will stop fetching when we encounter dates before this
 * @param endDate - Optional end date (ISO string). If provided, will filter out exchanges after this date
 * @returns Combined array of all exchanges within the date range
 */
export async function fetchExchangesByWallet(
  wallet: string,
  startDate?: string,
  endDate?: string
): Promise<ExchangeNode[]> {
  const allExchanges: ExchangeNode[] = []
  
  // Fetch exchanges where wallet is orderTaker
  const takerExchanges = await fetchExchangesWithPagination(
    EXCHANGES_BY_TAKER_QUERY,
    wallet,
    startDate,
    endDate
  )
  allExchanges.push(...takerExchanges)
  
  // Fetch exchanges where wallet is orderInitializer
  const initializerExchanges = await fetchExchangesWithPagination(
    EXCHANGES_BY_INITIALIZER_QUERY,
    wallet,
    startDate,
    endDate
  )
  allExchanges.push(...initializerExchanges)
  
  // Remove duplicates based on unique identifier (timestamp + instructionIndex + asset)
  const uniqueExchanges = Array.from(
    new Map(
      allExchanges.map(exchange => [
        `${exchange.timestamp}-${exchange.instructionIndex}-${exchange.asset}`,
        exchange
      ])
    ).values()
  )
  
  // Filter by date range (final filter to ensure we only return exchanges within range)
  let filteredExchanges = uniqueExchanges
  if (startDate || endDate) {
    filteredExchanges = uniqueExchanges.filter(exchange => {
      const exchangeTimestamp = new Date(exchange.timestamp).getTime()
      
      if (startDate) {
        // Set to start of day for comparison
        const startOfDay = new Date(startDate)
        startOfDay.setHours(0, 0, 0, 0)
        const startTimestamp = startOfDay.getTime()
        if (exchangeTimestamp < startTimestamp) {
          return false
        }
      }
      
      if (endDate) {
        // Include exchanges on the end date (set to end of day)
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        const endOfDayTimestamp = endOfDay.getTime()
        if (exchangeTimestamp > endOfDayTimestamp) {
          return false
        }
      }
      
      return true
    })
  }
  
  // Sort all exchanges by timestamp descending (most recent first)
  return filteredExchanges.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime()
    const timeB = new Date(b.timestamp).getTime()
    return timeB - timeA
  })
}

/**
 * Fetch exchanges using direct query with condition filtering and pagination
 * 
 * @param query - GraphQL query to execute
 * @param wallet - Wallet address
 * @param startDate - Optional start date. If provided, stops fetching when encountering dates before this
 * @param endDate - Optional end date. Used for final filtering only (not for early stopping)
 */
async function fetchExchangesWithPagination(
  query: any,
  wallet: string,
  startDate?: string,
  endDate?: string
): Promise<ExchangeNode[]> {
  const allExchanges: ExchangeNode[] = []
  let hasNextPage = true
  let cursor: string | null = null
  let pageCount = 0
  const maxPages = 1000 // Safety limit
  
  // Pre-calculate timestamps for filtering
  // For startDate, set to start of day (00:00:00.000)
  const startTimestamp = startDate ? (() => {
    const startOfDay = new Date(startDate)
    startOfDay.setHours(0, 0, 0, 0)
    return startOfDay.getTime()
  })() : null
  // For endDate, set to end of day (23:59:59.999)
  const endOfDayTimestamp = endDate ? (() => {
    const endOfDay = new Date(endDate)
    endOfDay.setHours(23, 59, 59, 999)
    return endOfDay.getTime()
  })() : null
  
  while (hasNextPage && pageCount < maxPages) {
    const variables: any = {
      wallet
    }
    
    if (cursor) {
      variables.after = cursor
    }
    
    let result
    try {
      result = await graphqlClient.query({
        query,
        variables
      })

      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL Errors:', result.errors)
        throw new Error(result.errors[0].message || 'Failed to fetch exchanges')
      }
    } catch (error: any) {
      console.error('Error fetching exchanges page:', error)
      throw error
    }

    if (!result || !result.data) {
      throw new Error('No data returned from GraphQL query')
    }

    const response = result.data as ExchangesResponse
    const exchanges = response.allStarAtlasExchanges.nodes
    
    // Filter exchanges by date range during pagination
    const validExchanges = exchanges.filter(exchange => {
      const exchangeTimestamp = new Date(exchange.timestamp).getTime()
      
      // Filter out exchanges before startDate
      if (startTimestamp && exchangeTimestamp < startTimestamp) {
        return false
      }
      
      // Filter out exchanges after endDate
      if (endOfDayTimestamp && exchangeTimestamp > endOfDayTimestamp) {
        return false
      }
      
      return true
    })
    
    // Add only valid exchanges
    allExchanges.push(...validExchanges)
    
    // Early stopping: If we have a startDate, check if we've gone past it
    // Note: Data is sorted by TIMESTAMP_DESC (newest first), so the last item in the array is the oldest
    if (startTimestamp && exchanges.length > 0) {
      const oldestExchange = exchanges[exchanges.length - 1]
      const oldestTimestamp = new Date(oldestExchange.timestamp).getTime()
      
      // If the oldest exchange in this batch is before our start date, we can stop
      // All subsequent pages will be even older (since data is sorted descending)
      if (oldestTimestamp < startTimestamp) {
        break // Stop fetching more pages - we've gone past the start date
      }
    }
    
    // Check pagination
    hasNextPage = response.allStarAtlasExchanges.pageInfo.hasNextPage
    cursor = response.allStarAtlasExchanges.pageInfo.endCursor
    pageCount++
  }
  
  // Final filtering by date range (in case we didn't stop early or need to filter by endDate)
  let filteredExchanges = allExchanges
  if (startDate || endDate) {
    filteredExchanges = allExchanges.filter(exchange => {
      const exchangeTimestamp = new Date(exchange.timestamp).getTime()
      
      if (startDate) {
        // Set to start of day for comparison
        const startOfDay = new Date(startDate)
        startOfDay.setHours(0, 0, 0, 0)
        const startTimestamp = startOfDay.getTime()
        if (exchangeTimestamp < startTimestamp) {
          return false
        }
      }
      
      if (endDate) {
        // Include exchanges on the end date (set to end of day)
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        const endOfDayTimestamp = endOfDay.getTime()
        if (exchangeTimestamp > endOfDayTimestamp) {
          return false
        }
      }
      
      return true
    })
  }
  
  return filteredExchanges
}

