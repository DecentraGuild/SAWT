import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAllPlayerProfiles, type PlayerProfile } from '../services/playerProfilesService'

export type Faction = 'MUD' | 'USTUR' | 'ONI' | null

export const usePlayerProfilesStore = defineStore('playerProfiles', () => {
  const profiles = ref<PlayerProfile[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Create a map for fast wallet lookup
  const profilesByOwner = computed(() => {
    const map = new Map<string, PlayerProfile>()
    profiles.value.forEach(profile => {
      if (profile.owner) {
        map.set(profile.owner.toLowerCase(), profile)
      }
    })
    return map
  })

  // Create a map for account lookup as well
  const profilesByAccount = computed(() => {
    const map = new Map<string, PlayerProfile>()
    profiles.value.forEach(profile => {
      if (profile.account) {
        map.set(profile.account.toLowerCase(), profile)
      }
    })
    return map
  })

  /**
   * Get profile by wallet address (owner or account)
   */
  function getProfileByWallet(wallet: string): PlayerProfile | null {
    if (!wallet) return null
    const walletLower = wallet.toLowerCase()
    return profilesByOwner.value.get(walletLower) || profilesByAccount.value.get(walletLower) || null
  }

  /**
   * Get username for a wallet address
   */
  function getUsername(wallet: string): string | null {
    const profile = getProfileByWallet(wallet)
    return profile?.username || null
  }

  /**
   * Get faction for a wallet address
   */
  function getFaction(wallet: string): Faction {
    const profile = getProfileByWallet(wallet)
    if (!profile?.faction) return null
    
    const faction = profile.faction.toUpperCase()
    if (faction === 'MUD' || faction === 'USTUR' || faction === 'ONI') {
      return faction as Faction
    }
    return null
  }

  /**
   * Fetch all player profiles
   */
  async function fetchProfiles() {
    loading.value = true
    error.value = null

    try {
      profiles.value = await fetchAllPlayerProfiles()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch player profiles'
      profiles.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    profiles,
    loading,
    error,
    profilesByOwner,
    profilesByAccount,
    getProfileByWallet,
    getUsername,
    getFaction,
    fetchProfiles
  }
})

