<template>
  <div class="page-container">
    <h1>Votes</h1>

    <!-- All PIPs Leaderboard View (available without wallet) -->
    <div v-if="allPIPsLoading" class="loading-message">
      Loading all proposals...
    </div>

    <div v-if="allPIPsError" class="error-message">
      Error loading proposals: {{ allPIPsError }}
    </div>

    <div v-if="!allPIPsLoading && allPIPs.length > 0" class="all-pips-section">
      <h2>All Proposals</h2>
      <p class="section-description">
        Click on any proposal to view its vote leaderboard and results.
      </p>
      <DataTable
        title="Proposals"
        :columns="proposalsTableColumns"
        :data="proposalsTableData"
        :show-summary="false"
        :get-row-class="getProposalRowClass"
        @row-click="handleProposalClick"
      >
        <template #cell-status="{ value, row }">
          <span class="status-badge" :class="getStatusClass(value)">
            {{ value }}
          </span>
        </template>
        <template #cell-voteResults="{ value, row }">
          <div class="vote-results-cell">
            <div v-if="row.totalVotingPower > 0" class="vote-results-compact">
              <div class="vote-results-bar">
                <div 
                  v-if="row.yesPvp > 0"
                  class="vote-bar-segment vote-bar-yes" 
                  :style="{ width: `${row.yesPercentage}%` }"
                  :title="`Yes: ${formatVotingPower(row.yesPvp)} PVP (${row.yesCount} votes)`"
                >
                  <span v-if="row.yesPercentage > 10" class="bar-percentage">{{ row.yesPercentage.toFixed(0) }}%</span>
                </div>
                <div 
                  v-if="row.noPvp > 0"
                  class="vote-bar-segment vote-bar-no" 
                  :style="{ width: `${row.noPercentage}%` }"
                  :title="`No: ${formatVotingPower(row.noPvp)} PVP (${row.noCount} votes)`"
                >
                  <span v-if="row.noPercentage > 10" class="bar-percentage">{{ row.noPercentage.toFixed(0) }}%</span>
                </div>
              </div>
            </div>
            <div v-else class="vote-results-empty">
              No votes
            </div>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Wallet-specific votes section -->
    <div v-if="walletStore.address" class="wallet-votes-section">
      <h2>Your Votes</h2>
      
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
    </div>

    <div v-if="!walletStore.address" class="info-message">
      Enter a wallet address in the top navigation bar to view your personal voting history.
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
import { computed, watch, ref, onMounted } from 'vue'
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

// All PIPs data
const allPIPs = computed(() => votesStore.allPIPs)
const allPIPsLoading = computed(() => votesStore.allPIPsLoading)
const allPIPsError = computed(() => votesStore.allPIPsError)

// Fetch all PIPs on component mount
onMounted(async () => {
  if (allPIPs.value.length === 0 && !allPIPsLoading.value) {
    await votesStore.fetchAllPIPsData()
  }
})

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

// Format status to simplified version
function formatStatus(status: string, votingEndsAt: string | null): string {
  if (!status) return 'Unknown'
  
  const statusLower = status.toLowerCase()
  const now = new Date()
  const endDate = votingEndsAt ? new Date(votingEndsAt) : null
  
  // Check if voting is still active
  if (endDate && endDate > now) {
    return 'Active'
  }
  
  // Check status for passed/failed
  if (statusLower.includes('pass') || statusLower.includes('approved')) {
    return 'Passed'
  }
  if (statusLower.includes('fail') || statusLower.includes('rejected') || statusLower.includes('reject')) {
    return 'Failed'
  }
  if (statusLower.includes('active') || statusLower.includes('voting')) {
    return 'Active'
  }
  
  return 'Unknown'
}

// Check if voting is active
function isVotingActive(votingEndsAt: string | null): boolean {
  if (!votingEndsAt) return false
  const endDate = new Date(votingEndsAt)
  const now = new Date()
  return endDate > now
}

const proposalsTableColumns: TableColumn[] = [
  { key: 'pipNumber', label: 'PIP', format: 'text' },
  { key: 'title', label: 'Proposal Title', format: 'text' },
  { key: 'status', label: 'Status', format: 'text' },
  { key: 'voteResults', label: 'Results', format: 'text' },
  { key: 'totalVotes', label: 'Total Votes', format: 'number' },
  { key: 'totalVotingPower', label: 'Total Voting Power (PVP)', format: 'number' },
  { key: 'votingEndsAt', label: 'Voting Ends', format: 'text' }
]

const proposalsTableData = computed(() => {
  return allPIPs.value.map(proposal => {
    // Calculate vote statistics
    const latestVotesByWallet = new Map<string, typeof proposal.votes[0]>()
    for (const vote of proposal.votes) {
      const existing = latestVotesByWallet.get(vote.walletPublicKey)
      if (!existing || new Date(vote.createdAt) > new Date(existing.createdAt)) {
        latestVotesByWallet.set(vote.walletPublicKey, vote)
      }
    }
    const uniqueVotes = Array.from(latestVotesByWallet.values())
    const totalVotingPower = uniqueVotes.reduce((sum, vote) => {
      return sum + parseFloat(vote.votingPower || '0')
    }, 0)

    // Calculate Yes/No breakdown
    let yesPvp = 0
    let noPvp = 0
    let yesCount = 0
    let noCount = 0

    for (const vote of uniqueVotes) {
      const power = parseFloat(vote.votingPower || '0')
      const result = (vote.voteResult || '').toLowerCase()
      
      if (result === 'yes') {
        yesPvp += power
        yesCount++
      } else if (result === 'no') {
        noPvp += power
        noCount++
      }
    }

    const totalPvp = yesPvp + noPvp
    const yesPercentage = totalPvp > 0 ? (yesPvp / totalPvp) * 100 : 0
    const noPercentage = totalPvp > 0 ? (noPvp / totalPvp) * 100 : 0

    const isActive = isVotingActive(proposal.votingEndsAt)
    const formattedStatus = formatStatus(proposal.status || '', proposal.votingEndsAt)

    return {
      pipNumber: proposal.pipNumber,
      title: proposal.title,
      status: formattedStatus,
      voteResults: '', // Not used, we use the slot instead
      yesPvp,
      noPvp,
      yesPercentage,
      noPercentage,
      yesCount,
      noCount,
      totalVotes: uniqueVotes.length,
      totalVotingPower,
      votingEndsAt: proposal.votingEndsAt ? formatDate(proposal.votingEndsAt) : 'N/A',
      proposalId: proposal.id,
      isActive
    }
  })
})

function getStatusClass(status: string): string {
  const statusLower = status.toLowerCase()
  if (statusLower === 'passed') return 'status-passed'
  if (statusLower === 'failed') return 'status-failed'
  if (statusLower === 'active') return 'status-active'
  return 'status-unknown'
}

// Check if wallet has voted on a proposal
function hasWalletVoted(proposalId: string): boolean {
  if (!walletStore.address) return false
  const walletAddress = walletStore.address.toLowerCase()
  
  // First check votes store (wallet-specific votes)
  const hasVotedInStore = votes.value.some(vote => 
    vote.proposalId === proposalId && 
    vote.walletPublicKey.toLowerCase() === walletAddress
  )
  
  if (hasVotedInStore) return true
  
  // Also check allPIPs data (all proposals with votes)
  const proposal = allPIPs.value.find(p => p.id === proposalId)
  if (proposal) {
    return proposal.votes.some(vote => 
      vote.walletPublicKey.toLowerCase() === walletAddress
    )
  }
  
  return false
}

// Get row class for proposal table - add gold border if wallet voted
function getProposalRowClass(row: any): string {
  if (hasWalletVoted(row.proposalId)) {
    return 'wallet-voted-row'
  }
  return ''
}

function handleProposalClick(row: any) {
  if (row.proposalId) {
    selectedProposalId.value = row.proposalId
    selectedProposalTitle.value = row.title || 'Unknown Proposal'
    selectedPipNumber.value = row.pipNumber || ''
    showDetailsModal.value = true
  }
}

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

.all-pips-section {
  margin-bottom: var(--spacing-xl);
}

.section-description {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.wallet-votes-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 2px solid var(--color-border);
}

/* Status badge styles */
.status-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.status-passed {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.status-failed {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge.status-active {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.status-unknown {
  background-color: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

/* Vote results cell styles */
.vote-results-cell {
  min-width: 150px;
  max-width: 200px;
}

.vote-results-compact {
  width: 100%;
}

.vote-results-bar {
  display: flex;
  height: 24px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
  position: relative;
}

.vote-bar-segment {
  height: 100%;
  transition: width 0.3s ease;
  cursor: help;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.vote-bar-segment.vote-bar-yes {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.6) 100%);
  border-right: 1px solid var(--color-border);
}

.vote-bar-segment.vote-bar-no {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.6) 100%);
}

.bar-percentage {
  color: white;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.vote-results-empty {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: var(--font-size-sm);
  text-align: center;
}

</style>
