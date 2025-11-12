/**
 * Star Atlas Galaxy API Service
 * Fetches NFT and resource data from https://galaxy.staratlas.com/nfts
 */

export interface StarAtlasNFT {
  _id: string
  deactivated: boolean
  name: string
  description: string
  image: string
  symbol: string
  mint: string
  network: string
  totalSupply: number
  attributes: {
    itemType: string
    tier?: number
    class: string
    category: string
    rarity?: string
    score?: number
    musician?: string
    spec?: string
  }
  collection: {
    name: string
    family: string
  }
  markets: Array<{
    _id: string
    id: string
    quotePair: string
  }>
  tradeSettings: {
    msrp?: {
      value: number
      currencySymbol: string
    }
    exclusiveCurrency?: string
    vwap?: number
  }
  media: {
    qrInstagram?: string
    qrFacebook?: string
    sketchfab?: string
    audio?: string
    thumbnailUrl?: string
    gallery?: string[] | null
  }
  slots: {
    crewSlots: any[]
    componentSlots: any[]
    moduleSlots: any[]
  }
  airdrops?: any[]
  primarySales?: any[]
  createdAt?: string
  updatedAt?: string
}

const GALAXY_API_BASE = 'https://galaxy.staratlas.com'

/**
 * Fetch all NFTs and resources from Star Atlas Galaxy API
 */
export async function fetchAllNFTs(): Promise<StarAtlasNFT[]> {
  try {
    const response = await fetch(`${GALAXY_API_BASE}/nfts`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data as StarAtlasNFT[]
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching NFTs: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching NFTs')
  }
}

/**
 * Fetch a specific NFT by mint address
 */
export async function fetchNFTByMint(mint: string): Promise<StarAtlasNFT | null> {
  try {
    const allNFTs = await fetchAllNFTs()
    return allNFTs.find(nft => nft.mint === mint) || null
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching NFT by mint: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching NFT by mint')
  }
}

/**
 * Fetch NFTs by symbol
 */
export async function fetchNFTBySymbol(symbol: string): Promise<StarAtlasNFT | null> {
  try {
    const allNFTs = await fetchAllNFTs()
    return allNFTs.find(nft => nft.symbol === symbol) || null
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching NFT by symbol: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching NFT by symbol')
  }
}

/**
 * Fetch NFTs by category (e.g., 'rebirth', 'resource', 'access')
 */
export async function fetchNFTsByCategory(category: string): Promise<StarAtlasNFT[]> {
  try {
    const allNFTs = await fetchAllNFTs()
    return allNFTs.filter(nft => nft.attributes.category === category)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching NFTs by category: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching NFTs by category')
  }
}

/**
 * Fetch NFTs by item type (e.g., 'collectible', 'resource', 'access', 'currency')
 */
export async function fetchNFTsByItemType(itemType: string): Promise<StarAtlasNFT[]> {
  try {
    const allNFTs = await fetchAllNFTs()
    return allNFTs.filter(nft => nft.attributes.itemType === itemType)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching NFTs by item type: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching NFTs by item type')
  }
}

