import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

// Use proxy in development to avoid CORS issues, direct URL in production
const graphqlUrl = import.meta.env.DEV 
  ? '/graphql' 
  : 'https://graph.roguedatahub.xyz/graphql'

const httpLink = createHttpLink({
  uri: graphqlUrl,
})

export const graphqlClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Always fetch from network
    },
    query: {
      fetchPolicy: 'network-only', // Always fetch from network
    },
  },
})

