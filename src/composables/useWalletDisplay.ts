import { computed } from 'vue'
import { useTokenWrapperStore } from '../stores/tokenWrapper'
import { usePlayerProfilesStore } from '../stores/playerProfiles'
import { formatWallet } from '../utils/formatters'
import { FACTION_LOGOS } from '../utils/constants'
import type { Faction } from '../stores/playerProfiles'

/**
 * Composable for wallet display utilities
 * Provides functions to get wallet display names, faction info, and styling
 */
export function useWalletDisplay() {
  const tokenWrapperStore = useTokenWrapperStore()
  const playerProfilesStore = usePlayerProfilesStore()

  /**
   * Get username for a wallet
   */
  function getUsername(wallet: string): string | null {
    if (!wallet) return null
    return playerProfilesStore.getUsername(wallet)
  }

  /**
   * Get faction for a wallet
   */
  function getFaction(wallet: string): Faction {
    if (!wallet) return null
    return playerProfilesStore.getFaction(wallet)
  }

  /**
   * Get wallet display name - checks guild wallet name, username, or formatted wallet
   */
  function getWalletDisplayName(wallet: string): string {
    if (!wallet) return 'Unknown'
    // Check for guild wallet name first
    const guildName = tokenWrapperStore.getGuildWalletName(wallet)
    if (guildName) return guildName
    // Check for username
    const username = getUsername(wallet)
    if (username) return username
    // Fall back to formatted wallet address
    return formatWallet(wallet)
  }

  /**
   * Get faction class for styling
   */
  function getFactionClass(wallet: string): string {
    if (!wallet) return ''
    const faction = getFaction(wallet)
    if (!faction) return ''
    return `faction-${faction.toLowerCase()}`
  }

  /**
   * Get faction logo path
   */
  function getFactionLogo(wallet: string): string | undefined {
    if (!wallet) return undefined
    const faction = getFaction(wallet)
    if (!faction) return undefined
    return FACTION_LOGOS[faction] || undefined
  }

  /**
   * Get token display name - checks token name mapping or formatted mint address
   */
  function getTokenDisplayName(tokenMint: string): string {
    if (!tokenMint) return 'Unknown'
    // Check for token name first
    const tokenName = tokenWrapperStore.getTokenName(tokenMint)
    if (tokenName) return tokenName
    // Fall back to formatted mint address
    return formatWallet(tokenMint)
  }

  /**
   * Get highlight class for wallet rows based on faction
   */
  function getWalletHighlightClass(wallet: string): string {
    if (!wallet) return ''
    const faction = getFaction(wallet)
    if (!faction) return 'wallet-highlight-default'
    return `wallet-highlight-faction-${faction.toLowerCase()}`
  }

  return {
    getUsername,
    getFaction,
    getWalletDisplayName,
    getFactionClass,
    getFactionLogo,
    getTokenDisplayName,
    getWalletHighlightClass
  }
}

