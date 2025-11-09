import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchVotesByWallet, type VoteNode } from '../services/votesService'

export const useVotesStore = defineStore('votes', () => {
  const votes = ref<VoteNode[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const lastFetchedWallet = ref<string>('')

  const totalCount = computed(() => votes.value.length)

  const totalVotingPower = computed(() => {
    return votes.value.reduce((sum, vote) => {
      return sum + parseFloat(vote.votingPower || '0')
    }, 0)
  })

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
    clearVotes
  }
})

