import { gql } from '@apollo/client'

/**
 * Query to fetch all Star Atlas player profiles
 * 
 * @example
 * query MyQuery {
 *   allStarAtlasProfiles {
 *     nodes {
 *       account
 *       faction
 *       owner
 *       firstActive
 *       lastActive
 *       username
 *     }
 *   }
 * }
 */
export const ALL_PLAYER_PROFILES_QUERY = gql`
  query AllPlayerProfiles {
    allStarAtlasProfiles {
      nodes {
        account
        faction
        owner
        firstActive
        lastActive
        username
      }
    }
  }
`

