# GraphQL Queries

This folder contains all GraphQL queries used in the application. Each query file is organized by feature/domain.

## How to Build GraphQL Queries

### Basic Structure

```typescript
import { gql } from '@apollo/client'

export const MY_QUERY = gql`
  query MyQuery($variable: String!) {
    fieldName(condition: { field: $variable }) {
      field1
      field2
      nestedField {
        subField1
        subField2
      }
    }
  }
`
```

### Key Concepts

1. **Query vs Mutation**: 
   - `query` - for reading data (GET-like)
   - `mutation` - for modifying data (POST/PUT/DELETE-like)

2. **Variables**: Use `$variableName: Type!` to define variables
   - `!` means required
   - Types: `String`, `Int`, `Float`, `Boolean`, `Cursor` (for pagination)

3. **Fields**: Select only the fields you need
   - Use `__typename` for type information (helpful for debugging)

4. **Pagination**: Use `first`, `after`, `last`, `before` with `Cursor` type
   ```graphql
   query($first: Int = 100, $after: Cursor) {
     field(first: $first, after: $after) {
       pageInfo {
         hasNextPage
         endCursor
       }
       nodes {
         # your fields
       }
     }
   }
   ```

5. **Filtering/Conditions**: Use `condition` parameter
   ```graphql
   allStarAtlasProposalVotes(
     condition: { walletPublicKey: $wallet }
   )
   ```

6. **Sorting**: Use `orderBy` parameter
   ```graphql
   allStarAtlasProposalVotes(
     orderBy: CREATED_AT_DESC
   )
   ```

### Using Queries in Services

```typescript
import { graphqlClient } from './graphqlClient'
import { MY_QUERY } from '../queries/myQueries'

export async function fetchData(variable: string) {
  const result = await graphqlClient.query({
    query: MY_QUERY,
    variables: { variable }
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message)
  }

  return result.data
}
```

### Exploring Available Queries

Use the GraphQL explorer at `https://graph.roguedatahub.xyz/graphql` to:
1. See all available queries (like `starAtlasProposal`, `starAtlasProposalVote`, etc.)
2. Test queries interactively
3. See the schema structure
4. Get autocomplete suggestions

### Tips

- Always include `__typename` in nested objects for better debugging
- Use descriptive query names that match their purpose
- Group related queries in the same file
- Document complex queries with comments


