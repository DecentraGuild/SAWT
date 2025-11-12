/**
 * CoinGecko API Service
 * Fetches token price data from CoinGecko API
 */

export interface CoinGeckoPriceData {
  prices: Array<[number, number]> // [timestamp, price]
  market_caps: Array<[number, number]> // [timestamp, market_cap]
  total_volumes: Array<[number, number]> // [timestamp, volume]
}

export interface CoinGeckoMarketData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// CoinGecko IDs for Star Atlas tokens
const COINGECKO_IDS = {
  ATLAS: 'star-atlas',
  POLIS: 'star-atlas-dao'
} as const

/**
 * Fetch market chart data for a token
 * @param tokenSymbol - Token symbol ('ATLAS' or 'POLIS')
 * @param vsCurrency - Currency to compare against (default: 'usd')
 * @param days - Number of days of data (default: 30, max: 365)
 */
export async function fetchTokenMarketChart(
  tokenSymbol: 'ATLAS' | 'POLIS',
  vsCurrency: string = 'usd',
  days: number = 30
): Promise<CoinGeckoPriceData> {
  try {
    const coinId = COINGECKO_IDS[tokenSymbol]
    
    if (!coinId) {
      throw new Error(`Unknown token symbol: ${tokenSymbol}`)
    }

    // Limit days to max 365
    const daysParam = Math.min(days, 365)
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${daysParam}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch market chart: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data as CoinGeckoPriceData
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching market chart: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching market chart')
  }
}

/**
 * Fetch current market data for a token
 * @param tokenSymbol - Token symbol ('ATLAS' or 'POLIS')
 */
export async function fetchTokenMarketData(
  tokenSymbol: 'ATLAS' | 'POLIS'
): Promise<CoinGeckoMarketData> {
  try {
    const coinId = COINGECKO_IDS[tokenSymbol]
    
    if (!coinId) {
      throw new Error(`Unknown token symbol: ${tokenSymbol}`)
    }
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Transform to our interface format
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.large || data.image?.small || '',
      current_price: data.market_data?.current_price?.usd || 0,
      market_cap: data.market_data?.market_cap?.usd || 0,
      market_cap_rank: data.market_data?.market_cap_rank || 0,
      fully_diluted_valuation: data.market_data?.fully_diluted_valuation?.usd || 0,
      total_volume: data.market_data?.total_volume?.usd || 0,
      high_24h: data.market_data?.high_24h?.usd || 0,
      low_24h: data.market_data?.low_24h?.usd || 0,
      price_change_24h: data.market_data?.price_change_24h?.usd || 0,
      price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
      market_cap_change_24h: data.market_data?.market_cap_change_24h?.usd || 0,
      market_cap_change_percentage_24h: data.market_data?.market_cap_change_percentage_24h || 0,
      circulating_supply: data.market_data?.circulating_supply || 0,
      total_supply: data.market_data?.total_supply || 0,
      max_supply: data.market_data?.max_supply || null,
      ath: data.market_data?.ath?.usd || 0,
      ath_change_percentage: data.market_data?.ath_change_percentage?.usd || 0,
      ath_date: data.market_data?.ath_date?.usd || '',
      atl: data.market_data?.atl?.usd || 0,
      atl_change_percentage: data.market_data?.atl_change_percentage?.usd || 0,
      atl_date: data.market_data?.atl_date?.usd || '',
      last_updated: data.last_updated || ''
    } as CoinGeckoMarketData
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching market data: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching market data')
  }
}

/**
 * Fetch daily prices for both ATLAS and POLIS tokens
 * @param days - Number of days of data (default: 30)
 */
export async function fetchBothTokensMarketChart(
  days: number = 30
): Promise<{ atlas: CoinGeckoPriceData; polis: CoinGeckoPriceData }> {
  try {
    const [atlas, polis] = await Promise.all([
      fetchTokenMarketChart('ATLAS', 'usd', days),
      fetchTokenMarketChart('POLIS', 'usd', days)
    ])
    
    return { atlas, polis }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching both tokens market chart: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching both tokens market chart')
  }
}

/**
 * Fetch current market data for both ATLAS and POLIS tokens
 */
export async function fetchBothTokensMarketData(): Promise<{
  atlas: CoinGeckoMarketData
  polis: CoinGeckoMarketData
}> {
  try {
    const [atlas, polis] = await Promise.all([
      fetchTokenMarketData('ATLAS'),
      fetchTokenMarketData('POLIS')
    ])
    
    return { atlas, polis }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching both tokens market data: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching both tokens market data')
  }
}

