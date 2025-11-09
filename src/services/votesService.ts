import { graphqlClient } from './graphqlClient'
import { VOTES_BY_WALLET_QUERY } from '../queries/votes'

export interface StarAtlasProposal {
  id: string
  title: string
  pipNumber: string
}

export interface VoteNode {
  id: string
  walletPublicKey: string
  createdAt: string
  proposalId: string
  proposalHash: string
  voteResult: string
  votingPower: string
  message: string
  signature: string
  starAtlasProposalByProposalId: StarAtlasProposal | null
}

export interface VotesResponse {
  allStarAtlasProposalVotes: {
    totalCount: number
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
    nodes: VoteNode[]
  }
}

export async function fetchVotesByWallet(wallet: string): Promise<VotesResponse> {
  const result = await graphqlClient.query({
    query: VOTES_BY_WALLET_QUERY,
    variables: {
      wallet,
      first: 100
    }
  })

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message || 'Failed to fetch votes')
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query')
  }

  return result.data as VotesResponse
}

