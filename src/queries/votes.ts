import { gql } from '@apollo/client'

/**
 * Query to fetch all votes for a specific wallet address
 * 
 * @example
 * query VotesByWallet($wallet: "AfAxoWptaPmp8CaExYTdkJyQsd83Ck2yhdvMDPYtsbd9", $first: 100)
 */
export const VOTES_BY_WALLET_QUERY = gql`
  query VotesByWallet($wallet: String!, $first: Int = 100, $after: Cursor) {
    allStarAtlasProposalVotes(
      condition: { walletPublicKey: $wallet }
      orderBy: CREATED_AT_DESC
      first: $first
      after: $after
    ) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
        __typename
      }
      nodes {
        id
        walletPublicKey
        createdAt
        proposalId
        proposalHash
        voteResult
        votingPower
        message
        signature
        starAtlasProposalByProposalId {
          id
          title
          pipNumber
          __typename
        }
        __typename
      }
      __typename
    }
  }
`

/**
 * Query to fetch proposal details by ID
 * 
 * @example
 * query ProposalById($id: "123")
 */
export const PROPOSAL_BY_ID_QUERY = gql`
  query ProposalById($id: String!) {
    starAtlasProposalById(id: $id) {
      id
      title
      pipNumber
      proposalHash
      createdAt
      __typename
    }
  }
`

/**
 * Simplified query to fetch votes for a specific proposal
 * Used when clicking on a proposal row
 * Matches the exact format from the user's request
 * 
 * @example
 * query MyQuery {
 *   allStarAtlasProposalVotes(condition: {proposalId: "0ecf2928-15df-497e-8b67-d87eda030d5a"}) {
 *     nodes {
 *       voteResult
 *       votingPower
 *       walletPublicKey
 *     }
 *   }
 * }
 */
export const VOTES_BY_PROPOSAL_ID_SIMPLE_QUERY = gql`
  query VotesByProposalIdSimple($proposalId: String!) {
    allStarAtlasProposalVotes(condition: { proposalId: $proposalId }) {
      nodes {
        voteResult
        votingPower
        walletPublicKey
      }
    }
  }
`


