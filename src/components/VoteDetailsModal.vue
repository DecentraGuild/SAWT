<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Vote Results: {{ proposalTitle }}</h2>
        <button class="close-button" @click="close">×</button>
      </div>

      <div v-if="loading" class="loading-message">
        Loading vote results...
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="!loading && !error && results" class="vote-results">
        <div class="results-summary">
          <div class="summary-item">
            <span class="summary-label">Status:</span>
            <span class="summary-value" :class="statusClass">{{ proposalStatus }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Votes:</span>
            <span class="summary-value">{{ results.totalVotes }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Voting Power:</span>
            <span class="summary-value">{{ formatVotingPower(results.totalVotingPower) }} PVP</span>
          </div>
        </div>

        <!-- Compact Results for Active Voting -->
        <div v-if="voteBreakdown && isVotingActive" class="compact-results">
          <div class="compact-results-header">
            <h3 class="compact-title">Current Vote Results</h3>
            <div class="voting-active-badge">
              <span class="voting-active-indicator"></span>
              Voting Active
            </div>
          </div>
          <div class="compact-results-content">
            <div class="compact-bar-container">
              <div class="compact-bar">
                <div 
                  v-if="voteBreakdown.yes.pvp > 0"
                  class="compact-bar-segment compact-bar-yes" 
                  :style="{ width: `${voteBreakdown.yes.percentage}%` }"
                >
                  <div class="compact-bar-label">{{ formatNumberOptimized(voteBreakdown.yes.percentage) }}%</div>
                </div>
                <div 
                  v-if="voteBreakdown.no.pvp > 0"
                  class="compact-bar-segment compact-bar-no" 
                  :style="{ width: `${voteBreakdown.no.percentage}%` }"
                >
                  <div class="compact-bar-label">{{ formatNumberOptimized(voteBreakdown.no.percentage) }}%</div>
                </div>
              </div>
            </div>
            <div class="compact-stats">
              <div class="compact-stat-item">
                <span class="compact-stat-label">Yes:</span>
                <span class="compact-stat-value">{{ formatVotingPower(voteBreakdown.yes.pvp) }} PVP</span>
                <span class="compact-stat-count">({{ voteBreakdown.yes.count }})</span>
              </div>
              <div class="compact-stat-item">
                <span class="compact-stat-label">No:</span>
                <span class="compact-stat-value">{{ formatVotingPower(voteBreakdown.no.pvp) }} PVP</span>
                <span class="compact-stat-count">({{ voteBreakdown.no.count }})</span>
              </div>
            </div>
            <div v-if="votingEndsAt" class="voting-ends-info">
              Voting ends: {{ formatDate(votingEndsAt) }}
            </div>
          </div>
        </div>

        <!-- Final Results Breakdown - Only show for finalized proposals -->
        <div v-if="voteBreakdown && isFinalized" class="final-results">
          <h3 class="final-results-title">Final Results</h3>
          <div class="winner-badge" :class="winnerClass">
            <span class="winner-label">{{ winnerText }}</span>
            <span class="winner-margin">{{ winnerMarginText }}</span>
          </div>
          
          <div class="results-bar-container">
            <div class="results-bar">
              <div 
                v-if="voteBreakdown.yes.pvp > 0"
                class="bar-segment bar-yes" 
                :style="{ width: `${voteBreakdown.yes.percentage}%` }"
              >
                <div class="bar-label-top">{{ formatNumberOptimized(voteBreakdown.yes.percentage) }}%</div>
                <div class="bar-label-bottom">{{ formatVotingPower(voteBreakdown.yes.pvp) }} PVP</div>
              </div>
              <div 
                v-if="voteBreakdown.no.pvp > 0"
                class="bar-segment bar-no" 
                :style="{ width: `${voteBreakdown.no.percentage}%` }"
              >
                <div class="bar-label-top">{{ formatNumberOptimized(voteBreakdown.no.percentage) }}%</div>
                <div class="bar-label-bottom">{{ formatVotingPower(voteBreakdown.no.pvp) }} PVP</div>
              </div>
            </div>
          </div>

          <div class="results-details">
            <div class="result-detail-item result-yes">
              <span class="result-detail-label">Yes:</span>
              <span class="result-detail-value">{{ formatVotingPower(voteBreakdown.yes.pvp) }} PVP</span>
              <span class="result-detail-count">({{ voteBreakdown.yes.count }} votes)</span>
            </div>
            <div class="result-detail-item result-no">
              <span class="result-detail-label">No:</span>
              <span class="result-detail-value">{{ formatVotingPower(voteBreakdown.no.pvp) }} PVP</span>
              <span class="result-detail-count">({{ voteBreakdown.no.count }} votes)</span>
            </div>
          </div>
        </div>

        <div class="leaderboard-controls">
          <h3>Vote Leaderboard</h3>
          <div class="view-toggle">
            <label class="toggle-label">
              <input
                type="checkbox"
                v-model="isGroupedView"
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              <span class="toggle-text">{{ isGroupedView ? 'Grouped' : 'Combined' }}</span>
            </label>
          </div>
        </div>

        <!-- Combined View -->
        <div v-if="!isGroupedView" class="leaderboard">
          <div class="leaderboard-list" ref="combinedListRef">
            <div
              v-for="(vote, index) in results.votes"
              :key="vote.id"
              :ref="el => setCombinedItemRef(el, vote.walletPublicKey)"
              class="leaderboard-item"
              :class="[
                getVoteClass(vote.voteResult),
                { 'wallet-highlight': isCurrentWallet(vote.walletPublicKey) }
              ]"
            >
              <div class="rank">#{{ index + 1 }}</div>
              <div class="vote-info">
                <div class="vote-wallet-container">
                  <span class="vote-wallet">{{ formatWallet(vote.walletPublicKey) }}</span>
                  <BaseCopyButton
                    :text-to-copy="vote.walletPublicKey"
                    size="small"
                    tooltip="Copy wallet address"
                  />
                </div>
                <div class="vote-meta">
                  <span class="vote-result" :class="getVoteResultClass(vote.voteResult)">
                    {{ formatVoteResultFull(vote.voteResult) }}
                  </span>
                  <span>•</span>
                  <span>{{ formatDate(vote.createdAt) }}</span>
                </div>
              </div>
              <div class="vote-power">
                {{ formatVotingPower(parseFloat(vote.votingPower || '0')) }} PVP
              </div>
            </div>
          </div>
        </div>

        <!-- Grouped View -->
        <div v-else class="grouped-leaderboard">
          <div
            v-for="group in groupedVotes"
            :key="group.voteResult"
            class="vote-group"
          >
            <h4 class="group-header">
              {{ formatVoteResultFull(group.voteResult) }}
              <span class="group-count">({{ group.votes.length }})</span>
            </h4>
            <div class="leaderboard-list" :ref="el => setGroupListRef(el, group.voteResult)">
              <div
                v-for="(vote, index) in group.votes"
                :key="vote.id"
                :ref="el => setGroupItemRef(el, group.voteResult, vote.walletPublicKey)"
                class="leaderboard-item"
                :class="[
                  getVoteClass(vote.voteResult),
                  { 'wallet-highlight': isCurrentWallet(vote.walletPublicKey) }
                ]"
              >
                <div class="rank">#{{ index + 1 }}</div>
                <div class="vote-info">
                  <div class="vote-wallet-container">
                    <span class="vote-wallet">{{ formatWallet(vote.walletPublicKey) }}</span>
                    <BaseCopyButton
                      :text-to-copy="vote.walletPublicKey"
                      size="small"
                      tooltip="Copy wallet address"
                    />
                  </div>
                  <div class="vote-meta">
                    <span class="vote-result" :class="getVoteResultClass(vote.voteResult)">
                      {{ formatVoteResult(vote.voteResult) }}
                    </span>
                    <span>•</span>
                    <span>{{ formatDate(vote.createdAt) }}</span>
                  </div>
                </div>
                <div class="vote-power">
                  {{ formatVotingPower(parseFloat(vote.votingPower || '0')) }} PVP
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { fetchVoteResultsByProposal, type ProposalVoteResults } from '../services/voteResultsService'
import { formatVotingPower, formatVoteResult, formatVoteResultFull, formatWallet, formatDate, formatNumberOptimized } from '../utils/formatters'
import { useWalletStore } from '../stores/wallet'
import { useVotesStore } from '../stores/votes'
import type { VoteNode } from '../services/votesService'
import BaseCopyButton from './BaseCopyButton.vue'

interface Props {
  isOpen: boolean
  proposalId: string | null
  proposalTitle: string
  pipNumber?: string
}

const props = defineProps<Props>()
const walletStore = useWalletStore()
const votesStore = useVotesStore()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const results = ref<ProposalVoteResults | null>(null)
const isGroupedView = ref(false)
const combinedListRef = ref<HTMLElement | null>(null)
const combinedItemRefs = ref<Map<string, HTMLElement>>(new Map())
const groupListRefs = ref<Map<string, HTMLElement>>(new Map())
const groupItemRefs = ref<Map<string, Map<string, HTMLElement>>>(new Map())

// Get proposal data from pre-fetched data
const proposalData = computed(() => {
  if (!props.proposalId) return null
  return votesStore.getProposalById(props.proposalId)
})

// Get proposal status from pre-fetched data
const proposalStatus = computed(() => {
  return proposalData.value?.status || 'Unknown'
})

const statusClass = computed(() => {
  const status = proposalStatus.value.toLowerCase()
  if (status === 'passed' || status === 'approved') return 'status-passed'
  if (status === 'rejected' || status === 'failed') return 'status-rejected'
  if (status === 'active' || status === 'voting') return 'status-active'
  return 'status-unknown'
})

// Get voting end date
const votingEndsAt = computed(() => {
  return proposalData.value?.votingEndsAt || null
})

// Check if voting is still active (votingEndsAt is in the future)
const isVotingActive = computed(() => {
  if (!votingEndsAt.value) {
    // If no end date, check status
    const status = proposalStatus.value.toLowerCase()
    return status === 'active' || status === 'voting'
  }
  const endDate = new Date(votingEndsAt.value)
  const now = new Date()
  return endDate > now
})

// Check if proposal is finalized (not active/voting)
const isFinalized = computed(() => {
  return !isVotingActive.value
})

// Calculate vote breakdown (Yes vs No)
const voteBreakdown = computed(() => {
  if (!results.value || results.value.votes.length === 0) return null

  let yesPvp = 0
  let noPvp = 0
  let yesCount = 0
  let noCount = 0

  for (const vote of results.value.votes) {
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

  return {
    yes: {
      pvp: yesPvp,
      count: yesCount,
      percentage: yesPercentage
    },
    no: {
      pvp: noPvp,
      count: noCount,
      percentage: noPercentage
    },
    totalPvp
  }
})

// Determine winner
const winnerText = computed(() => {
  if (!voteBreakdown.value) return ''
  
  if (voteBreakdown.value.yes.pvp > voteBreakdown.value.no.pvp) {
    return 'Yes Won'
  } else if (voteBreakdown.value.no.pvp > voteBreakdown.value.yes.pvp) {
    return 'No Won'
  } else {
    return 'Tie'
  }
})

const winnerClass = computed(() => {
  if (!voteBreakdown.value) return ''
  
  if (voteBreakdown.value.yes.pvp > voteBreakdown.value.no.pvp) {
    return 'winner-yes'
  } else if (voteBreakdown.value.no.pvp > voteBreakdown.value.yes.pvp) {
    return 'winner-no'
  } else {
    return 'winner-tie'
  }
})

const winnerMarginText = computed(() => {
  if (!voteBreakdown.value) return ''
  
  const margin = Math.abs(voteBreakdown.value.yes.pvp - voteBreakdown.value.no.pvp)
  if (margin === 0) return 'Tied'
  return `by ${formatVotingPower(margin)} PVP`
})

// Group votes by vote result
const groupedVotes = computed(() => {
  if (!results.value) return []
  
  const groups = new Map<string, VoteNode[]>()
  for (const vote of results.value.votes) {
    const result = vote.voteResult || 'Unknown'
    if (!groups.has(result)) {
      groups.set(result, [])
    }
    groups.get(result)!.push(vote)
  }
  
  // Sort each group by voting power descending
  const sortedGroups = Array.from(groups.entries()).map(([voteResult, votes]) => ({
    voteResult,
    votes: [...votes].sort((a, b) => {
      const powerA = parseFloat(a.votingPower || '0')
      const powerB = parseFloat(b.votingPower || '0')
      return powerB - powerA
    })
  }))
  
  // Sort groups by total voting power descending
  return sortedGroups.sort((a, b) => {
    const totalA = a.votes.reduce((sum, v) => sum + parseFloat(v.votingPower || '0'), 0)
    const totalB = b.votes.reduce((sum, v) => sum + parseFloat(v.votingPower || '0'), 0)
    return totalB - totalA
  })
})

watch(() => props.isOpen, async (newValue) => {
  if (newValue && props.proposalId) {
    await loadResults()
    await nextTick()
    scrollToWallet()
  } else {
    results.value = null
    error.value = null
    combinedItemRefs.value.clear()
    groupListRefs.value.clear()
    groupItemRefs.value.clear()
  }
})

watch(isGroupedView, async () => {
  await nextTick()
  scrollToWallet()
})

async function loadResults() {
  if (!props.proposalId) return

  loading.value = true
  error.value = null

  try {
    // First try to get results from pre-fetched data
    const preFetchedResults = votesStore.getProposalVoteResults(props.proposalId)
    
    if (preFetchedResults) {
      // Use pre-fetched data (instant, no network call)
      results.value = preFetchedResults
      loading.value = false
    } else {
      // Fallback to fetching if not in pre-fetched data (shouldn't happen normally)
      results.value = await fetchVoteResultsByProposal(
        props.proposalId,
        props.proposalTitle,
        props.pipNumber
      )
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load vote results'
  } finally {
    loading.value = false
  }
}

function close() {
  emit('close')
}

function getVoteClass(voteResult: string): string {
  if (!voteResult) return ''
  const lower = voteResult.toLowerCase()
  if (lower === 'yes') return 'vote-yes'
  if (lower === 'no') return 'vote-no'
  return ''
}

function getVoteResultClass(voteResult: string): string {
  if (!voteResult) return ''
  const lower = voteResult.toLowerCase()
  if (lower === 'yes') return 'result-yes'
  if (lower === 'no') return 'result-no'
  return ''
}

function isCurrentWallet(walletPublicKey: string): boolean {
  return walletStore.address.toLowerCase() === walletPublicKey.toLowerCase()
}

function setCombinedItemRef(el: any, walletPublicKey: string) {
  if (el && isCurrentWallet(walletPublicKey)) {
    combinedItemRefs.value.set(walletPublicKey.toLowerCase(), el)
  }
}

function setGroupListRef(el: any, voteResult: string) {
  if (el) {
    groupListRefs.value.set(voteResult, el)
  }
}

function setGroupItemRef(el: any, voteResult: string, walletPublicKey: string) {
  if (el && isCurrentWallet(walletPublicKey)) {
    if (!groupItemRefs.value.has(voteResult)) {
      groupItemRefs.value.set(voteResult, new Map())
    }
    groupItemRefs.value.get(voteResult)!.set(walletPublicKey.toLowerCase(), el)
  }
}

function scrollToWallet() {
  if (!walletStore.address) return
  
  const walletAddress = walletStore.address.toLowerCase()
  
  // Use setTimeout to ensure DOM is fully rendered
  setTimeout(() => {
    if (isGroupedView.value) {
      // Find the wallet in grouped view
      for (const [voteResult, itemMap] of groupItemRefs.value.entries()) {
        const item = itemMap.get(walletAddress)
        if (item) {
          item.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return
        }
      }
    } else {
      // Find the wallet in combined view
      const item = combinedItemRefs.value.get(walletAddress)
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, 100)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal-content {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.close-button:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.loading-message,
.error-message {
  padding: var(--spacing-lg);
  text-align: center;
}

.error-message {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  margin: var(--spacing-lg);
}

.vote-results {
  padding: var(--spacing-sm);
}

.results-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.final-results {
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.final-results-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 600;
}

.winner-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  border-radius: var(--radius-md);
  font-weight: 600;
}

.winner-badge.winner-yes {
  background-color: rgba(16, 185, 129, 0.15);
  border: 2px solid #10b981;
  color: #10b981;
}

.winner-badge.winner-no {
  background-color: rgba(239, 68, 68, 0.15);
  border: 2px solid #ef4444;
  color: #ef4444;
}

.winner-badge.winner-tie {
  background-color: rgba(156, 163, 175, 0.15);
  border: 2px solid #9ca3af;
  color: #9ca3af;
}

.winner-label {
  font-size: var(--font-size-base);
  font-weight: 700;
}

.winner-margin {
  font-size: var(--font-size-sm);
  font-weight: 500;
  opacity: 0.9;
}

.results-bar-container {
  margin-bottom: var(--spacing-xs);
}

.results-bar {
  display: flex;
  height: 50px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--color-border);
  background-color: var(--color-bg-primary);
}

.bar-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  min-width: 0;
  transition: width 0.3s ease;
}

.bar-segment.bar-yes {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.6) 100%);
  border-right: 2px solid var(--color-border);
}

.bar-segment.bar-no {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.6) 100%);
}

.bar-label-top {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  margin-bottom: 2px;
}

.bar-label-bottom {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.results-details {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: space-around;
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--color-border);
}

.result-detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
}

.result-detail-item.result-yes {
  background-color: rgba(16, 185, 129, 0.05);
}

.result-detail-item.result-no {
  background-color: rgba(239, 68, 68, 0.05);
}

.result-detail-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-detail-value {
  font-size: var(--font-size-base);
  font-weight: 700;
}

.result-detail-item.result-yes .result-detail-value {
  color: #10b981;
}

.result-detail-item.result-no .result-detail-value {
  color: #ef4444;
}

.result-detail-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
  text-align: center;
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

.summary-value.status-passed {
  color: #10b981;
}

.summary-value.status-rejected {
  color: #ef4444;
}

.summary-value.status-active {
  color: #3b82f6;
}

.summary-value.status-unknown {
  color: var(--color-text-secondary);
}

/* Compact Results Styles for Active Voting */
.compact-results {
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  border-left: 4px solid #3b82f6;
}

.compact-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.compact-title {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 600;
}

.voting-active-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid #3b82f6;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: #3b82f6;
  font-weight: 600;
}

.voting-active-indicator {
  width: 8px;
  height: 8px;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.compact-results-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.compact-bar-container {
  margin-bottom: var(--spacing-xs);
}

.compact-bar {
  display: flex;
  height: 40px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-primary);
}

.compact-bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-width: 0;
  transition: width 0.3s ease;
}

.compact-bar-segment.compact-bar-yes {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.7) 0%, rgba(16, 185, 129, 0.5) 100%);
  border-right: 1px solid var(--color-border);
}

.compact-bar-segment.compact-bar-no {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.7) 0%, rgba(239, 68, 68, 0.5) 100%);
}

.compact-bar-label {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.compact-stats {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: space-around;
  padding: var(--spacing-xs);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-sm);
}

.compact-stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
}

.compact-stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.compact-stat-value {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.compact-stat-item:first-child .compact-stat-value {
  color: #10b981;
}

.compact-stat-item:last-child .compact-stat-value {
  color: #ef4444;
}

.compact-stat-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.voting-ends-info {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs);
  font-style: italic;
}

.leaderboard-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.leaderboard-controls h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.view-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  transition: background-color var(--transition-base);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 2px;
  top: 2px;
  background-color: var(--color-text-secondary);
  border-radius: 50%;
  transition: transform var(--transition-base);
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--color-accent-teal);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(26px);
}

.toggle-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.leaderboard h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  min-width: 0;
  overflow: hidden;
}

.leaderboard-item:hover {
  transform: translateX(4px);
}

.leaderboard-item.vote-yes {
  border-left: 4px solid #10b981;
  background-color: rgba(16, 185, 129, 0.05);
}

.leaderboard-item.vote-yes:hover {
  border-color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

.leaderboard-item.vote-no {
  border-left: 4px solid #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.leaderboard-item.vote-no:hover {
  border-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.leaderboard-item.wallet-highlight {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.25) 100%);
  border: 2px solid #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.leaderboard-item.wallet-highlight .vote-wallet {
  color: #ffd700;
  font-weight: 700;
}

.leaderboard-item.wallet-highlight .rank {
  color: #ffd700;
}

.grouped-leaderboard {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.vote-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.group-header {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: 600;
  padding-bottom: var(--spacing-xs);
  border-bottom: 2px solid var(--color-border);
}

.group-count {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: 400;
}

.rank {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-secondary);
  min-width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.vote-info {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
  overflow: hidden;
}

.vote-wallet-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  white-space: nowrap;
  min-width: 0;
  flex: 0 1 auto;
}

.vote-wallet {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.vote-meta {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}

.vote-result {
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

.result-yes {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

.result-no {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.vote-power {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-accent-teal);
  min-width: 100px;
  text-align: right;
  flex-shrink: 0;
}
</style>


