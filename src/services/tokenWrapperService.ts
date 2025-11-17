import { graphqlClient } from './graphqlClient'
import { DACB_WRAPPER_QUERY, DAOB_WRAPPER_QUERY, WRAPPER_QUERY, DACB_MULTISIG_QUERY } from '../queries/tokenWrapper'

export interface SolanaAccount {
  owner: string | null
}

export interface TokenMint {
  account: string
  amountRaw: string
  byInstruction: string
  byProgram: string
  mint: string
  timestamp: string
  signature?: string
  instruction?: string
  instructionIdx?: number
  instructionInnerIdx?: number
  solanaAccountByAccount: SolanaAccount | null
}

export interface TokenBurn {
  account: string
  amountRaw: string
  byInstruction: string
  byProgram: string
  mint: string
  timestamp: string
  instruction?: string
  instructionIdx?: number
  instructionInnerIdx?: number
  solanaAccountByAccount: SolanaAccount | null
}

export interface TokenTransfer {
  amountRaw: string
  byProgram: string
  byInstruction: string
  fromAccount: string
  toAccount: string
  timestamp: string
  signature?: string
  instruction?: string
  instructionIdx?: number
  instructionInnerIdx?: number
  solanaAccountByFromAccount: SolanaAccount | null
  solanaAccountByToAccount: SolanaAccount | null
  mint: string
}

export interface TokenWrapperResponse {
  allSolanaTokenMints: {
    nodes: TokenMint[]
    pageInfo: {
      endCursor: string | null
      hasNextPage: boolean
    }
  }
  allSolanaTokenBurns: {
    nodes: TokenBurn[]
    pageInfo: {
      endCursor: string | null
      hasNextPage: boolean
    }
  }
  allSolanaTokenTransfers: {
    nodes: TokenTransfer[]
    pageInfo: {
      endCursor: string | null
      hasNextPage: boolean
    }
  }
}

// Simplified interfaces for wrapper query (no nested account info)
export interface WrapperMint {
  account: string
  amountRaw: string
  byInstruction: string
  byProgram: string
  mint: string
  timestamp: string
  signature?: string
}

export interface WrapperBurn {
  account: string
  amountRaw: string
  byInstruction: string
  byProgram: string
  mint: string
  timestamp: string
  signature?: string
}

export interface WrapperTransfer {
  fromAccount: string
  toAccount: string
  timestamp: string
  mint: string
  byProgram: string
  byInstruction: string
  amountRaw: string
  signature?: string
}

export interface WrapperResponse {
  allSolanaTokenMints: {
    nodes: WrapperMint[]
  }
  allSolanaTokenBurns: {
    nodes: WrapperBurn[]
    pageInfo: {
      endCursor: string | null
      hasNextPage: boolean
    }
  }
  allSolanaTokenTransfers: {
    nodes: WrapperTransfer[]
  }
}

export async function fetchDACBWrapperData(): Promise<TokenWrapperResponse> {
  console.log('[SB Fetch] Starting DACB wrapper data fetch...')
  console.time('[SB Fetch] DACB wrapper query')
  
  const result = await graphqlClient.query({
    query: DACB_WRAPPER_QUERY
  })
  
  console.timeEnd('[SB Fetch] DACB wrapper query')

  if (result.errors && result.errors.length > 0) {
    console.error('[SB Fetch] DACB wrapper query errors:', result.errors)
    throw new Error(result.errors[0].message || 'Failed to fetch DACB wrapper data')
  }

  if (!result.data) {
    console.error('[SB Fetch] No data returned from DACB wrapper query')
    throw new Error('No data returned from GraphQL query')
  }

  const data = result.data as TokenWrapperResponse
  console.log('[SB Fetch] DACB data received:', {
    mints: data.allSolanaTokenMints.nodes.length,
    burns: data.allSolanaTokenBurns.nodes.length,
    transfers: data.allSolanaTokenTransfers.nodes.length
  })

  return data
}

export async function fetchDAOBWrapperData(): Promise<TokenWrapperResponse> {
  console.log('[SB Fetch] Starting DAOB wrapper data fetch...')
  console.time('[SB Fetch] DAOB wrapper query')
  
  const result = await graphqlClient.query({
    query: DAOB_WRAPPER_QUERY
  })
  
  console.timeEnd('[SB Fetch] DAOB wrapper query')

  if (result.errors && result.errors.length > 0) {
    console.error('[SB Fetch] DAOB wrapper query errors:', result.errors)
    throw new Error(result.errors[0].message || 'Failed to fetch DAOB wrapper data')
  }

  if (!result.data) {
    console.error('[SB Fetch] No data returned from DAOB wrapper query')
    throw new Error('No data returned from GraphQL query')
  }

  const data = result.data as TokenWrapperResponse
  console.log('[SB Fetch] DAOB data received:', {
    mints: data.allSolanaTokenMints.nodes.length,
    burns: data.allSolanaTokenBurns.nodes.length,
    transfers: data.allSolanaTokenTransfers.nodes.length
  })

  return data
}

export async function fetchWrapperData(): Promise<WrapperResponse> {
  console.log('[SB Fetch] Starting wrapper data fetch...')
  console.time('[SB Fetch] Wrapper query')
  
  const result = await graphqlClient.query({
    query: WRAPPER_QUERY
  })
  
  console.timeEnd('[SB Fetch] Wrapper query')

  if (result.errors && result.errors.length > 0) {
    console.error('[SB Fetch] Wrapper query errors:', result.errors)
    throw new Error(result.errors[0].message || 'Failed to fetch wrapper data')
  }

  if (!result.data) {
    console.error('[SB Fetch] No data returned from wrapper query')
    throw new Error('No data returned from GraphQL query')
  }

  const data = result.data as WrapperResponse
  console.log('[SB Fetch] Wrapper data received:', {
    mints: data.allSolanaTokenMints.nodes.length,
    burns: data.allSolanaTokenBurns.nodes.length,
    transfers: data.allSolanaTokenTransfers.nodes.length
  })

  return data
}

export async function fetchDACBMultisigData(): Promise<WrapperResponse> {
  console.log('[SB Fetch] Starting DACB multisig data fetch...')
  console.time('[SB Fetch] DACB multisig query')
  
  const result = await graphqlClient.query({
    query: DACB_MULTISIG_QUERY
  })
  
  console.timeEnd('[SB Fetch] DACB multisig query')

  if (result.errors && result.errors.length > 0) {
    console.error('[SB Fetch] DACB multisig query errors:', result.errors)
    throw new Error(result.errors[0].message || 'Failed to fetch DACB multisig data')
  }

  if (!result.data) {
    console.error('[SB Fetch] No data returned from DACB multisig query')
    throw new Error('No data returned from GraphQL query')
  }

  const data = result.data as WrapperResponse
  console.log('[SB Fetch] DACB multisig data received:', {
    transfers: data.allSolanaTokenTransfers.nodes.length
  })

  return data
}

