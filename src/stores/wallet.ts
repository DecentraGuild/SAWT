import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface WalletState {
  address: string
  startDate: string
  endDate: string
  transactions: any[]
}

export const useWalletStore = defineStore('wallet', () => {
  const address = ref<string>('')
  const startDate = ref<string>('')
  const endDate = ref<string>('')
  const transactions = ref<any[]>([])
  const refreshTrigger = ref<number>(0) // Counter to force refreshes

  function setWalletAddress(addr: string) {
    address.value = addr
  }

  function setDateRange(start: string, end: string) {
    startDate.value = start
    endDate.value = end
  }

  function setTransactions(data: any[]) {
    transactions.value = data
  }

  function triggerRefresh() {
    refreshTrigger.value++
  }

  return {
    address,
    startDate,
    endDate,
    transactions,
    refreshTrigger,
    setWalletAddress,
    setDateRange,
    setTransactions,
    triggerRefresh
  }
})

