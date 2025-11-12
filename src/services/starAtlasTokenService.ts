/**
 * Star Atlas Token Info Service
 * Fetches token information from https://galaxy.staratlas.com/tokens
 */

export interface TokenInfo {
  name: string
  symbol: string
  description?: string
  image?: string
  mint: string
  decimals: number
  supply?: {
    total?: number
    circulating?: number
  }
  network: string
  metadata?: {
    [key: string]: any
  }
}

const GALAXY_API_BASE = 'https://galaxy.staratlas.com'

/**
 * Fetch POLIS token information
 */
export async function fetchPolisTokenInfo(): Promise<TokenInfo> {
  try {
    const response = await fetch(`${GALAXY_API_BASE}/tokens/polis`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch POLIS token info: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data as TokenInfo
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching POLIS token info: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching POLIS token info')
  }
}

/**
 * Fetch ATLAS token information
 */
export async function fetchAtlasTokenInfo(): Promise<TokenInfo> {
  try {
    const response = await fetch(`${GALAXY_API_BASE}/tokens/atlas`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ATLAS token info: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data as TokenInfo
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching ATLAS token info: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching ATLAS token info')
  }
}

/**
 * Fetch both POLIS and ATLAS token information
 */
export async function fetchBothTokenInfo(): Promise<{ polis: TokenInfo; atlas: TokenInfo }> {
  try {
    const [polis, atlas] = await Promise.all([
      fetchPolisTokenInfo(),
      fetchAtlasTokenInfo()
    ])
    
    return { polis, atlas }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching token info: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching token info')
  }
}

