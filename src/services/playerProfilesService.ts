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
  const response = await graphqlClient.query<PlayerProfilesResponse>({
    query: ALL_PLAYER_PROFILES_QUERY,
    fetchPolicy: 'network-only'
  })

  return response.data.allStarAtlasProfiles.nodes
}

