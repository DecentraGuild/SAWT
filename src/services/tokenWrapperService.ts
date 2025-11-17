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
  polisTransfers?: {
    nodes: TokenTransfer[]
    pageInfo: {
      endCursor: string | null
      hasNextPage: boolean
    }
  }
  atlasTransfers?: {
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
  const result = await graphqlClient.query({
    query: DACB_WRAPPER_QUERY
  })

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message || 'Failed to fetch DACB wrapper data')
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query')
  }

  return result.data as TokenWrapperResponse
}

export async function fetchDAOBWrapperData(): Promise<TokenWrapperResponse> {
  const result = await graphqlClient.query({
    query: DAOB_WRAPPER_QUERY
  })

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message || 'Failed to fetch DAOB wrapper data')
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query')
  }

  return result.data as TokenWrapperResponse
}

export async function fetchWrapperData(): Promise<WrapperResponse> {
  const result = await graphqlClient.query({
    query: WRAPPER_QUERY
  })

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message || 'Failed to fetch wrapper data')
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query')
  }

  return result.data as WrapperResponse
}

export async function fetchDACBMultisigData(): Promise<WrapperResponse> {
  const result = await graphqlClient.query({
    query: DACB_MULTISIG_QUERY
  })

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message || 'Failed to fetch DACB multisig data')
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query')
  }

  return result.data as WrapperResponse
}

