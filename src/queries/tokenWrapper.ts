import { gql } from '@apollo/client'

// Token addresses
export const DAC_BLOONS_MINT = '4WN4y9zxqRrYtUTFkB3svJsYFVg2zo24tLTouLErnq9q'
export const DAO_BLOONS_MINT = 'C1FxQEMa7ZPmzpP8ak5PYg8iMdYaxZVNHF7pfaAcCx3D'
export const POLIS_MINT = 'poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk'
export const ATLAS_MINT = 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx'

/**
 * Query to fetch token wrapper data for DACB (DACBloons)
 * Filters by mint address instead of program ID to catch multisig transactions
 */
export const DACB_WRAPPER_QUERY = gql`
  query DacbWrapper {
    allSolanaTokenMints(
      condition: { mint: "${DAC_BLOONS_MINT}" }
      first: 10000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        account
        amountRaw
        byInstruction
        byProgram
        mint
        timestamp
        signature
        instruction
        instructionIdx
        instructionInnerIdx
        solanaAccountByAccount {
          owner
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
    allSolanaTokenBurns(
      condition: { mint: "${DAC_BLOONS_MINT}" }
      first: 10000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        account
        amountRaw
        byInstruction
        byProgram
        mint
        timestamp
        instruction
        instructionIdx
        instructionInnerIdx
        solanaAccountByAccount {
          owner
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
    allSolanaTokenTransfers(
      condition: { mint: "${DAC_BLOONS_MINT}" }
      first: 10000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        fromAccount
        toAccount
        timestamp
        mint
        byProgram
        byInstruction
        amountRaw
        signature
        instruction
        instructionIdx
        instructionInnerIdx
        solanaAccountByFromAccount {
          owner
        }
        solanaAccountByToAccount {
          owner
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
    # ATLAS transfers for DACB wrap ratio calculation
    # Limited to recent transfers - we'll filter to wrap-related ones in the store
    atlasTransfers: allSolanaTokenTransfers(
      condition: { mint: "${ATLAS_MINT}" }
      first: 5000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        amountRaw
        byProgram
        byInstruction
        fromAccount
        toAccount
        timestamp
        signature
        mint
        instruction
        instructionIdx
        instructionInnerIdx
        solanaAccountByFromAccount {
          owner
        }
        solanaAccountByToAccount {
          owner
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

/**
 * Query to fetch token wrapper data for DAOB (DAOBloons)
 * Filters by mint address instead of program ID to catch multisig transactions
 */
export const DAOB_WRAPPER_QUERY = gql`
  query DaobWrapper {
    allSolanaTokenMints(
      condition: { mint: "${DAO_BLOONS_MINT}" }
      first: 10000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        account
        amountRaw
        byInstruction
        byProgram
        mint
        timestamp
        signature
        instruction
        instructionIdx
        instructionInnerIdx
        solanaAccountByAccount {
          owner
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
    allSolanaTokenBurns(
      condition: { mint: "${DAO_BLOONS_MINT}" }
      first: 10000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        account
        amountRaw
        byInstruction
        byProgram
        mint
        timestamp
        instruction
        instructionIdx
        instructionInnerIdx
        solanaAccountByAccount {
          owner
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
    allSolanaTokenTransfers(
      condition: { mint: "${DAO_BLOONS_MINT}" }
      first: 10000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        fromAccount
        toAccount
        timestamp
        mint
        byProgram
        byInstruction
        amountRaw
        signature
        instruction
        instructionIdx
        instructionInnerIdx
        solanaAccountByFromAccount {
          owner
        }
        solanaAccountByToAccount {
          owner
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
    # POLIS transfers for DAOB wrap ratio calculation
    # Limited to recent transfers - we'll filter to wrap-related ones in the store
    polisTransfers: allSolanaTokenTransfers(
      condition: { mint: "${POLIS_MINT}" }
      first: 5000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        amountRaw
        byProgram
        byInstruction
        fromAccount
        toAccount
        timestamp
        signature
        mint
        instruction
        instructionIdx
        instructionInnerIdx
        solanaAccountByFromAccount {
          owner
        }
        solanaAccountByToAccount {
          owner
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

