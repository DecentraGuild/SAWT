<template>
  <div class="page-container">
    <h1>Votes</h1>

    <div v-if="!walletStore.address" class="info-message">
      Please enter a wallet address in the top navigation bar to view votes.
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading" class="loading-message">
      Fetching votes...
    </div>

    <div v-if="!loading && votes.length > 0" class="votes-content">
      <div class="votes-summary">
        <div class="summary-item">
          <span class="summary-label">Latest PVP:</span>
          <span class="summary-value">{{ formatVotingPower(latestPVP) }} PVP</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Unique PIPs:</span>
          <span class="summary-value">{{ uniquePipCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Average Voting Power:</span>
          <span class="summary-value">{{ formatVotingPower(averageVotingPower) }} PVP</span>
        </div>
      </div>

      <DataTable
        title="Voting History"
        :columns="tableColumns"
        :data="tableData"
        :show-summary="false"
        @row-click="handleRowClick"
      />
    </div>

    <div v-if="!loading && votes.length === 0 && walletStore.address && lastFetchedWallet" class="empty-message">
      No votes found for this wallet address.
    </div>

    <VoteDetailsModal
      :is-open="showDetailsModal"
      :proposal-id="selectedProposalId"
      :proposal-title="selectedProposalTitle"
      :pip-number="selectedPipNumber"
      @close="closeDetailsModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useVotesStore } from '../stores/votes'
import { useWalletStore } from '../stores/wallet'
import DataTable, { type TableColumn } from '../components/DataTable.vue'
import VoteDetailsModal from '../components/VoteDetailsModal.vue'
import { formatVoteResult, formatDate, formatVotingPower } from '../utils/formatters'

const votesStore = useVotesStore()
const walletStore = useWalletStore()

const votes = computed(() => votesStore.votes)
const loading = computed(() => votesStore.loading)
const error = computed(() => votesStore.error)
const totalCount = computed(() => votesStore.totalCount)
const totalVotingPower = computed(() => votesStore.totalVotingPower)

// Get latest PVP (most recent vote's voting power)
const latestPVP = computed(() => {
  if (votes.value.length === 0) return 0
  // Votes are already sorted by createdAt DESC from the query
  const latestVote = votes.value[0]
  return parseFloat(latestVote.votingPower || '0')
})

// Count unique PIPs (proposal IDs)
const uniquePipCount = computed(() => {
  const uniqueProposals = new Set<string>()
  votes.value.forEach(vote => {
    if (vote.proposalId) {
      uniqueProposals.add(vote.proposalId)
    }
  })
  return uniqueProposals.size
})

const averageVotingPower = computed(() => {
  if (votes.value.length === 0) return 0
  return totalVotingPower.value / votes.value.length
})
const lastFetchedWallet = computed(() => votesStore.lastFetchedWallet)

const showDetailsModal = ref(false)
const selectedProposalId = ref<string | null>(null)
const selectedProposalTitle = ref('')
const selectedPipNumber = ref('')

// Watch for wallet changes and automatically fetch votes
watch(() => walletStore.address, async (newAddress) => {
  if (newAddress && newAddress.trim()) {
    await votesStore.fetchVotes(newAddress.trim())
  } else {
    votesStore.clearVotes()
  }
}, { immediate: true })

const tableColumns: TableColumn[] = [
  { key: 'pipNumber', label: 'PIP', format: 'text' },
  { key: 'title', label: 'Proposal Title', format: 'text' },
  { key: 'voteResult', label: 'Vote', format: 'text' },
  { key: 'votingPower', label: 'Voting Power (PVP)', format: 'number' },
  { key: 'createdAt', label: 'Date', format: 'text' },
  { key: 'proposalHash', label: 'Hash', format: 'text', class: 'hash-cell' }
]

const tableData = computed(() => {
  return votes.value.map(vote => ({
    pipNumber: vote.starAtlasProposalByProposalId?.pipNumber || 'N/A',
    title: vote.starAtlasProposalByProposalId?.title || 'Unknown Proposal',
    voteResult: formatVoteResult(vote.voteResult),
    votingPower: parseFloat(vote.votingPower || '0'),
    createdAt: formatDate(vote.createdAt),
    proposalHash: vote.proposalHash || 'N/A'
  }))
})

function handleRowClick(row: any) {
  // Find the vote that corresponds to this row
  const vote = votes.value.find(v => v.proposalHash === row.proposalHash)
  if (vote && vote.proposalId) {
    selectedProposalId.value = vote.proposalId
    selectedProposalTitle.value = vote.starAtlasProposalByProposalId?.title || 'Unknown Proposal'
    selectedPipNumber.value = vote.starAtlasProposalByProposalId?.pipNumber || ''
    showDetailsModal.value = true
  }
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedProposalId.value = null
  selectedProposalTitle.value = ''
  selectedPipNumber.value = ''
}
</script>

<style scoped>
.page-container {
  padding: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

.info-message {
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.error-message {
  padding: var(--spacing-md);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: #ef4444;
  margin-bottom: var(--spacing-md);
}

.loading-message {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.votes-content {
  margin-top: var(--spacing-lg);
}

.votes-summary {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.summary-value {
  font-size: var(--font-size-xl);
  color: var(--color-accent-teal);
  font-weight: 600;
}

.empty-message {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.hash-cell {
  font-family: monospace;
  font-size: var(--font-size-sm);
}
</style>
