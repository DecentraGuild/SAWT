/**
 * Shared constants across the application
 */

// Token decimals for Solana tokens
export const TOKEN_DECIMALS = 8
export const DECIMAL_DIVISOR = Math.pow(10, TOKEN_DECIMALS)

// Faction logo base URL
export const FACTION_LOGO_BASE_URL = 'https://raw.githubusercontent.com/DecentraGuild/SAWT/main/public'

// Faction logo paths
export const FACTION_LOGOS = {
  MUD: `${FACTION_LOGO_BASE_URL}/MUD.svg`,
  USTUR: `${FACTION_LOGO_BASE_URL}/Ustur.svg`,
  ONI: `${FACTION_LOGO_BASE_URL}/ONI.svg`
} as const

