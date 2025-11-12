import { gql } from '@apollo/client'

export const EXCHANGES_BY_INITIALIZER_QUERY = gql`
  query ExchangesByInitializer($wallet: Address!, $after: Cursor) {
    allStarAtlasExchanges(
      first: 1000
      condition: {orderInitializer: $wallet}
      orderBy: TIMESTAMP_DESC
      after: $after
    ) {
      nodes {
        asset
        amount
        pair
        price
        side
        fee
        timestamp
        orderInitializer
        orderTaker
        instructionIndex
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const EXCHANGES_BY_TAKER_QUERY = gql`
  query ExchangesByTaker($wallet: Address!, $after: Cursor) {
    allStarAtlasExchanges(
      first: 1000
      condition: {orderTaker: $wallet}
      orderBy: TIMESTAMP_DESC
      after: $after
    ) {
      nodes {
        asset
        amount
        pair
        price
        side
        fee
        timestamp
        orderInitializer
        orderTaker
        instructionIndex
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`
