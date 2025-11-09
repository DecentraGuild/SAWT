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

  return {
    address,
    startDate,
    endDate,
    transactions,
    setWalletAddress,
    setDateRange,
    setTransactions
  }
})

