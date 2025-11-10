import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchVotesByWallet, type VoteNode } from '../services/votesService'
import { fetchAllPIPs, type ProposalWithVotes, getVoteResultsFromProposal } from '../services/voteResultsService'

export const useVotesStore = defineStore('votes', () => {
  const votes = ref<VoteNode[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const lastFetchedWallet = ref<string>('')
  
  // Store all PIPs with votes (fetched on initialization)
  const allPIPs = ref<ProposalWithVotes[]>([])
  const allPIPsLoading = ref<boolean>(false)
  const allPIPsError = ref<string | null>(null)

  const totalCount = computed(() => votes.value.length)

  const totalVotingPower = computed(() => {
    return votes.value.reduce((sum, vote) => {
      return sum + parseFloat(vote.votingPower || '0')
    }, 0)
  })

  /**
   * Fetch all PIPs with votes - runs automatically on page load
   * This enables leaderboard views without requiring a wallet
   */
  async function fetchAllPIPsData() {
    allPIPsLoading.value = true
    allPIPsError.value = null

    try {
      allPIPs.value = await fetchAllPIPs()
    } catch (err) {
      allPIPsError.value = err instanceof Error ? err.message : 'Failed to fetch all PIPs'
      allPIPs.value = []
    } finally {
      allPIPsLoading.value = false
    }
  }

  /**
   * Get vote results for a specific proposal from pre-fetched data
   */
  function getProposalVoteResults(proposalId: string) {
    const proposal = allPIPs.value.find(p => p.id === proposalId)
    if (!proposal) {
      return null
    }
    return getVoteResultsFromProposal(proposal)
  }

  /**
   * Get a proposal by ID from pre-fetched data
   */
  function getProposalById(proposalId: string): ProposalWithVotes | null {
    return allPIPs.value.find(p => p.id === proposalId) || null
  }

  async function fetchVotes(wallet: string) {
    if (!wallet || wallet.trim() === '') {
      error.value = 'Wallet address is required'
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetchVotesByWallet(wallet)
      votes.value = response.allStarAtlasProposalVotes.nodes
      lastFetchedWallet.value = wallet
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch votes'
      votes.value = []
    } finally {
      loading.value = false
    }
  }

  function clearVotes() {
    votes.value = []
    error.value = null
    lastFetchedWallet.value = ''
  }

  return {
    votes,
    loading,
    error,
    lastFetchedWallet,
    totalCount,
    totalVotingPower,
    fetchVotes,
    clearVotes,
    // All PIPs data
    allPIPs,
    allPIPsLoading,
    allPIPsError,
    fetchAllPIPsData,
    getProposalVoteResults,
    getProposalById
  }
})

