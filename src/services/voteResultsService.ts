import { graphqlClient } from './graphqlClient'
import { PROPOSAL_BY_ID_QUERY, VOTES_BY_PROPOSAL_ID_SIMPLE_QUERY, ALL_PIP_QUERY } from '../queries/votes'
import type { VoteNode } from './votesService'

export interface ProposalVoteResults {
  proposalId: string
  proposalTitle: string
  pipNumber: string
  totalVotes: number
  totalVotingPower: number
  votes: VoteNode[] // Individual votes sorted by voting power descending
}

export interface ProposalResponse {
  starAtlasProposalById: {
    id: string
    title: string
    pipNumber: string
    proposalHash: string
    createdAt: string
  } | null
}

/**
 * Simplified response interface for the simple query
 * Matches the exact query structure: voteResult, votingPower, walletPublicKey, createdAt
 */
export interface VotesByProposalIdSimpleResponse {
  allStarAtlasProposalVotes: {
    nodes: Array<{
      voteResult: string
      votingPower: string
      walletPublicKey: string
      createdAt: string
    }>
  }
}

/**
 * Fetch all votes for a specific proposal using the simplified query
 * @param proposalId - The proposal ID to fetch votes for
 * @param proposalTitle - Optional proposal title (if already known)
 * @param pipNumber - Optional PIP number (if already known)
 */
export async function fetchVoteResultsByProposal(
  proposalId: string,
  proposalTitle?: string,
  pipNumber?: string
): Promise<ProposalVoteResults> {
  try {
    // Try to fetch proposal details if not provided, but don't fail if it doesn't work
    let title = proposalTitle || 'Unknown Proposal'
    let pip = pipNumber || 'N/A'

    if (!proposalTitle || !pipNumber) {
      try {
        const proposalResult = await graphqlClient.query({
          query: PROPOSAL_BY_ID_QUERY,
          variables: { id: proposalId }
        })

        if (!proposalResult.errors && proposalResult.data?.starAtlasProposalById) {
          const proposal = proposalResult.data.starAtlasProposalById
          title = proposal.title
          pip = proposal.pipNumber
        }
      } catch (proposalError) {
        // If proposal query fails, continue with provided/default values
      }
    }

    // Use the simplified query to fetch votes by proposalId
    const votesResult = await graphqlClient.query({
      query: VOTES_BY_PROPOSAL_ID_SIMPLE_QUERY,
      variables: {
        proposalId
      }
    })

    if (votesResult.errors && votesResult.errors.length > 0) {
      throw new Error(votesResult.errors[0].message || 'Failed to fetch votes')
    }

    if (!votesResult.data) {
      throw new Error('No data returned from GraphQL query')
    }

    const data = votesResult.data as VotesByProposalIdSimpleResponse
    const votes = data.allStarAtlasProposalVotes.nodes

    // Filter to keep only the latest vote per wallet (by createdAt)
    const latestVotesByWallet = new Map<string, typeof votes[0]>()
    for (const vote of votes) {
      const existing = latestVotesByWallet.get(vote.walletPublicKey)
      if (!existing || new Date(vote.createdAt) > new Date(existing.createdAt)) {
        latestVotesByWallet.set(vote.walletPublicKey, vote)
      }
    }

    // Convert map values to array and sort by voting power descending
    const uniqueVotes = Array.from(latestVotesByWallet.values())
    const sortedVotes = [...uniqueVotes].sort((a, b) => {
      const powerA = parseFloat(a.votingPower || '0')
      const powerB = parseFloat(b.votingPower || '0')
      return powerB - powerA // Descending order
    })

    const totalVotingPower = sortedVotes.reduce((sum, vote) => {
      return sum + parseFloat(vote.votingPower || '0')
    }, 0)

    // Map the simplified vote structure to VoteNode format for compatibility
    const mappedVotes: VoteNode[] = sortedVotes.map((vote, index) => ({
      id: `${proposalId}-${vote.walletPublicKey}-${index}`,
      walletPublicKey: vote.walletPublicKey,
      createdAt: vote.createdAt,
      proposalId,
      proposalHash: '',
      voteResult: vote.voteResult,
      votingPower: vote.votingPower,
      message: '',
      signature: '',
      starAtlasProposalByProposalId: null
    }))

    return {
      proposalId,
      proposalTitle: title,
      pipNumber: pip,
      totalVotes: sortedVotes.length,
      totalVotingPower,
      votes: mappedVotes
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch vote results')
  }
}

/**
 * Interface for a proposal with all its votes
 */
export interface ProposalWithVotes {
  id: string
  status: string
  votingStartsAt: string | null
  votingEndsAt: string | null
  title: string
  pipNumber: string
  discordLink: string | null
  createdAt: string
  votes: Array<{
    voteResult: string
    votingPower: string
    walletPublicKey: string
    createdAt: string
  }>
}

/**
 * Response interface for the ALL_PIP_QUERY
 */
export interface AllPIPResponse {
  allStarAtlasProposals: {
    nodes: Array<{
      status: string
      votingStartsAt: string | null
      votingEndsAt: string | null
      title: string
      pipNumber: string
      id: string
      discordLink: string | null
      createdAt: string
      starAtlasProposalVotesByProposalId: {
        nodes: Array<{
          voteResult: string
          votingPower: string
          walletPublicKey: string
          createdAt: string
        }>
      }
    }>
  }
}

/**
 * Fetch all PIPs with their votes
 * This query runs automatically on page load to enable leaderboard views
 */
export async function fetchAllPIPs(): Promise<ProposalWithVotes[]> {
  try {
    const result = await graphqlClient.query({
      query: ALL_PIP_QUERY
    })

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message || 'Failed to fetch all PIPs')
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL query')
    }

    const data = result.data as AllPIPResponse
    
    // Transform the data to a more convenient format
    return data.allStarAtlasProposals.nodes.map(proposal => ({
      id: proposal.id,
      status: proposal.status,
      votingStartsAt: proposal.votingStartsAt,
      votingEndsAt: proposal.votingEndsAt,
      title: proposal.title,
      pipNumber: proposal.pipNumber,
      discordLink: proposal.discordLink,
      createdAt: proposal.createdAt,
      votes: proposal.starAtlasProposalVotesByProposalId.nodes.map(vote => ({
        voteResult: vote.voteResult,
        votingPower: vote.votingPower,
        walletPublicKey: vote.walletPublicKey,
        createdAt: vote.createdAt
      }))
    }))
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch all PIPs')
  }
}

/**
 * Get vote results for a specific proposal from pre-fetched data
 * This is used when we already have all PIPs loaded
 */
export function getVoteResultsFromProposal(proposal: ProposalWithVotes): ProposalVoteResults {
  // Filter to keep only the latest vote per wallet (by createdAt)
  const latestVotesByWallet = new Map<string, typeof proposal.votes[0]>()
  for (const vote of proposal.votes) {
    const existing = latestVotesByWallet.get(vote.walletPublicKey)
    if (!existing || new Date(vote.createdAt) > new Date(existing.createdAt)) {
      latestVotesByWallet.set(vote.walletPublicKey, vote)
    }
  }

  // Convert map values to array and sort by voting power descending
  const uniqueVotes = Array.from(latestVotesByWallet.values())
  const sortedVotes = [...uniqueVotes].sort((a, b) => {
    const powerA = parseFloat(a.votingPower || '0')
    const powerB = parseFloat(b.votingPower || '0')
    return powerB - powerA // Descending order
  })

  const totalVotingPower = sortedVotes.reduce((sum, vote) => {
    return sum + parseFloat(vote.votingPower || '0')
  }, 0)

  // Map the vote structure to VoteNode format for compatibility
  const mappedVotes: VoteNode[] = sortedVotes.map((vote, index) => ({
    id: `${proposal.id}-${vote.walletPublicKey}-${index}`,
    walletPublicKey: vote.walletPublicKey,
    createdAt: vote.createdAt,
    proposalId: proposal.id,
    proposalHash: '',
    voteResult: vote.voteResult,
    votingPower: vote.votingPower,
    message: '',
    signature: '',
    starAtlasProposalByProposalId: {
      id: proposal.id,
      title: proposal.title,
      pipNumber: proposal.pipNumber
    }
  }))

  return {
    proposalId: proposal.id,
    proposalTitle: proposal.title,
    pipNumber: proposal.pipNumber,
    totalVotes: sortedVotes.length,
    totalVotingPower,
    votes: mappedVotes
  }
}

