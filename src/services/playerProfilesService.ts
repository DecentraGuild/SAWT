import { graphqlClient } from './graphqlClient'
import { ALL_PLAYER_PROFILES_QUERY } from '../queries/playerProfiles'

export interface PlayerProfile {
  account: string
  faction: string | null
  owner: string
  firstActive: string | null
  lastActive: string | null
  username: string | null
}

export interface PlayerProfilesResponse {
  allStarAtlasProfiles: {
    nodes: PlayerProfile[]
  }
}

/**
 * Fetch all player profiles from GraphQL
 */
export async function fetchAllPlayerProfiles(): Promise<PlayerProfile[]> {
  console.log('[Player Profiles] Starting fetch...')
  console.time('[Player Profiles] Query time')
  
  const response = await graphqlClient.query<PlayerProfilesResponse>({
    query: ALL_PLAYER_PROFILES_QUERY,
    fetchPolicy: 'network-only'
  })
  
  console.timeEnd('[Player Profiles] Query time')
  console.log('[Player Profiles] Profiles received:', response.data.allStarAtlasProfiles.nodes.length)

  return response.data.allStarAtlasProfiles.nodes
}

