# Data Services

This directory contains all data provider services for the Star Atlas wallet tracker.

## Available Services

### 1. Star Atlas Galaxy API (`starAtlasGalaxyService.ts`)

Fetches NFT and resource data from `https://galaxy.staratlas.com/nfts`.

**Usage:**
```typescript
import { 
  fetchAllNFTs, 
  fetchNFTByMint, 
  fetchNFTBySymbol,
  fetchNFTsByCategory,
  fetchNFTsByItemType 
} from '@/services/starAtlasGalaxyService'

// Fetch all NFTs and resources
const allNFTs = await fetchAllNFTs()

// Fetch specific NFT by mint address
const nft = await fetchNFTByMint('7dr7jVyXf1KUnYq5FTpV2vCZjKRR4MV94jzerb8Fi16Q')

// Fetch NFT by symbol
const nft = await fetchNFTBySymbol('MRDR')

// Fetch NFTs by category
const resources = await fetchNFTsByCategory('resource')

// Fetch NFTs by item type
const currencies = await fetchNFTsByItemType('currency')
```

### 2. Rogue DataHub OHLC API (`rogueDataHubService.ts`)

Fetches OHLC (Open, High, Low, Close) market data from `https://api.roguedatahub.xyz`.

**Usage:**
```typescript
import { 
  fetchMarketplaceOHLC,
  fetchDailyOHLC,
  fetchHourlyOHLC,
  fetchWeeklyOHLC 
} from '@/services/rogueDataHubService'

// Fetch daily OHLC data
const dailyData = await fetchDailyOHLC('ATLAS')

// Fetch with date range
const data = await fetchDailyOHLC('POLIS', '2024-01-01', '2024-12-31')

// Fetch hourly data
const hourlyData = await fetchHourlyOHLC('ATLAS')

// Fetch weekly data
const weeklyData = await fetchWeeklyOHLC('POLIS')

// Custom timeframe
const customData = await fetchMarketplaceOHLC('ATLAS', '1h', startDate, endDate)
```

### 3. Star Atlas Token Info (`starAtlasTokenService.ts`)

Fetches token information from `https://galaxy.staratlas.com/tokens`.

**Usage:**
```typescript
import { 
  fetchPolisTokenInfo,
  fetchAtlasTokenInfo,
  fetchBothTokenInfo 
} from '@/services/starAtlasTokenService'

// Fetch POLIS token info
const polisInfo = await fetchPolisTokenInfo()

// Fetch ATLAS token info
const atlasInfo = await fetchAtlasTokenInfo()

// Fetch both tokens at once
const { polis, atlas } = await fetchBothTokenInfo()
```

### 4. CoinGecko API (`coingeckoService.ts`)

Fetches token price data from CoinGecko API.

**Usage:**
```typescript
import { 
  fetchTokenMarketChart,
  fetchTokenMarketData,
  fetchBothTokensMarketChart,
  fetchBothTokensMarketData 
} from '@/services/coingeckoService'

// Fetch 30-day price chart for ATLAS
const atlasChart = await fetchTokenMarketChart('ATLAS', 'usd', 30)

// Fetch current market data
const atlasData = await fetchTokenMarketData('ATLAS')

// Fetch both tokens' market charts
const { atlas, polis } = await fetchBothTokensMarketChart(90)

// Fetch both tokens' current market data
const { atlas, polis } = await fetchBothTokensMarketData()
```

## Data Types

All services export TypeScript interfaces for type safety:

- `StarAtlasNFT` - NFT and resource data structure
- `OHLCData` - OHLC price data structure
- `TokenInfo` - Token information structure
- `CoinGeckoPriceData` - Historical price data
- `CoinGeckoMarketData` - Current market data

## Error Handling

All services include proper error handling and will throw descriptive errors if API calls fail. Always wrap service calls in try-catch blocks:

```typescript
try {
  const nfts = await fetchAllNFTs()
  // Use nfts...
} catch (error) {
  console.error('Failed to fetch NFTs:', error)
  // Handle error...
}
```

## CORS and Proxies

If you encounter CORS issues in development, you can use the proxy configurations in `vite.config.ts`. The services are configured to work directly with the APIs, but proxy routes are available:

- `/api/galaxy` → `https://galaxy.staratlas.com`
- `/api/roguedatahub` → `https://api.roguedatahub.xyz`
- `/api/coingecko` → `https://api.coingecko.com/api/v3`

To use proxies, update the service base URLs to use the proxy paths instead of direct URLs.

## Future: Helius RPC

Helius RPC integration is planned for future implementation. Credentials are documented in `dist/private/CREDENTIALS.md`.

