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
            <span class="summary-label">Total Votes:</span>
            <span class="summary-value">{{ results.totalVotes }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Voting Power:</span>
            <span class="summary-value">{{ formatVotingPower(results.totalVotingPower) }} PVP</span>
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
import { formatVotingPower, formatVoteResult, formatVoteResultFull, formatWallet, formatDate } from '../utils/formatters'
import { useWalletStore } from '../stores/wallet'
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
    results.value = await fetchVoteResultsByProposal(
      props.proposalId,
      props.proposalTitle,
      props.pipNumber
    )
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
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
  padding: var(--spacing-lg);
}

.results-summary {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
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

.leaderboard-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
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
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 60vh;
  overflow-y: auto;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
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
  gap: var(--spacing-xl);
}

.vote-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.group-header {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: 600;
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border);
}

.group-count {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: 400;
}

.rank {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-secondary);
  min-width: 50px;
  text-align: center;
}

.vote-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.vote-wallet-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.vote-wallet {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: monospace;
}


.vote-meta {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.vote-result {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
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
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-accent-teal);
  min-width: 120px;
  text-align: right;
}
</style>


