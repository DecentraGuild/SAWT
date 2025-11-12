/**
 * Rogue DataHub API Service
 * Fetches OHLC (Open, High, Low, Close) market data from https://api.roguedatahub.xyz
 */

export interface OHLCData {
  time: number | string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface MarketplaceOHLCResponse {
  data: OHLCData[]
  symbol?: string
  timeframe?: string
}

const ROGUE_DATAHUB_API_BASE = 'https://api.roguedatahub.xyz'

/**
 * Fetch OHLC data for a specific asset from the marketplace
 * @param symbol - The asset symbol (e.g., 'ATLAS', 'POLIS', or NFT symbol)
 * @param timeframe - Timeframe for the data (e.g., '1d', '1h', '1w')
 * @param startDate - Optional start date (ISO string or timestamp)
 * @param endDate - Optional end date (ISO string or timestamp)
 */
export async function fetchMarketplaceOHLC(
  symbol: string,
  timeframe: string = '1d',
  startDate?: string | number,
  endDate?: string | number
): Promise<OHLCData[]> {
  try {
    const params = new URLSearchParams({
      symbol,
      timeframe
    })

    if (startDate) {
      params.append('start_date', String(startDate))
    }
    if (endDate) {
      params.append('end_date', String(endDate))
    }

    const response = await fetch(`${ROGUE_DATAHUB_API_BASE}/marketplace/ohlc?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch OHLC data: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json() as MarketplaceOHLCResponse
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data as OHLCData[]
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data
    }
    
    throw new Error('Unexpected response format from OHLC API')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching OHLC data: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching OHLC data')
  }
}

/**
 * Fetch daily OHLC data for a specific asset
 */
export async function fetchDailyOHLC(
  symbol: string,
  startDate?: string | number,
  endDate?: string | number
): Promise<OHLCData[]> {
  return fetchMarketplaceOHLC(symbol, '1d', startDate, endDate)
}

/**
 * Fetch hourly OHLC data for a specific asset
 */
export async function fetchHourlyOHLC(
  symbol: string,
  startDate?: string | number,
  endDate?: string | number
): Promise<OHLCData[]> {
  return fetchMarketplaceOHLC(symbol, '1h', startDate, endDate)
}

/**
 * Fetch weekly OHLC data for a specific asset
 */
export async function fetchWeeklyOHLC(
  symbol: string,
  startDate?: string | number,
  endDate?: string | number
): Promise<OHLCData[]> {
  return fetchMarketplaceOHLC(symbol, '1w', startDate, endDate)
}

